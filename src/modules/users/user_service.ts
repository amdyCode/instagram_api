import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma.js';

export interface UpdateProfileInput {
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  link?: string | null;
}

export async function getUserByUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });

  if (!user) {
    throw new GraphQLError(`Utilisateur @${username} introuvable`, {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  if (input.fullName && input.fullName.length > 60) {
    throw new GraphQLError('Le nom complet ne peut pas dépasser 60 caractères', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (input.bio && input.bio.length > 150) {
    throw new GraphQLError('La biographie ne peut pas dépasser 150 caractères', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (input.link && input.link.length > 150) {
    throw new GraphQLError('Le lien ne peut pas dépasser 150 caractères', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined && { fullName: input.fullName?.trim() || null }),
      ...(input.bio !== undefined && { bio: input.bio?.trim() || null }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl?.trim() || null }),
      ...(input.link !== undefined && { link: input.link?.trim() || null }),
    },
  });
}

export async function follow(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new GraphQLError('Vous ne pouvez pas vous suivre vous-même', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: followingId },
  });

  if (!targetUser) {
    throw new GraphQLError('Utilisateur à suivre introuvable', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (existingFollow) {
    return targetUser;
  }

  const [, , updatedTarget] = await prisma.$transaction([
    prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    }),
    prisma.user.update({
      where: { id: followerId },
      data: { followingCount: { increment: 1 } },
    }),
    prisma.user.update({
      where: { id: followingId },
      data: { followerCount: { increment: 1 } },
    }),
  ]);

  return updatedTarget;
}

export async function unfollow(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new GraphQLError('Vous ne pouvez pas vous désabonner de vous-même', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: followingId },
  });

  if (!targetUser) {
    throw new GraphQLError('Utilisateur introuvable', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (!existingFollow) {
    return targetUser;
  }

  const [, , updatedTarget] = await prisma.$transaction([
    prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    }),
    prisma.user.update({
      where: { id: followerId },
      data: { followingCount: { decrement: 1 } },
    }),
    prisma.user.update({
      where: { id: followingId },
      data: { followerCount: { decrement: 1 } },
    }),
  ]);

  return updatedTarget;
}
