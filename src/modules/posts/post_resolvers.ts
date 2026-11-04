import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../graphql/context.js';
import * as postService from './post_service.js';

export const postResolvers = {
  Query: {
    post: async (_parent: unknown, { id }: { id: string }) => {
      return postService.getPostById(id);
    },
  },
  Mutation: {
    createPost: async (
      _parent: unknown,
      { input }: { input: postService.CreatePostInput },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return postService.createPost(ctx.userId, input);
    },
    deletePost: async (
      _parent: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return postService.deletePost(ctx.userId, id);
    },
  },
  Post: {
    author: async (parent: { authorId: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.prisma.user.findUnique({
        where: { id: parent.authorId },
      });
    },
    media: async (
      parent: { id: string; media?: unknown[] },
      _args: unknown,
      ctx: GraphQLContext,
    ) => {
      if (parent.media) return parent.media;
      return ctx.prisma.postMedia.findMany({
        where: { postId: parent.id },
        orderBy: { position: 'asc' },
      });
    },
    likedByMe: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId) return false;
      const like = await ctx.prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: ctx.userId,
            postId: parent.id,
          },
        },
      });
      return !!like;
    },
    createdAt: (parent: { createdAt: Date | string }) => {
      return parent.createdAt instanceof Date
        ? parent.createdAt.toISOString()
        : parent.createdAt;
    },
  },
};
