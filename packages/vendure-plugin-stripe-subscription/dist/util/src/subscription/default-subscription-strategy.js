"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultSubscriptionStrategy = void 0;
/**
 * This strategy creates a subscription based on the product variant:
 * * The variant's price is the price per month
 * * Start date is one month from now, because we ask the customer to pay the first month during checkout
 */
class DefaultSubscriptionStrategy {
    defineSubscription(ctx, injector, productVariant, order, orderLineCustomFields, quantity) {
        return this.getSubscriptionForVariant(productVariant);
    }
    isSubscription(ctx, variant) {
        // This example treats all products as subscriptions
        return true;
    }
    previewSubscription(ctx, injector, productVariant, customInputs) {
        return this.getSubscriptionForVariant(productVariant);
    }
    getSubscriptionForVariant(productVariant) {
        const price = productVariant.listPrice;
        return {
            name: `Subscription ${productVariant.name}`,
            priceIncludesTax: productVariant.listPriceIncludesTax,
            amountDueNow: price,
            recurring: {
                amount: price,
                interval: 'month',
                intervalCount: 1,
                startDate: this.getOneMonthFromNow(),
            },
        };
    }
    getOneMonthFromNow() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12);
    }
}
exports.DefaultSubscriptionStrategy = DefaultSubscriptionStrategy;
