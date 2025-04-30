"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminApiSchemaExtensions = void 0;
const graphql_tag_1 = require("graphql-tag");
const common_graphql_1 = require("./common-graphql");
exports.adminApiSchemaExtensions = (0, graphql_tag_1.gql) `
  ${common_graphql_1.commonSchemaExtensions}

  extend type Mutation {
    createStripeSubscriptionIntent(orderId: ID!): StripeSubscriptionIntent!
  }
`;
