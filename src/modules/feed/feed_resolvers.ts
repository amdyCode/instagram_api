import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../graphql/context.js';
import * as feedService from './feed_service.js';

export const feedResolvers = {
  Query: {
    feed: async (
      _parent: unknown,
      { limit, offset }: { limit?: number; offset?: number },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return feedService.getFeed(ctx.userId, limit, offset);
    },
    explorePosts: async (
      _parent: unknown,
      { limit, offset }: { limit?: number; offset?: number },
    ) => {
      return feedService.getExplorePosts(limit, offset);
    },
    searchUsers: async (
      _parent: unknown,
      { query, limit }: { query: string; limit?: number },
    ) => {
      return feedService.searchUsers(query, limit);
    },
  },
};
