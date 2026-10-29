import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export interface GraphQLContext {
  prisma: typeof prisma;
  logger: typeof logger;
  req: Request;
}

export async function buildContext({ req }: { req: Request }): Promise<GraphQLContext> {
  return {
    prisma,
    logger,
    req,
  };
}
