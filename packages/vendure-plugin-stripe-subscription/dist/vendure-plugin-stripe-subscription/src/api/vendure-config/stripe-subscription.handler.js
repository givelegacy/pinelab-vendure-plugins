"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeSubscriptionHandler = void 0;
const core_1 = require("@vendure/core");
const constants_1 = require("../../constants");
const stripe_subscription_service_1 = require("../stripe-subscription.service");
const util_1 = require("../util");
let service;
exports.stripeSubscriptionHandler = new core_1.PaymentMethodHandler({
    code: 'stripe-subscription',
    description: [
        {
            languageCode: core_1.LanguageCode.en,
            value: 'Stripe Subscription',
        },
    ],
    args: {
        apiKey: {
            type: 'string',
            label: [{ languageCode: core_1.LanguageCode.en, value: 'API key' }],
            ui: { component: 'password-form-input' },
        },
        publishableKey: {
            type: 'string',
            required: false,
            label: [{ languageCode: core_1.LanguageCode.en, value: 'Publishable key' }],
            description: [
                {
                    languageCode: core_1.LanguageCode.en,
                    value: 'For use in the storefront only.',
                },
            ],
        },
        webhookSecret: {
            type: 'string',
            required: false,
            label: [
                {
                    languageCode: core_1.LanguageCode.en,
                    value: 'Webhook secret',
                },
            ],
            description: [
                {
                    languageCode: core_1.LanguageCode.en,
                    value: 'Secret to validate incoming webhooks. Get this from he created webhooks in your Stripe dashboard',
                },
            ],
            ui: { component: 'password-form-input' },
        },
    },
    init(injector) {
        service = injector.get(stripe_subscription_service_1.StripeSubscriptionService);
    },
    async createPayment(ctx, order, amount, _, metadata) {
        // Payment is already settled in Stripe by the time the webhook in stripe.controller.ts
        // adds the payment to the order
        if (ctx.apiType !== 'admin') {
            throw Error(`CreatePayment is not allowed for apiType '${ctx.apiType}'`);
        }
        return {
            amount: metadata.amount,
            state: 'Settled',
            transactionId: metadata.setupIntentId,
            metadata,
        };
    },
    settlePayment() {
        // Payments will be settled via webhook
        return {
            success: true,
        };
    },
    async createRefund(ctx, input, amount, order, payment, args) {
        const { stripeClient } = await service.getStripeContext(ctx);
        const refund = await stripeClient.refunds.create({
            payment_intent: payment.transactionId,
            amount,
        });
        core_1.Logger.info(`Refund of ${(0, util_1.printMoney)(amount)} created for payment ${payment.transactionId} for order ${order.id}`, constants_1.loggerCtx);
        await service.logHistoryEntry(ctx, order.id, `Created refund of ${(0, util_1.printMoney)(amount)}`);
        return {
            state: 'Settled',
            metadata: refund,
        };
    },
});
