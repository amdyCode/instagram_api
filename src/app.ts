import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs, resolvers } from './graphql/schema.js';
import { buildContext, type GraphQLContext } from './graphql/context.js';
import { logger } from './lib/logger.js';
import { env } from './config/env.js';

export async function createApp(): Promise<{ app: Express; apollo: ApolloServer<GraphQLContext> }> {
  const app = express();

  const apollo = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: env.NODE_ENV !== 'production',
  });

  await apollo.start();

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(
    '/graphql',
    expressMiddleware(apollo, {
      context: buildContext,
    }),
  );

  return { app, apollo };
}
