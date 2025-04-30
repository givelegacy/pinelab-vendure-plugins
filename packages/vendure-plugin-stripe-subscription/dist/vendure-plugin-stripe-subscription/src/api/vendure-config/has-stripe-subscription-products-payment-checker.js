"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasStripeSubscriptionProductsPaymentChecker = void 0;
const core_1 = require("@vendure/core");
const stripe_subscription_service_1 = require("../stripe-subscription.service");
let stripeSubscriptionService;
exports.hasStripeSubscriptionProductsPaymentChecker = new core_1.PaymentMethodEligibilityChecker({
    code: 'has-stripe-subscription-products-checker',
    description: [
        {
            languageCode: core_1.LanguageCode.en,
            value: 'Checks if the order has Subscription products.',
        },
    ],
    args: {},
    init: (injector) => {
        stripeSubscriptionService = injector.get(stripe_subscription_service_1.StripeSubscriptionService);
    },
    check: async (ctx, order, args) => {
        if (await stripeSubscriptionService.subscriptionHelper.hasSubscriptions(ctx, order)) {
            return true;
        }
        return false;
    },
});
