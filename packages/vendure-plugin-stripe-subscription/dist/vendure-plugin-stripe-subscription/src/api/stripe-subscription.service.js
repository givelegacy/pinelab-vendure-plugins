"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StripeSubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeSubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const generated_types_1 = require("@vendure/common/lib/generated-types");
const core_2 = require("@vendure/core");
const operators_1 = require("rxjs/operators");
const __1 = require("../");
const constants_1 = require("../constants");
const stripe_client_1 = require("./stripe.client");
const util_1 = require("./util");
const stripe_subscription_handler_1 = require("./vendure-config/stripe-subscription.handler");
let StripeSubscriptionService = StripeSubscriptionService_1 = class StripeSubscriptionService {
    constructor(paymentMethodService, activeOrderService, entityHydrator, channelService, orderService, historyService, eventBus, jobQueueService, moduleRef, connection, productVariantService, options) {
        this.paymentMethodService = paymentMethodService;
        this.activeOrderService = activeOrderService;
        this.entityHydrator = entityHydrator;
        this.channelService = channelService;
        this.orderService = orderService;
        this.historyService = historyService;
        this.eventBus = eventBus;
        this.jobQueueService = jobQueueService;
        this.moduleRef = moduleRef;
        this.connection = connection;
        this.options = options;
        this.subscriptionHelper = new __1.SubscriptionHelper(constants_1.loggerCtx, moduleRef, productVariantService, this.options.subscriptionStrategy);
    }
    async onModuleInit() {
        // Create jobQueue with handlers
        this.jobQueue = await this.jobQueueService.createQueue({
            name: 'stripe-subscription',
            process: async ({ data, id }) => {
                const ctx = core_2.RequestContext.deserialize(data.ctx);
                if (data.action === 'cancelSubscriptionsForOrderline') {
                    this.cancelSubscriptionForOrderLine(ctx, data.orderLineId);
                }
                else {
                    core_2.Logger.error(`Unknown action '${data.action}' in job queue ${this.jobQueue.name}`, constants_1.loggerCtx);
                }
            },
        });
        // Listen for stock cancellation or release events, to cancel an order lines subscription
        this.eventBus
            .ofType(core_2.StockMovementEvent)
            .pipe((0, operators_1.filter)((event) => event.type === generated_types_1.StockMovementType.RELEASE ||
            event.type === generated_types_1.StockMovementType.CANCELLATION))
            .subscribe(async (event) => {
            const cancelOrReleaseEvents = event.stockMovements;
            const stockEvents = cancelOrReleaseEvents
                // Filter out non-sub orderlines
                .filter((event) => event.orderLine.customFields.subscriptionIds);
            await Promise.all(
            // Push jobs
            stockEvents.map((stockEvent) => this.jobQueue.add({
                ctx: event.ctx.serialize(),
                action: 'cancelSubscriptionsForOrderline',
                orderLineId: stockEvent.orderLine.id,
            })));
        });
        // Listen for PaymentMethod create or update, to automatically create webhooks
        this.eventBus.ofType(core_2.PaymentMethodEvent).subscribe(async (event) => {
            if (event.type === 'created' || event.type === 'updated') {
                const paymentMethod = event.entity;
                if (paymentMethod.handler?.code === stripe_subscription_handler_1.stripeSubscriptionHandler.code) {
                    await this.registerWebhooks(event.ctx, paymentMethod).catch((e) => {
                        core_2.Logger.error(`Failed to register webhooks for channel ${event.ctx.channel.token}: ${e}`, constants_1.loggerCtx);
                    });
                }
            }
        });
    }
    /**
     * Register webhook with the right events if they don't exist yet.
     * If already exists, the existing hook is deleted and a new one is created.
     * Existence is checked by name.
     *
     * Saves the webhook secret irectly on the payment method
     */
    async registerWebhooks(ctx, paymentMethod) {
        const webhookDescription = `Vendure Stripe Subscription Webhook for channel ${ctx.channel.token}`;
        const apiKey = paymentMethod.handler.args.find((arg) => arg.name === 'apiKey')?.value;
        if (!apiKey) {
            throw new core_2.UserInputError(`No api key found for payment method ${paymentMethod.code}, can not register webhooks`);
        }
        const stripeClient = new stripe_client_1.StripeClient('not-yet-available-secret', apiKey, {
            apiVersion: null, // Null uses accounts default version
        });
        const webhookUrl = `${this.options.vendureHost}/stripe-subscriptions/webhook`;
        // Get existing webhooks and check if url and events match. If not, create them
        const webhooks = await stripeClient.webhookEndpoints.list({ limit: 100 });
        if (webhooks.data.length === 100) {
            core_2.Logger.error(`Your Stripe account has too many webhooks setup, ` +
                `you will need to manually create the webhook with events ${StripeSubscriptionService_1.webhookEvents.join(', ')}`, constants_1.loggerCtx);
            return;
        }
        const existingWebhook = webhooks.data.find((w) => w.description === webhookDescription);
        if (existingWebhook) {
            await stripeClient.webhookEndpoints.del(existingWebhook.id);
        }
        const createdHook = await stripeClient.webhookEndpoints.create({
            enabled_events: StripeSubscriptionService_1.webhookEvents,
            description: webhookDescription,
            url: webhookUrl,
        });
        // Update webhook secret in paymentMethod
        paymentMethod.handler.args.forEach((arg) => {
            if (arg.name === 'webhookSecret') {
                arg.value = createdHook.secret;
            }
        });
        const res = await this.connection
            .getRepository(ctx, core_2.PaymentMethod)
            .save(paymentMethod);
        core_2.Logger.info(`Created webhook ${createdHook.id} for payment method '${res.code}' for channel ${ctx.channel.token}`, constants_1.loggerCtx);
        return createdHook;
    }
    async cancelSubscriptionForOrderLine(ctx, orderLineId) {
        const order = await this.orderService.findOneByOrderLineId(ctx, orderLineId, ['lines']);
        if (!order) {
            throw Error(`Order for OrderLine ${orderLineId} not found`);
        }
        const line = order?.lines.find((l) => l.id == orderLineId);
        if (!line?.customFields.subscriptionIds?.length) {
            return core_2.Logger.info(`OrderLine ${orderLineId} of ${orderLineId} has no subscriptionIds. Not cancelling anything... `, constants_1.loggerCtx);
        }
        await this.entityHydrator.hydrate(ctx, line, { relations: ['order'] });
        const { stripeClient } = await this.getStripeContext(ctx);
        for (const subscriptionId of line.customFields.subscriptionIds) {
            try {
                await stripeClient.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true,
                });
                core_2.Logger.info(`Cancelled subscription ${subscriptionId}`);
                await this.logHistoryEntry(ctx, order.id, `Cancelled subscription ${subscriptionId}`, undefined, undefined, subscriptionId);
            }
            catch (e) {
                core_2.Logger.error(`Failed to cancel subscription ${subscriptionId}`, constants_1.loggerCtx);
                await this.logHistoryEntry(ctx, order.id, `Failed to cancel ${subscriptionId}`, e, undefined, subscriptionId);
            }
        }
    }
    /**
     * Proxy to Stripe to retrieve subscriptions created for the current channel.
     * Proxies to the Stripe api, so you can use the same filtering, parameters and options as defined here
     * https://stripe.com/docs/api/subscriptions/list
     */
    async getAllSubscriptions(ctx, params, options) {
        const { stripeClient } = await this.getStripeContext(ctx);
        return stripeClient.subscriptions.list(params, options);
    }
    /**
     * Get a subscription directly from Stripe
     */
    async getSubscription(ctx, subscriptionId) {
        const { stripeClient } = await this.getStripeContext(ctx);
        return stripeClient.subscriptions.retrieve(subscriptionId);
    }
    async createIntent(ctx, stripePaymentMethods, setupFutureUsage) {
        let order = await this.activeOrderService.getActiveOrder(ctx, undefined);
        if (!order) {
            throw new core_2.UserInputError('No active order for session');
        }
        return this.createIntentByOrder(ctx, order, stripePaymentMethods, setupFutureUsage);
    }
    async createIntentForDraftOrder(ctx, orderId, stripePaymentMethods, setupFutureUsage) {
        let order = await this.orderService.findOne(ctx, orderId);
        if (!order) {
            throw new core_2.EntityNotFoundError('Order', orderId);
        }
        // TODO Perhaps need an order state check (Draft, ArrangingPayment) here?
        // But state transition verification will likely be a good place for this as well
        return this.createIntentByOrder(ctx, order, stripePaymentMethods, setupFutureUsage);
    }
    async createIntentByOrder(ctx, order, stripePaymentMethods, setupFutureUsage) {
        await this.entityHydrator.hydrate(ctx, order, {
            relations: ['customer', 'shippingLines', 'lines.productVariant'],
            applyProductVariantPrices: true,
        });
        if (!order.lines?.length) {
            throw new core_2.UserInputError('Cannot create intent for empty order');
        }
        if (!order.customer) {
            throw new core_2.UserInputError('Cannot create intent for order without customer');
        }
        if (!order.shippingLines?.length) {
            throw new core_2.UserInputError('Cannot create intent for order without shippingMethod');
        }
        // Check if Stripe Subscription paymentMethod is eligible for this order
        const eligibleStripeMethodCodes = (await this.orderService.getEligiblePaymentMethods(ctx, order.id))
            .filter((m) => m.isEligible)
            .map((m) => m.code);
        const { stripeClient, paymentMethod } = await this.getStripeContext(ctx);
        if (!eligibleStripeMethodCodes.includes(paymentMethod.code)) {
            throw new core_2.UserInputError(`No eligible payment method found for order ${order.code} with handler code '${stripe_subscription_handler_1.stripeSubscriptionHandler.code}'`);
        }
        await this.orderService.transitionToState(ctx, order.id, 'ArrangingPayment');
        const stripeCustomer = await stripeClient.getOrCreateCustomer(order.customer);
        let intent;
        if (order.totalWithTax > 0) {
            // Create PaymentIntent + off_session, because we have both one-time and recurring payments. Order total is only > 0 if there are one-time payments
            intent = await stripeClient.paymentIntents.create({
                customer: stripeCustomer.id,
                payment_method_types: stripePaymentMethods,
                setup_future_usage: setupFutureUsage,
                amount: order.totalWithTax,
                currency: order.currencyCode,
                metadata: {
                    orderCode: order.code,
                    channelToken: ctx.channel.token,
                    amount: order.totalWithTax,
                },
            });
        }
        else {
            // Create SetupIntent, because we only have recurring payments
            intent = await stripeClient.setupIntents.create({
                customer: stripeCustomer.id,
                payment_method_types: stripePaymentMethods,
                usage: 'off_session',
                metadata: {
                    orderCode: order.code,
                    channelToken: ctx.channel.token,
                    amount: order.totalWithTax,
                },
            });
        }
        const intentType = intent.object === 'payment_intent' ? 'PaymentIntent' : 'SetupIntent';
        if (!intent.client_secret) {
            throw Error(`No client_secret found in ${intentType} response, something went wrong!`);
        }
        core_2.Logger.info(`Created ${intentType} '${intent.id}' for order ${order.code}`, constants_1.loggerCtx);
        return {
            clientSecret: intent.client_secret,
            intentType,
        };
    }
    /**
     * Handle failed subscription payments that come in after the initial payment intent
     */
    async handleInvoicePaymentFailed(ctx, invoiceId, order) {
        // TODO: Emit StripeSubscriptionPaymentFailed(subscriptionId, order, stripeInvoiceObject: StripeInvoice)
        const { stripeClient } = await this.getStripeContext(ctx);
        const invoice = await stripeClient.invoices.retrieve(invoiceId);
        const amount = invoice.lines?.data[0]?.plan?.amount;
        const message = amount
            ? `Subscription payment of ${(0, util_1.printMoney)(amount)} failed`
            : 'Subscription payment failed';
        await this.logHistoryEntry(ctx, order.id, message, `${message} - ${invoice.id}`, undefined, invoice.subscription);
    }
    /**
     * Handle the initial succeeded setup or payment intent.
     * Creates subscriptions in Stripe in the background via the jobqueue
     */
    async handleIntentSucceeded(ctx, object, order) {
        const { paymentMethod: { code: paymentMethodCode }, stripeClient, } = await this.getStripeContext(ctx);
        if (!object.customer) {
            await this.logHistoryEntry(ctx, order.id, '', `No customer ID found in incoming webhook. Can not create subscriptions for this order.`);
            throw Error(`No customer found in webhook data for order ${order.code}`);
        }
        // Fetch setup or payment intent from Stripe
        let intent;
        if (object.object === 'payment_intent') {
            intent = await stripeClient.paymentIntents.retrieve(object.id);
        }
        else {
            intent = await stripeClient.setupIntents.retrieve(object.id);
        }
        if (intent.status !== 'succeeded') {
            throw Error(`Intent '${object.id}' for order '${order.code}' is not succeeded, but '${intent.status}'. Not handling this event.`);
        }
        // Create subscriptions for customer
        try {
            await this.createSubscriptions(ctx, order.code, object.customer, object.payment_method);
        }
        catch (error) {
            core_2.Logger.error(`Failed to create subscription for order '${order.code}' for channel ${ctx.channel.token}: ${error}`, constants_1.loggerCtx);
            if (order) {
                await this.logHistoryEntry(ctx, order.id, 'Failed to create subscription', error);
            }
        }
        // Settle payment for order
        if (order.state !== 'ArrangingPayment') {
            const transitionToStateResult = await this.orderService.transitionToState(ctx, order.id, 'ArrangingPayment');
            if (transitionToStateResult instanceof core_2.OrderStateTransitionError) {
                throw Error(`Error transitioning order ${order.code} from ${transitionToStateResult.fromState} to ${transitionToStateResult.toState}: ${transitionToStateResult.message}`);
            }
        }
        const addPaymentToOrderResult = await this.orderService.addPaymentToOrder(ctx, order.id, {
            method: paymentMethodCode,
            metadata: {
                setupIntentId: object.id,
                amount: object.metadata.amount,
            },
        });
        if (addPaymentToOrderResult.errorCode) {
            throw Error(`[${constants_1.loggerCtx}]: Error adding payment to order ${order.code}: ${addPaymentToOrderResult.message}`);
        }
        core_2.Logger.info(`Successfully settled payment for order ${order.code} with amount ${(0, util_1.printMoney)(object.metadata.amount)}, for channel ${ctx.channel.token}`, constants_1.loggerCtx);
    }
    /**
     * Create subscriptions for customer based on order
     */
    async createSubscriptions(ctx, orderCode, stripeCustomerId, stripePaymentMethodId) {
        const order = await this.orderService.findOneByCode(ctx, orderCode, [
            'customer',
            'lines',
            'lines.productVariant',
        ]);
        if (!order) {
            throw Error(`[${constants_1.loggerCtx}]: Cannot find order with code ${orderCode}`);
        }
        try {
            if (!(await this.subscriptionHelper.hasSubscriptions(ctx, order))) {
                core_2.Logger.info(`Order ${order.code} doesn't have any subscriptions. No action needed`, constants_1.loggerCtx);
                return;
            }
            const { stripeClient } = await this.getStripeContext(ctx);
            const customer = await stripeClient.customers.retrieve(stripeCustomerId);
            if (!customer) {
                throw Error(`[${constants_1.loggerCtx}]: Failed to create subscription for customer ${stripeCustomerId} because it doesn't exist in Stripe`);
            }
            const subscriptionDefinitions = await this.subscriptionHelper.getSubscriptionsForOrder(ctx, order);
            core_2.Logger.info(`Creating subscriptions for ${orderCode}`, constants_1.loggerCtx);
            // <orderLineId, subscriptionIds>
            const subscriptionsPerOrderLine = new Map();
            for (const subscriptionDefinition of subscriptionDefinitions) {
                try {
                    const product = await stripeClient.products.create({
                        name: subscriptionDefinition.name,
                    });
                    const createdSubscription = await stripeClient.createOffSessionSubscription({
                        customerId: stripeCustomerId,
                        productId: product.id,
                        currencyCode: order.currencyCode,
                        amount: subscriptionDefinition.recurring.amount,
                        interval: subscriptionDefinition.recurring.interval,
                        intervalCount: subscriptionDefinition.recurring.intervalCount,
                        paymentMethodId: stripePaymentMethodId,
                        startDate: subscriptionDefinition.recurring.startDate,
                        endDate: subscriptionDefinition.recurring.endDate,
                        description: `'${subscriptionDefinition.name} for order '${order.code}'`,
                        orderCode: order.code,
                        channelToken: ctx.channel.token,
                    });
                    if (createdSubscription.status !== 'active' &&
                        createdSubscription.status !== 'trialing') {
                        // Created subscription is not active for some reason. Log error and continue to next
                        core_2.Logger.error(`Failed to create active subscription ${subscriptionDefinition.name} (${createdSubscription.id}) for order ${order.code}! It is still in status '${createdSubscription.status}'`, constants_1.loggerCtx);
                        await this.logHistoryEntry(ctx, order.id, `Failed to create subscription ${subscriptionDefinition.name}`, `Subscription status is ${createdSubscription.status}`, subscriptionDefinition, createdSubscription.id);
                        continue;
                    }
                    core_2.Logger.info(`Created subscription '${subscriptionDefinition.name}' (${createdSubscription.id}): ${(0, util_1.printMoney)(subscriptionDefinition.recurring.amount)}`, constants_1.loggerCtx);
                    await this.logHistoryEntry(ctx, order.id, `Created subscription for ${subscriptionDefinition.name}`, undefined, subscriptionDefinition, createdSubscription.id);
                    // Add created subscriptions per order line
                    const existingSubscriptionIds = subscriptionsPerOrderLine.get(subscriptionDefinition.orderLineId) ||
                        [];
                    existingSubscriptionIds.push(createdSubscription.id);
                    subscriptionsPerOrderLine.set(subscriptionDefinition.orderLineId, existingSubscriptionIds);
                }
                catch (e) {
                    await this.logHistoryEntry(ctx, order.id, 'An unknown error occured creating subscriptions', e);
                    throw e;
                }
            }
            // Save subscriptionIds per order line
            for (const [orderLineId, subscriptionIds,] of subscriptionsPerOrderLine.entries()) {
                await this.saveSubscriptionIds(ctx, orderLineId, subscriptionIds);
            }
        }
        catch (e) {
            await this.logHistoryEntry(ctx, order.id, '', e);
            throw e;
        }
    }
    /**
     * Save subscriptionIds on order line
     */
    async saveSubscriptionIds(ctx, orderLineId, subscriptionIds) {
        await this.connection
            .getRepository(ctx, core_2.OrderLine)
            .update({ id: orderLineId }, { customFields: { subscriptionIds } });
    }
    async createContext(channelToken, req) {
        const channel = await this.channelService.getChannelFromToken(channelToken);
        return new core_2.RequestContext({
            apiType: 'admin',
            isAuthorized: true,
            authorizedAsOwnerOnly: false,
            channel,
            languageCode: core_2.LanguageCode.en,
            req,
        });
    }
    /**
     * Get the Stripe context for the current channel.
     * The Stripe context consists of the Stripe client and the Vendure payment method connected to the Stripe account
     */
    async getStripeContext(ctx) {
        const paymentMethods = await this.paymentMethodService.findAll(ctx, {
            filter: { enabled: { eq: true } },
        });
        const stripePaymentMethods = paymentMethods.items.filter((pm) => pm.handler.code === stripe_subscription_handler_1.stripeSubscriptionHandler.code);
        if (stripePaymentMethods.length > 1) {
            throw new core_2.UserInputError(`Multiple payment methods found with handler 'stripe-subscription', there should only be 1 per channel!`);
        }
        const paymentMethod = stripePaymentMethods[0];
        if (!paymentMethod) {
            throw new core_2.UserInputError(`No enabled payment method found with handler 'stripe-subscription'`);
        }
        const apiKey = paymentMethod.handler.args.find((arg) => arg.name === 'apiKey')?.value;
        let webhookSecret = paymentMethod.handler.args.find((arg) => arg.name === 'webhookSecret')?.value;
        if (!apiKey) {
            core_2.Logger.warn(`No api key is configured for ${paymentMethod.code}`, constants_1.loggerCtx);
            throw Error(`Payment method ${paymentMethod.code} has no api key configured`);
        }
        if (!webhookSecret) {
            core_2.Logger.warn(`No webhook secret configured for ${paymentMethod.code}`, constants_1.loggerCtx);
            throw Error(`Payment method ${paymentMethod.code} has no webhook secret configured`);
        }
        return {
            paymentMethod: paymentMethod,
            stripeClient: new stripe_client_1.StripeClient(webhookSecret, apiKey, {
                apiVersion: null, // Null uses accounts default version
            }),
        };
    }
    async logHistoryEntry(ctx, orderId, message, error, subscription, subscriptionId) {
        let prettifiedError = error
            ? JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
            : undefined; // Make sure its serializable
        await this.historyService.createHistoryEntryForOrder({
            ctx,
            orderId,
            type: 'STRIPE_SUBSCRIPTION_NOTIFICATION',
            data: {
                message,
                valid: !error,
                error: prettifiedError,
                subscriptionId,
                subscription,
            },
        }, false);
    }
};
exports.StripeSubscriptionService = StripeSubscriptionService;
/**
 * The plugin expects these events to come in via webhooks
 */
StripeSubscriptionService.webhookEvents = [
    'payment_intent.succeeded',
    'setup_intent.succeeded',
    'invoice.payment_failed',
    'invoice.payment_succeeded',
    'invoice.payment_action_required',
];
exports.StripeSubscriptionService = StripeSubscriptionService = StripeSubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(11, (0, common_1.Inject)(constants_1.PLUGIN_INIT_OPTIONS)),
    __metadata("design:paramtypes", [core_2.PaymentMethodService,
        core_2.ActiveOrderService,
        core_2.EntityHydrator,
        core_2.ChannelService,
        core_2.OrderService,
        core_2.HistoryService,
        core_2.EventBus,
        core_2.JobQueueService,
        core_1.ModuleRef,
        core_2.TransactionalConnection,
        core_2.ProductVariantService, Object])
], StripeSubscriptionService);
