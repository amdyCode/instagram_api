import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../graphql/context.js';
import * as authService from './auth_service.js';

export const authResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return authService.getMe(context.userId);
    },
  },
  Mutation: {
    register: async (
      _parent: unknown,
      { input }: { input: authService.RegisterInput },
    ) => {
      return authService.register(input);
    },
    login: async (
      _parent: unknown,
      { input }: { input: authService.LoginInput },
    ) => {
      return authService.login(input);
    },
  },
};
