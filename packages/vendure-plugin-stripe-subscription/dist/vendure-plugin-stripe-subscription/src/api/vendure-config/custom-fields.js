"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderLineCustomFields = void 0;
const core_1 = require("@vendure/core");
exports.orderLineCustomFields = [
    {
        name: 'subscriptionIds',
        label: [
            {
                languageCode: core_1.LanguageCode.en,
                value: 'Subscription IDs',
            },
        ],
        type: 'string',
        list: true,
        public: false,
        readonly: true,
        internal: true,
        nullable: true,
    },
];
