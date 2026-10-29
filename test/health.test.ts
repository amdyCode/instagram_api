import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { Express } from 'express';
import type { ApolloServer } from '@apollo/server';
import type { GraphQLContext } from '../src/graphql/context.js';

describe('Health and API Smoke Test', () => {
  let app: Express;
  let apollo: ApolloServer<GraphQLContext>;

  beforeAll(async () => {
    const created = await createApp();
    app = created.app;
    apollo = created.apollo;
  });

  afterAll(async () => {
    await apollo.stop();
  });

  it('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('POST /graphql executes health query successfully', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: '{ health }',
      });

    expect(res.status).toBe(200);
    expect(res.body.data?.health).toBe('Instagram API is healthy and operational');
  });
});
