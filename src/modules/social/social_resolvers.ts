import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../graphql/context.js';
import * as socialService from './social_service.js';

export const socialResolvers = {
  Query: {
    comments: async (
      _parent: unknown,
      { postId, limit, offset }: { postId: string; limit?: number; offset?: number },
    ) => {
      return socialService.getComments(postId, limit, offset);
    },
  },
  Mutation: {
    likePost: async (
      _parent: unknown,
      { postId }: { postId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return socialService.likePost(ctx.userId, postId);
    },
    unlikePost: async (
      _parent: unknown,
      { postId }: { postId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return socialService.unlikePost(ctx.userId, postId);
    },
    addComment: async (
      _parent: unknown,
      { postId, body }: { postId: string; body: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return socialService.addComment(ctx.userId, postId, body);
    },
    deleteComment: async (
      _parent: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return socialService.deleteComment(ctx.userId, id);
    },
  },
  Comment: {
    author: async (parent: { authorId: string; author?: unknown }, _args: unknown, ctx: GraphQLContext) => {
      if (parent.author) return parent.author;
      return ctx.prisma.user.findUnique({ where: { id: parent.authorId } });
    },
    text: (parent: { body: string }) => parent.body,
    createdAt: (parent: { createdAt: Date | string }) => {
      return parent.createdAt instanceof Date
        ? parent.createdAt.toISOString()
        : parent.createdAt;
    },
  },
};