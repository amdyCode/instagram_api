import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma.js';

export interface CreatePostInput {
  caption?: string | null;
  mediaUrls: string[];
}

export async function createPost(authorId: string, input: CreatePostInput) {
  if (!input.mediaUrls || input.mediaUrls.length === 0) {
    throw new GraphQLError('Au moins une image est requise pour créer un post', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (input.mediaUrls.length > 10) {
    throw new GraphQLError('Un post ne peut pas contenir plus de 10 images', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const validUrls = input.mediaUrls.map((url) => url.trim()).filter((url) => url.length > 0);
  if (validUrls.length === 0) {
    throw new GraphQLError('Les URLs d’images fournies sont invalides', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (input.caption && input.caption.length > 2200) {
    throw new GraphQLError('La légende ne peut pas dépasser 2200 caractères', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        authorId,
        caption: input.caption?.trim() || null,
        media: {
          create: validUrls.map((url, position) => ({
            url,
            position,
          })),
        },
      },
      include: {
        media: { orderBy: { position: 'asc' } },
      },
    });

    await tx.user.update({
      where: { id: authorId },
      data: { postCount: { increment: 1 } },
    });

    return post;
  });
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      media: { orderBy: { position: 'asc' } },
    },
  });

  if (!post) {
    throw new GraphQLError('Post introuvable', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  return post;
}

export async function deletePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new GraphQLError('Post introuvable', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (post.authorId !== userId) {
    throw new GraphQLError('Action non autorisée', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  await prisma.$transaction([
    prisma.post.delete({
      where: { id: postId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { postCount: { decrement: 1 } },
    }),
  ]);

  return true;
}
