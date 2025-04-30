import { SubscriptionStrategy } from './';
import { AdminUiExtension } from '@vendure/ui-devkit/compiler';
export interface StripeSubscriptionPluginOptions {
    vendureHost: string;
    subscriptionStrategy?: SubscriptionStrategy;
}
export declare class StripeSubscriptionPlugin {
    static options: StripeSubscriptionPluginOptions;
    static init(options: StripeSubscriptionPluginOptions): typeof StripeSubscriptionPlugin;
    static ui: AdminUiExtension;
}
