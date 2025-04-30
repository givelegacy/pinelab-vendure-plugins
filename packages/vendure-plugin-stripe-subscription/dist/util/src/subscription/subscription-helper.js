"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionHelper = void 0;
const core_1 = require("@vendure/core");
/**
 * Helper for payment-provider independent subscription logic
 */
class SubscriptionHelper {
    constructor(loggerCtx, moduleRef, productVariantService, strategy) {
        this.loggerCtx = loggerCtx;
        this.moduleRef = moduleRef;
        this.productVariantService = productVariantService;
        this.strategy = strategy;
        this.injector = new core_1.Injector(moduleRef);
    }
    async previewSubscription(ctx, productVariantId, customInputs) {
        const variant = await this.productVariantService.findOne(ctx, productVariantId);
        if (!variant) {
            throw new core_1.UserInputError(`No product variant with id '${productVariantId}' found`);
        }
        if (!(await this.strategy.isSubscription(ctx, variant, this.injector))) {
            return [];
        }
        const subscriptions = await this.strategy.previewSubscription(ctx, this.injector, variant, customInputs);
        if (Array.isArray(subscriptions)) {
            return subscriptions.map((sub) => ({
                ...sub,
                variantId: variant.id,
            }));
        }
        else {
            return [
                {
                    ...subscriptions,
                    variantId: variant.id,
                },
            ];
        }
    }
    /**
     * Preview all subscriptions for a given product
     */
    async previewSubscriptionsForProduct(ctx, productId, customInputs) {
        const { items: variants } = await this.productVariantService.getVariantsByProductId(ctx, productId);
        if (!variants?.length) {
            throw new core_1.UserInputError(`No variants for product '${productId}' found`);
        }
        const subscriptions = await Promise.all(variants.map((v) => this.previewSubscription(ctx, v.id, customInputs)));
        return subscriptions.flat();
    }
    /**
     * This defines the actual subscriptions and prices for each order line, based on the configured strategy.
     * Doesn't allow recurring amount to be below 0 or lower
     */
    async getSubscriptionsForOrder(ctx, order) {
        // Only define subscriptions for orderlines with a subscription product variant
        const subscriptionOrderLines = await this.getSubscriptionOrderLines(ctx, order);
        const subscriptions = await Promise.all(subscriptionOrderLines.map(async (line) => {
            const subs = await this.getSubscriptionsForOrderLine(ctx, line, order);
            // Add orderlineId and variantId to subscription
            return subs.map((sub) => ({
                orderLineId: line.id,
                variantId: line.productVariant.id,
                ...sub,
            }));
        }));
        const flattenedSubscriptionsArray = subscriptions.flat();
        // Validate recurring amount
        flattenedSubscriptionsArray.forEach((subscription) => {
            if (!subscription.recurring.amount ||
                subscription.recurring.amount <= 0) {
                throw Error(`[${this.loggerCtx}]: Defined subscription for order line ${subscription.variantId} must have a recurring amount greater than 0`);
            }
        });
        return flattenedSubscriptionsArray;
    }
    async hasSubscriptions(ctx, order) {
        const subscriptionOrderLines = await this.getSubscriptionOrderLines(ctx, order);
        return subscriptionOrderLines.length > 0;
    }
    /**
     * Gets the order lines which contain subscription products.
     * Does not create or mutate anything
     */
    async getSubscriptionOrderLines(ctx, order) {
        const subscriptionOrderLines = [];
        await Promise.all(order.lines.map(async (l) => {
            if (await this.strategy.isSubscription(ctx, l.productVariant, new core_1.Injector(this.moduleRef))) {
                subscriptionOrderLines.push(l);
            }
        }));
        return subscriptionOrderLines;
    }
    /**
     * Get subscriptions for a single order line
     */
    async getSubscriptionsForOrderLine(ctx, orderLine, order) {
        if (!(await this.isSubscription(ctx, orderLine.productVariant))) {
            return [];
        }
        const subs = await this.strategy.defineSubscription(ctx, this.injector, orderLine.productVariant, order, orderLine.customFields, orderLine.quantity);
        if (Array.isArray(subs)) {
            return subs;
        }
        return [subs];
    }
    async isSubscription(ctx, variant) {
        return this.strategy.isSubscription(ctx, variant, this.injector);
    }
    defineSubscription(ctx, productVariant, order, orderLineCustomFields, quantity) {
        return this.strategy.defineSubscription(ctx, this.injector, productVariant, order, orderLineCustomFields, quantity);
    }
}
exports.SubscriptionHelper = SubscriptionHelper;
