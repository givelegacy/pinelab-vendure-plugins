"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionOrderItemCalculation = void 0;
const default_order_item_price_calculation_strategy_1 = require("@vendure/core/dist/config/order/default-order-item-price-calculation-strategy");
const stripe_subscription_service_1 = require("./stripe-subscription.service");
let injector;
class SubscriptionOrderItemCalculation extends default_order_item_price_calculation_strategy_1.DefaultOrderItemPriceCalculationStrategy {
    init(_injector) {
        injector = _injector;
    }
    // @ts-ignore - Our strategy takes more arguments, so TS complains that it doesnt match the super.calculateUnitPrice
    async calculateUnitPrice(ctx, productVariant, orderLineCustomFields, order, orderLineQuantity) {
        const subcriptionService = injector.get(stripe_subscription_service_1.StripeSubscriptionService);
        if (!subcriptionService) {
            throw new Error('Subscription service not initialized');
        }
        if (!(await subcriptionService.subscriptionHelper.isSubscription(ctx, productVariant))) {
            return super.calculateUnitPrice(ctx, productVariant);
        }
        const subscription = await subcriptionService.subscriptionHelper.defineSubscription(ctx, productVariant, order, orderLineCustomFields, orderLineQuantity);
        if (!Array.isArray(subscription)) {
            return {
                priceIncludesTax: subscription.priceIncludesTax,
                price: subscription.amountDueNow ?? 0,
            };
        }
        if (!subscription.length) {
            throw Error(`Subscription strategy returned an empty array. Must contain atleast 1 subscription`);
        }
        const total = subscription.reduce((acc, sub) => acc + sub.amountDueNow, 0);
        return {
            priceIncludesTax: subscription[0].priceIncludesTax,
            price: total,
        };
    }
}
exports.SubscriptionOrderItemCalculation = SubscriptionOrderItemCalculation;
