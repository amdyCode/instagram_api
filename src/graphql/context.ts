import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { verifyToken } from '../lib/jwt.js';

export interface GraphQLContext {
  prisma: typeof prisma;
  logger: typeof logger;
  req: Request;
  userId: string | null;
}

export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      userId = payload.userId;
    }
  }

  return {
    prisma,
    logger,
    req,
    userId,
  };
}
