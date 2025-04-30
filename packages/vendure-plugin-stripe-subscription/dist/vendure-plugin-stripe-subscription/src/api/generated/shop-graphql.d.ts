export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends {
    [key: string]: unknown;
}> = {
    [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string | number;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    DateTime: Date;
    JSON: any;
};
export type Mutation = {
    __typename?: 'Mutation';
    createStripeSubscriptionIntent: StripeSubscriptionIntent;
};
export type OrderLine = {
    __typename?: 'OrderLine';
    /**
     * These subscriptions are calculated dynamically, and should not be used for historical data.
     * Actual created subscriptions should be fetched from he connected Stripe account.
     */
    stripeSubscriptions?: Maybe<Array<StripeSubscription>>;
};
export type PaymentMethodQuote = {
    __typename?: 'PaymentMethodQuote';
    stripeSubscriptionPublishableKey?: Maybe<Scalars['String']>;
};
export type Query = {
    __typename?: 'Query';
    previewStripeSubscriptions: Array<StripeSubscription>;
    previewStripeSubscriptionsForProduct: Array<StripeSubscription>;
};
export type QueryPreviewStripeSubscriptionsArgs = {
    customInputs?: InputMaybe<Scalars['JSON']>;
    productVariantId: Scalars['ID'];
};
export type QueryPreviewStripeSubscriptionsForProductArgs = {
    customInputs?: InputMaybe<Scalars['JSON']>;
    productId: Scalars['ID'];
};
export type StripeSubscription = {
    __typename?: 'StripeSubscription';
    amountDueNow: Scalars['Int'];
    name: Scalars['String'];
    priceIncludesTax: Scalars['Boolean'];
    recurring: StripeSubscriptionRecurringPayment;
    variantId: Scalars['ID'];
};
export type StripeSubscriptionIntent = {
    __typename?: 'StripeSubscriptionIntent';
    clientSecret: Scalars['String'];
    intentType: StripeSubscriptionIntentType;
};
export type StripeSubscriptionIntentType = 'PaymentIntent' | 'SetupIntent';
export type StripeSubscriptionInterval = 'month' | 'week' | 'year';
export type StripeSubscriptionRecurringPayment = {
    __typename?: 'StripeSubscriptionRecurringPayment';
    amount: Scalars['Int'];
    endDate?: Maybe<Scalars['DateTime']>;
    interval: StripeSubscriptionInterval;
    intervalCount: Scalars['Int'];
    startDate: Scalars['DateTime'];
};
