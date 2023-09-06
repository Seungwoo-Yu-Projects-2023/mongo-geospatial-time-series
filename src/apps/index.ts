import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { deviceRoutes } from '@mongo/geospatial-time-series/apps/devices';
import { userRoutes } from '@mongo/geospatial-time-series/apps/users';
import { storeRoutes } from '@mongo/geospatial-time-series/apps/stores';
import { pedometerRoutes } from '@mongo/geospatial-time-series/apps/pedometers';

export function routes(instance: FastifyInstance, _: FastifyPluginOptions, done: (err?: Error) => void) {
  instance.register(deviceRoutes, { prefix: 'devices' });
  instance.register(userRoutes, { prefix: 'users' });
  instance.register(storeRoutes, { prefix: 'stores' });
  instance.register(pedometerRoutes, { prefix: 'pedometers' });

  done();
}
