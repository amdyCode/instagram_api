import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

async function bootstrap() {
  const { app } = await createApp();
  const httpServer = http.createServer(app);

  httpServer.listen(env.PORT, () => {
    logger.info(`API HTTP & Health ready at: http://localhost:${env.PORT}/health`);
    logger.info(`GraphQL Apollo Sandbox ready at: http://localhost:${env.PORT}/graphql`);
  });

  const shutdown = async () => {
    logger.info('Shutting down server gracefully...');
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
