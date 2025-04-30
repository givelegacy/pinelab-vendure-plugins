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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeSubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@vendure/core");
const constants_1 = require("../constants");
const stripe_subscription_service_1 = require("./stripe-subscription.service");
let StripeSubscriptionController = class StripeSubscriptionController {
    constructor(stripeSubscriptionService, orderService, options) {
        this.stripeSubscriptionService = stripeSubscriptionService;
        this.orderService = orderService;
        this.options = options;
    }
    async webhook(request) {
        const body = request.body;
        core_1.Logger.info(`Incoming webhook ${body.type}`, constants_1.loggerCtx);
        // Validate if metadata present
        const orderCode = body.data.object.metadata?.orderCode ??
            body.data.object.lines?.data[0]?.metadata.orderCode;
        const channelToken = body.data.object.metadata?.channelToken ??
            body.data.object.lines?.data[0]?.metadata
                .channelToken;
        if (!stripe_subscription_service_1.StripeSubscriptionService.webhookEvents.includes(body.type)) {
            core_1.Logger.info(`Received incoming '${body.type}' webhook, not processing this event.`, constants_1.loggerCtx);
            return;
        }
        if (!orderCode || !channelToken) {
            // For some reason we get a webhook without metadata first, we ignore it
            return core_1.Logger.info(`Incoming webhook is missing metadata.orderCode/channelToken, ignoring. We should receive another one with metadata...`, constants_1.loggerCtx);
        }
        try {
            const ctx = await this.stripeSubscriptionService.createContext(channelToken, request);
            const order = await this.orderService.findOneByCode(ctx, orderCode);
            if (!order) {
                throw Error(`Cannot find order with code ${orderCode}`); // Throw inside catch block, so Stripe will retry
            }
            if (body.type === 'payment_intent.succeeded' ||
                body.type === 'setup_intent.succeeded') {
                await this.stripeSubscriptionService.handleIntentSucceeded(ctx, body.data.object, order);
            }
            else if (body.type === 'invoice.payment_failed' ||
                body.type === 'invoice.payment_action_required') {
                const invoiceObject = body.data.object;
                await this.stripeSubscriptionService.handleInvoicePaymentFailed(ctx, invoiceObject.id, order);
            }
            core_1.Logger.info(`Successfully handled webhook ${body.type}`, constants_1.loggerCtx);
        }
        catch (error) {
            // Catch all for logging purposes
            core_1.Logger.error(`Failed to process incoming webhook ${body.type} (${body.id}): ${error?.message}`, constants_1.loggerCtx, error?.stack);
            throw error;
        }
    }
};
exports.StripeSubscriptionController = StripeSubscriptionController;
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "webhook", null);
exports.StripeSubscriptionController = StripeSubscriptionController = __decorate([
    (0, common_1.Controller)('stripe-subscriptions'),
    __param(2, (0, common_1.Inject)(constants_1.PLUGIN_INIT_OPTIONS)),
    __metadata("design:paramtypes", [stripe_subscription_service_1.StripeSubscriptionService,
        core_1.OrderService, Object])
], StripeSubscriptionController);
