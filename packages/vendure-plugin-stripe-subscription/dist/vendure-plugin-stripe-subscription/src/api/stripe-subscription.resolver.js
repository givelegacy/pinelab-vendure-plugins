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
exports.StripeSubscriptionAdminApiResolver = exports.StripeSubscriptionShopApiResolver = exports.StripeSubscriptionCommonResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const core_1 = require("@vendure/core");
const stripe_subscription_service_1 = require("./stripe-subscription.service");
// Resolver for both Shop and Admin API
let StripeSubscriptionCommonResolver = class StripeSubscriptionCommonResolver {
    constructor(stripeSubscriptionService, paymentMethodService, entityHydrator, productPriceApplicator) {
        this.stripeSubscriptionService = stripeSubscriptionService;
        this.paymentMethodService = paymentMethodService;
        this.entityHydrator = entityHydrator;
        this.productPriceApplicator = productPriceApplicator;
    }
    async previewStripeSubscriptions(ctx, { productVariantId, customInputs }) {
        return this.stripeSubscriptionService.subscriptionHelper.previewSubscription(ctx, productVariantId, customInputs);
    }
    async previewStripeSubscriptionsForProduct(ctx, { productId, customInputs }) {
        return this.stripeSubscriptionService.subscriptionHelper.previewSubscriptionsForProduct(ctx, productId, customInputs);
    }
    async stripeSubscriptionPublishableKey(ctx, paymentMethodQuote) {
        const paymentMethod = await this.paymentMethodService.findOne(ctx, paymentMethodQuote.id);
        return paymentMethod?.handler.args.find((a) => a.name === 'publishableKey')
            ?.value;
    }
    async stripeSubscriptions(ctx, orderLine) {
        await this.entityHydrator.hydrate(ctx, orderLine, {
            relations: ['order', 'productVariant'],
        });
        await this.entityHydrator.hydrate(ctx, orderLine.productVariant, {
            relations: ['productVariantPrices', 'taxCategory'],
        });
        await this.productPriceApplicator.applyChannelPriceAndTax(orderLine.productVariant, ctx, orderLine.order);
        const subscriptionsForOrderLine = await this.stripeSubscriptionService.subscriptionHelper.getSubscriptionsForOrderLine(ctx, orderLine, orderLine.order);
        return subscriptionsForOrderLine.map((s) => ({
            ...s,
            variantId: orderLine.productVariant.id,
        }));
    }
};
exports.StripeSubscriptionCommonResolver = StripeSubscriptionCommonResolver;
__decorate([
    (0, graphql_1.Query)(),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, Object]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionCommonResolver.prototype, "previewStripeSubscriptions", null);
__decorate([
    (0, graphql_1.Query)(),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, Object]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionCommonResolver.prototype, "previewStripeSubscriptionsForProduct", null);
__decorate([
    (0, graphql_1.ResolveField)('stripeSubscriptionPublishableKey'),
    (0, graphql_1.Resolver)('PaymentMethodQuote'),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, Object]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionCommonResolver.prototype, "stripeSubscriptionPublishableKey", null);
__decorate([
    (0, graphql_1.ResolveField)('stripeSubscriptions'),
    (0, graphql_1.Resolver)('OrderLine'),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext,
        core_1.OrderLine]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionCommonResolver.prototype, "stripeSubscriptions", null);
exports.StripeSubscriptionCommonResolver = StripeSubscriptionCommonResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [stripe_subscription_service_1.StripeSubscriptionService,
        core_1.PaymentMethodService,
        core_1.EntityHydrator,
        core_1.ProductPriceApplicator])
], StripeSubscriptionCommonResolver);
let StripeSubscriptionShopApiResolver = class StripeSubscriptionShopApiResolver {
    constructor(stripeSubscriptionService) {
        this.stripeSubscriptionService = stripeSubscriptionService;
    }
    async createStripeSubscriptionIntent(ctx) {
        const stripePaymentMethods = ['card']; // TODO make configurable per channel
        const setupFutureUsage = 'off_session'; // TODO make configurable per channel
        const res = await this.stripeSubscriptionService.createIntent(ctx, stripePaymentMethods, setupFutureUsage);
        return res;
    }
};
exports.StripeSubscriptionShopApiResolver = StripeSubscriptionShopApiResolver;
__decorate([
    (0, graphql_1.Mutation)(),
    (0, core_1.Allow)(core_1.Permission.Owner),
    __param(0, (0, core_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionShopApiResolver.prototype, "createStripeSubscriptionIntent", null);
exports.StripeSubscriptionShopApiResolver = StripeSubscriptionShopApiResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [stripe_subscription_service_1.StripeSubscriptionService])
], StripeSubscriptionShopApiResolver);
let StripeSubscriptionAdminApiResolver = class StripeSubscriptionAdminApiResolver {
    constructor(stripeSubscriptionService) {
        this.stripeSubscriptionService = stripeSubscriptionService;
    }
    async createStripeSubscriptionIntent(ctx, args) {
        const stripePaymentMethods = ['card']; // TODO make configurable per channel
        const setupFutureUsage = 'off_session'; // TODO make configurable per channel
        const res = await this.stripeSubscriptionService.createIntentForDraftOrder(ctx, args.orderId, stripePaymentMethods, setupFutureUsage);
        return res;
    }
};
exports.StripeSubscriptionAdminApiResolver = StripeSubscriptionAdminApiResolver;
__decorate([
    (0, graphql_1.Mutation)(),
    (0, core_1.Allow)(core_1.Permission.Owner),
    __param(0, (0, core_1.Ctx)()),
    __param(1, (0, graphql_1.Args)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [core_1.RequestContext, Object]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionAdminApiResolver.prototype, "createStripeSubscriptionIntent", null);
exports.StripeSubscriptionAdminApiResolver = StripeSubscriptionAdminApiResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [stripe_subscription_service_1.StripeSubscriptionService])
], StripeSubscriptionAdminApiResolver);
