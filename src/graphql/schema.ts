import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { authResolvers } from '../modules/auth/auth_resolvers.js';
import { usersResolvers } from '../modules/users/user_resolvers.js';
import { postResolvers } from '../modules/posts/post_resolvers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseTypeDefs = `#graphql
  type Query {
    health: String!
  }
`;

const authSchema = fs.readFileSync(
  path.join(__dirname, '../modules/auth/auth.graphql'),
  'utf-8',
);

const userSchema = fs.readFileSync(
  path.join(__dirname, '../modules/users/user.graphql'),
  'utf-8',
);

const postSchema = fs.readFileSync(
  path.join(__dirname, '../modules/posts/post.graphql'),
  'utf-8',
);

export const typeDefs = mergeTypeDefs([baseTypeDefs, authSchema, userSchema, postSchema]);

export const resolvers = mergeResolvers([
  {
    Query: {
      health: () => 'Instagram API is healthy and operational',
    },
  },
  authResolvers,
  usersResolvers,
  postResolvers,
]);
