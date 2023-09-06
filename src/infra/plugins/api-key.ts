import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

export type ApiKeyPluginOptions = {
  apiKey: string,
};

const plugin: FastifyPluginAsync<ApiKeyPluginOptions> = fastifyPlugin(async (
  fastify: FastifyInstance,
  opts: ApiKeyPluginOptions,
) => {
  if (opts?.apiKey == null || opts.apiKey === '') {
    return;
  }

  fastify.addHook('preHandler', async (request, reply) => {
    const apiKey = request.headers?.['x-api-key'];

    if (apiKey != null && apiKey === opts.apiKey) {
      return;
    }

    reply.code(401).send();
  });
});
export default plugin;
