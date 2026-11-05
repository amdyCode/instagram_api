import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma.js';

export async function likePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new GraphQLError('Post introuvable', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  if (existingLike) {
    return post;
  }

  const [, updatedPost] = await prisma.$transaction([
    prisma.like.create({
      data: {
        userId,
        postId,
      },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    }),
  ]);

  return updatedPost;
}

export async function unlikePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new GraphQLError('Post introuvable', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  if (!existingLike) {
    return post;
  }

  const [, updatedPost] = await prisma.$transaction([
    prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { likeCount: { decrement: 1 } },
    }),
  ]);

  return updatedPost;
}

export async function getComments(postId: string, limit: number = 50, offset: number = 0) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const safeOffset = Math.max(0, offset);

  return prisma.comment.findMany({
    where: { postId },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
    take: safeLimit,
    skip: safeOffset,
  });
}

export async function addComment(userId: string, postId: string, body: string) {
  const cleanBody = body.trim();
  if (cleanBody.length === 0) {
    throw new GraphQLError('Le commentaire ne peut pas etre vide', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (cleanBody.length > 2200) {
    throw new GraphQLError('Le commentaire ne peut pas depasser 2200 caracteres', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new GraphQLError('Post introuvable', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        authorId: userId,
        postId,
        body: cleanBody,
      },
      include: { author: true },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    }),
  ]);

  return comment;
}

export async function deleteComment(userId: string, commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: true },
  });

  if (!comment) {
    throw new GraphQLError('Commentaire introuvable', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (comment.authorId !== userId && comment.post.authorId !== userId) {
    throw new GraphQLError('Action non autorisee', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  await prisma.$transaction([
    prisma.comment.delete({
      where: { id: commentId },
    }),
    prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    }),
  ]);

  return true;
}