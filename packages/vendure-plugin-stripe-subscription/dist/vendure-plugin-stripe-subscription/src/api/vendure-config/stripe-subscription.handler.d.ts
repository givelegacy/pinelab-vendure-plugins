import { LanguageCode, PaymentMethodHandler } from '@vendure/core';
export declare const stripeSubscriptionHandler: PaymentMethodHandler<{
    apiKey: {
        type: "string";
        label: {
            languageCode: LanguageCode.en;
            value: string;
        }[];
        ui: {
            component: string;
        };
    };
    publishableKey: {
        type: "string";
        required: false;
        label: {
            languageCode: LanguageCode.en;
            value: string;
        }[];
        description: {
            languageCode: LanguageCode.en;
            value: string;
        }[];
    };
    webhookSecret: {
        type: "string";
        required: false;
        label: {
            languageCode: LanguageCode.en;
            value: string;
        }[];
        description: {
            languageCode: LanguageCode.en;
            value: string;
        }[];
        ui: {
            component: string;
        };
    };
}>;
