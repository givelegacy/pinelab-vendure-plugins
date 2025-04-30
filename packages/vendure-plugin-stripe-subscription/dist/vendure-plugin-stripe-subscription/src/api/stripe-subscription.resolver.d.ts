import { PaymentMethodQuote } from '@vendure/common/lib/generated-shop-types';
import { EntityHydrator, OrderLine, PaymentMethodService, ProductPriceApplicator, RequestContext } from '@vendure/core';
import { Request } from 'express';
import { Mutation as GraphqlShopMutation, Query as GraphqlQuery, QueryPreviewStripeSubscriptionsArgs, QueryPreviewStripeSubscriptionsForProductArgs, StripeSubscription } from './generated/shop-graphql';
import { Mutation as GraphqlAdminMutation, MutationCreateStripeSubscriptionIntentArgs } from './generated/admin-graphql';
import { StripeSubscriptionService } from './stripe-subscription.service';
export type RequestWithRawBody = Request & {
    rawBody: any;
};
export declare class StripeSubscriptionCommonResolver {
    private stripeSubscriptionService;
    private paymentMethodService;
    private entityHydrator;
    private productPriceApplicator;
    constructor(stripeSubscriptionService: StripeSubscriptionService, paymentMethodService: PaymentMethodService, entityHydrator: EntityHydrator, productPriceApplicator: ProductPriceApplicator);
    previewStripeSubscriptions(ctx: RequestContext, { productVariantId, customInputs }: QueryPreviewStripeSubscriptionsArgs): Promise<GraphqlQuery['previewStripeSubscriptions']>;
    previewStripeSubscriptionsForProduct(ctx: RequestContext, { productId, customInputs }: QueryPreviewStripeSubscriptionsForProductArgs): Promise<GraphqlQuery['previewStripeSubscriptionsForProduct']>;
    stripeSubscriptionPublishableKey(ctx: RequestContext, paymentMethodQuote: PaymentMethodQuote): Promise<string | undefined>;
    stripeSubscriptions(ctx: RequestContext, orderLine: OrderLine): Promise<StripeSubscription[] | undefined>;
}
export declare class StripeSubscriptionShopApiResolver {
    private stripeSubscriptionService;
    constructor(stripeSubscriptionService: StripeSubscriptionService);
    createStripeSubscriptionIntent(ctx: RequestContext): Promise<GraphqlShopMutation['createStripeSubscriptionIntent']>;
}
export declare class StripeSubscriptionAdminApiResolver {
    private stripeSubscriptionService;
    constructor(stripeSubscriptionService: StripeSubscriptionService);
    createStripeSubscriptionIntent(ctx: RequestContext, args: MutationCreateStripeSubscriptionIntentArgs): Promise<GraphqlAdminMutation['createStripeSubscriptionIntent']>;
}
