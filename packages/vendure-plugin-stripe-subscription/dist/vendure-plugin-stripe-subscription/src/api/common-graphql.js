"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonSchemaExtensions = void 0;
const graphql_tag_1 = require("graphql-tag");
/**
 * Needed for gql codegen
 */
const _codegenAdditions = (0, graphql_tag_1.gql) `
  scalar DateTime
  scalar JSON
`;
exports.commonSchemaExtensions = (0, graphql_tag_1.gql) `
  enum StripeSubscriptionInterval {
    week
    month
    year
  }

  type StripeSubscription {
    name: String!
    variantId: ID!
    amountDueNow: Int!
    priceIncludesTax: Boolean!
    recurring: StripeSubscriptionRecurringPayment!
  }

  type StripeSubscriptionRecurringPayment {
    amount: Int!
    interval: StripeSubscriptionInterval!
    intervalCount: Int!
    startDate: DateTime!
    endDate: DateTime
  }

  enum StripeSubscriptionIntentType {
    PaymentIntent
    SetupIntent
  }

  type StripeSubscriptionIntent {
    clientSecret: String!
    intentType: StripeSubscriptionIntentType!
  }

  extend type PaymentMethodQuote {
    stripeSubscriptionPublishableKey: String
  }

  extend type OrderLine {
    """
    These subscriptions are calculated dynamically, and should not be used for historical data.
    Actual created subscriptions should be fetched from he connected Stripe account.
    """
    stripeSubscriptions: [StripeSubscription!]
  }

  extend type Query {
    previewStripeSubscriptions(
      productVariantId: ID!
      customInputs: JSON
    ): [StripeSubscription!]!
    previewStripeSubscriptionsForProduct(
      productId: ID!
      customInputs: JSON
    ): [StripeSubscription!]!
  }
`;
