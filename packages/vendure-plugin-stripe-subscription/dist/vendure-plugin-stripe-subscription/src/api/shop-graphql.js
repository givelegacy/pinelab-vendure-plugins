"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopApiSchemaExtensions = void 0;
const graphql_tag_1 = require("graphql-tag");
const common_graphql_1 = require("./common-graphql");
exports.shopApiSchemaExtensions = (0, graphql_tag_1.gql) `
  ${common_graphql_1.commonSchemaExtensions}

  extend type Mutation {
    createStripeSubscriptionIntent: StripeSubscriptionIntent!
  }
`;
