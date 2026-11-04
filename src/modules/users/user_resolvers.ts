import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../graphql/context.js';
import * as usersService from './user_service.js';

export const usersResolvers = {
  Query: {
    user: async (_parent: unknown, { username }: { username: string }) => {
      return usersService.getUserByUsername(username);
    },
  },
  Mutation: {
    updateProfile: async (
      _parent: unknown,
      { input }: { input: usersService.UpdateProfileInput },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return usersService.updateProfile(ctx.userId, input);
    },
    follow: async (
      _parent: unknown,
      { userId }: { userId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return usersService.follow(ctx.userId, userId);
    },
    unfollow: async (
      _parent: unknown,
      { userId }: { userId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.userId) {
        throw new GraphQLError('Non authentifié', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return usersService.unfollow(ctx.userId, userId);
    },
  },
  User: {
    isMe: (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.userId === parent.id;
    },
    isFollowing: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId || ctx.userId === parent.id) {
        return false;
      }
      const follow = await ctx.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.userId,
            followingId: parent.id,
          },
        },
      });
      return !!follow;
    },
    posts: async (parent: { id: string }, _args: unknown, ctx: GraphQLContext) => {
      return ctx.prisma.post.findMany({
        where: { authorId: parent.id },
        include: { media: { orderBy: { position: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });
    },
    createdAt: (parent: { createdAt: Date | string }) => {
      return parent.createdAt instanceof Date
        ? parent.createdAt.toISOString()
        : parent.createdAt;
    },
  },
};
