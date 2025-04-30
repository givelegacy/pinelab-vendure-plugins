declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomOrderLineFields {
        subscriptionIds?: string[];
        /**
         * Unique hash to separate order lines
         */
        subscriptionHash?: string;
    }
}
export {};
