import { OrderService } from '@vendure/core';
import { Request } from 'express';
import { StripeSubscriptionPluginOptions } from '../stripe-subscription.plugin';
import { StripeSubscriptionService } from './stripe-subscription.service';
export type RequestWithRawBody = Request & {
    rawBody: any;
};
export declare class StripeSubscriptionController {
    private stripeSubscriptionService;
    private orderService;
    private options;
    constructor(stripeSubscriptionService: StripeSubscriptionService, orderService: OrderService, options: StripeSubscriptionPluginOptions);
    webhook(request: RequestWithRawBody): Promise<void>;
}
