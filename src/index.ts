import { connect, connection } from 'mongoose';
import Fastify, { FastifyInstance } from 'fastify';
import packageJSON from '../package.json';
import fastifySwagger, { SwaggerOptions } from '@fastify/swagger';
import { routes } from '@mongo/geospatial-time-series/apps';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { config } from 'dotenv';
import apiKey from '@mongo/geospatial-time-series/infra/plugins/api-key';

interface ServerConfig {
  dbUri: string,
  dbUsername: string,
  dbPassword: string,
  dbDatabaseName: string,
  apiKey: string,
  serverPort: number,
}

process.on('uncaughtException', err => {
  console.log(err);
});
process.on('unhandledRejection', err => {
  console.log(err);
});

config();

let server: FastifyInstance | undefined;

export async function startServer(isTest = false, serverConfig?: ServerConfig) {
  if (server != null) {
    if (isTest) {
      await server.close().catch(() => undefined);
    } else {
      throw new Error('server is already started');
    }
  }

  // noinspection JSUnresolvedReference
  const config: ServerConfig = serverConfig ?? {
    dbUri: `mongodb://${process.env.DB_HOSTNAME}:${process.env.DB_PORT}`,
    dbUsername: process.env.DB_USERNAME!,
    dbPassword: process.env.DB_PASSWORD!,
    dbDatabaseName: process.env.DB_DATABASE_NAME!,
    apiKey: process.env.API_KEY!,
    serverPort: 3000,
  };

  if (connection.readyState === 1 || connection.readyState === 2) {
    await connection.close().catch(() => undefined);
  }

  await connect(config.dbUri, {
    user: config.dbUsername,
    pass: config.dbPassword,
    dbName: config.dbDatabaseName,
  });

  const fastify = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
      },
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  if (!isTest) {
    await fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: packageJSON.name,
          description: packageJSON.description,
          version: packageJSON.version,
        },
        tags: [
          { name: 'devices', description: 'Device apis' },
          { name: 'users', description: 'User apis' },
          { name: 'stores', description: 'Store apis' },
          { name: 'pedometers', description: 'Pedometer apis' },
        ],
        security: [
          {
            apiKey: [],
          },
        ],
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'x-api-key',
              in: 'header',
            },
          },
        },
      },
    } as SwaggerOptions);
    // noinspection JSUnusedGlobalSymbols
    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        onComplete: () => {
          // TODO: find a way to inject variable
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // noinspection JSUnresolvedReference
          // ui.preauthorizeApiKey('apiKey', config.apiKey);
        },
      },
    });
  }

  await fastify.register(apiKey, { apiKey: config.apiKey });
  await fastify.register(routes, { prefix: 'api/v1' });
  await fastify.listen({ port: config.serverPort, host: '0.0.0.0' });
  console.log('server started');

  server = fastify;

  return fastify;
}

(async () => {
  // noinspection JSUnresolvedReference
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  await startServer();
})()
  .then(() => undefined)
  .catch(reason => {
    throw reason;
  });
