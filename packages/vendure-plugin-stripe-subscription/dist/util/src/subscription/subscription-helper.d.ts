import { ID, Injector, Order, OrderLine, ProductVariant, ProductVariantService, RequestContext } from '@vendure/core';
import { ModuleRef } from '@nestjs/core';
import { Subscription, SubscriptionStrategy } from './subscription-strategy';
export interface SubscriptionWithVariantId extends Subscription {
    variantId: ID;
}
/**
 * Helper for payment-provider independent subscription logic
 */
export declare class SubscriptionHelper {
    private loggerCtx;
    private moduleRef;
    private productVariantService;
    private strategy;
    injector: Injector;
    constructor(loggerCtx: string, moduleRef: ModuleRef, productVariantService: ProductVariantService, strategy: SubscriptionStrategy);
    previewSubscription(ctx: RequestContext, productVariantId: ID, customInputs?: any): Promise<SubscriptionWithVariantId[]>;
    /**
     * Preview all subscriptions for a given product
     */
    previewSubscriptionsForProduct(ctx: RequestContext, productId: ID, customInputs?: any): Promise<SubscriptionWithVariantId[]>;
    /**
     * This defines the actual subscriptions and prices for each order line, based on the configured strategy.
     * Doesn't allow recurring amount to be below 0 or lower
     */
    getSubscriptionsForOrder(ctx: RequestContext, order: Order): Promise<(SubscriptionWithVariantId & {
        orderLineId: ID;
    })[]>;
    hasSubscriptions(ctx: RequestContext, order: Order): Promise<boolean>;
    /**
     * Gets the order lines which contain subscription products.
     * Does not create or mutate anything
     */
    getSubscriptionOrderLines(ctx: RequestContext, order: Order): Promise<OrderLine[]>;
    /**
     * Get subscriptions for a single order line
     */
    getSubscriptionsForOrderLine(ctx: RequestContext, orderLine: OrderLine, order: Order): Promise<Subscription[]>;
    isSubscription(ctx: RequestContext, variant: ProductVariant): Promise<boolean>;
    defineSubscription(ctx: RequestContext, productVariant: ProductVariant, order: Order, orderLineCustomFields: {
        [key: string]: any;
    }, quantity: number): Promise<Subscription> | Subscription | Promise<Subscription[]> | Subscription[];
}
