import { prisma } from '../../lib/prisma.js';

export async function getFeed(userId: string, limit: number = 10, offset: number = 0) {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const safeOffset = Math.max(0, offset);

  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const authorIds = [userId, ...follows.map((f) => f.followingId)];

  return prisma.post.findMany({
    where: {
      authorId: { in: authorIds },
    },
    include: {
      media: { orderBy: { position: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
    skip: safeOffset,
  });
}

export async function getExplorePosts(limit: number = 30, offset: number = 0) {
  const safeLimit = Math.max(1, Math.min(limit, 60));
  const safeOffset = Math.max(0, offset);

  return prisma.post.findMany({
    include: {
      media: { orderBy: { position: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
    skip: safeOffset,
  });
}

export async function searchUsers(query: string, limit: number = 20) {
  const cleanQuery = query.trim();
  if (cleanQuery.length === 0) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(limit, 50));

  return prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: cleanQuery, mode: 'insensitive' } },
        { fullName: { contains: cleanQuery, mode: 'insensitive' } },
      ],
    },
    orderBy: {
      followerCount: 'desc',
    },
    take: safeLimit,
  });
}
