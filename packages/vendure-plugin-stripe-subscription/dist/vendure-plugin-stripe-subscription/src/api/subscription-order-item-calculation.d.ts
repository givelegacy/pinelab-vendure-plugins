import { Injector, Order, OrderItemPriceCalculationStrategy, PriceCalculationResult, ProductVariant, RequestContext } from '@vendure/core';
import { DefaultOrderItemPriceCalculationStrategy } from '@vendure/core/dist/config/order/default-order-item-price-calculation-strategy';
import { CustomOrderLineFields } from '@vendure/core/dist/entity/custom-entity-fields';
export declare class SubscriptionOrderItemCalculation extends DefaultOrderItemPriceCalculationStrategy implements OrderItemPriceCalculationStrategy {
    init(_injector: Injector): void | Promise<void>;
    calculateUnitPrice(ctx: RequestContext, productVariant: ProductVariant, orderLineCustomFields: CustomOrderLineFields, order: Order, orderLineQuantity: number): Promise<PriceCalculationResult>;
}
