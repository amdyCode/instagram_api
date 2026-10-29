export const typeDefs = `#graphql
  type Query {
    health: String!
  }
`;

export const resolvers = {
  Query: {
    health: () => 'Instagram API is healthy and operational',
  },
};
