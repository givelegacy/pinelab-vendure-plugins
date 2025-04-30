"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeSubscriptionPlugin_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeSubscriptionPlugin = void 0;
const core_1 = require("@vendure/core");
const constants_1 = require("./constants");
const _1 = require("./");
const path_1 = __importDefault(require("path"));
const custom_fields_1 = require("./api/vendure-config/custom-fields");
const stripe_subscription_handler_1 = require("./api/vendure-config/stripe-subscription.handler");
const has_stripe_subscription_products_payment_checker_1 = require("./api/vendure-config/has-stripe-subscription-products-payment-checker");
const subscription_order_item_calculation_1 = require("./api/subscription-order-item-calculation");
const stripe_subscription_service_1 = require("./api/stripe-subscription.service");
const stripe_subscription_controller_1 = require("./api/stripe-subscription.controller");
const stripe_subscription_resolver_1 = require("./api/stripe-subscription.resolver");
const shop_graphql_1 = require("./api/shop-graphql");
const admin_graphql_1 = require("./api/admin-graphql");
let StripeSubscriptionPlugin = StripeSubscriptionPlugin_1 = class StripeSubscriptionPlugin {
    static init(options) {
        this.options = {
            ...this.options,
            ...options,
        };
        return StripeSubscriptionPlugin_1;
    }
};
exports.StripeSubscriptionPlugin = StripeSubscriptionPlugin;
StripeSubscriptionPlugin.options = {
    vendureHost: '',
    subscriptionStrategy: new _1.DefaultSubscriptionStrategy(),
};
StripeSubscriptionPlugin.ui = {
    id: 'stripe-subscription-extension',
    extensionPath: path_1.default.join(__dirname, 'ui'),
    ngModules: [
        {
            type: 'shared',
            ngModuleFileName: 'stripe-subscription-shared.module.ts',
            ngModuleName: 'StripeSubscriptionSharedModule',
        },
    ],
};
exports.StripeSubscriptionPlugin = StripeSubscriptionPlugin = StripeSubscriptionPlugin_1 = __decorate([
    (0, core_1.VendurePlugin)({
        imports: [core_1.PluginCommonModule],
        shopApiExtensions: {
            schema: shop_graphql_1.shopApiSchemaExtensions,
            resolvers: [
                stripe_subscription_resolver_1.StripeSubscriptionCommonResolver,
                stripe_subscription_resolver_1.StripeSubscriptionShopApiResolver,
            ],
        },
        adminApiExtensions: {
            schema: admin_graphql_1.adminApiSchemaExtensions,
            resolvers: [
                stripe_subscription_resolver_1.StripeSubscriptionCommonResolver,
                stripe_subscription_resolver_1.StripeSubscriptionAdminApiResolver,
            ],
        },
        controllers: [stripe_subscription_controller_1.StripeSubscriptionController],
        providers: [
            {
                provide: constants_1.PLUGIN_INIT_OPTIONS,
                useFactory: () => StripeSubscriptionPlugin.options,
            },
            stripe_subscription_service_1.StripeSubscriptionService,
        ],
        configuration: (config) => {
            config.paymentOptions.paymentMethodHandlers.push(stripe_subscription_handler_1.stripeSubscriptionHandler);
            config.paymentOptions.paymentMethodEligibilityCheckers = [
                ...(config.paymentOptions.paymentMethodEligibilityCheckers ?? []),
                has_stripe_subscription_products_payment_checker_1.hasStripeSubscriptionProductsPaymentChecker,
            ];
            config.customFields.OrderLine.push(...custom_fields_1.orderLineCustomFields);
            config.orderOptions.orderItemPriceCalculationStrategy =
                new subscription_order_item_calculation_1.SubscriptionOrderItemCalculation();
            return config;
        },
        compatibility: '>=2.2.0',
    })
], StripeSubscriptionPlugin);
