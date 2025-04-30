import { Injector, Order, ProductVariant, RequestContext } from '@vendure/core';
import { Subscription, SubscriptionStrategy } from './subscription-strategy';
/**
 * This strategy creates a subscription based on the product variant:
 * * The variant's price is the price per month
 * * Start date is one month from now, because we ask the customer to pay the first month during checkout
 */
export declare class DefaultSubscriptionStrategy implements SubscriptionStrategy {
    defineSubscription(ctx: RequestContext, injector: Injector, productVariant: ProductVariant, order: Order, orderLineCustomFields: {
        [key: string]: any;
    }, quantity: number): Subscription;
    isSubscription(ctx: RequestContext, variant: ProductVariant): boolean;
    previewSubscription(ctx: RequestContext, injector: Injector, productVariant: ProductVariant, customInputs: any): Subscription;
    private getSubscriptionForVariant;
    private getOneMonthFromNow;
}
