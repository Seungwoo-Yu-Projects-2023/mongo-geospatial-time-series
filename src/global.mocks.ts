import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { agent, SuperAgentTest } from 'supertest';
import { startServer } from '@mongo/geospatial-time-series/index';
import { FastifyInstance } from 'fastify';
import { connection } from 'mongoose';
import * as matchers from 'jest-extended';
import { SuperAgentRequest } from 'superagent';

export const testApiKey = 'test';
export function authorizeTestRequest(req: SuperAgentRequest) {
  req.set('x-api-key', testApiKey);
}

let fastify: FastifyInstance;
export let superAgent: SuperAgentTest;
export let mongoMemory: MongoMemoryReplSet;

beforeAll(async () => {
  expect.extend(matchers);

  mongoMemory = await MongoMemoryReplSet.create({
    replSet: {
      auth: true,
      count: 1,
    },
  });

  fastify = await startServer(true, {
    dbUri: mongoMemory.getUri(),
    dbUsername: mongoMemory.servers[0].auth!.customRootName!,
    dbPassword: mongoMemory.servers[0].auth!.customRootPwd!,
    dbDatabaseName: mongoMemory.servers[0].opts.instance!.dbName!,
    apiKey: testApiKey,
    serverPort: 0,
  });

  superAgent = agent(fastify.server);
});

afterAll(async () => {
  await connection.close();
  await mongoMemory.stop();
  await fastify.close();
});
