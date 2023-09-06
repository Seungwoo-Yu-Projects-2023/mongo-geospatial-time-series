import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateStore,
  GetMultipleStores, GetSingularStore,
  RemoveStore,
  UpdateStore,
} from '@mongo/geospatial-time-series/apps/stores/requests';
import { StoreInfoCommandRepo } from '@mongo/geospatial-time-series/infra/repos/commands/store-info';
import { StoreInfo } from '@mongo/geospatial-time-series/infra/models/store-info';
import { DeviceInfo } from '@mongo/geospatial-time-series/infra/models/device-info';
import { StoreInfoQueryRepo } from '@mongo/geospatial-time-series/infra/repos/queries/store-info';
import { FastifyReplyWithPayload, FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import { StoreInfo as StoreInfoEntity } from '@mongo/geospatial-time-series/domains/entities/store-info';
import {
  createStoreInfo, getMultipleStoreInfo,
  getSingularStoreInfo, orderParam,
  removeStoreInfo,
  updateStoreInfo,
} from '@mongo/geospatial-time-series/apps/stores/schema';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import {
  areaParam,
  coordinatesParam,
  createFindManyOptions,
} from '@mongo/geospatial-time-series/utils';
import { Static } from '@sinclair/typebox';

async function createStore(request: FastifyRequest<CreateStore>, reply: FastifyReplyWithPayload<CreateStore>) {
  const repo = new StoreInfoCommandRepo(StoreInfo, DeviceInfo);

  const result = await repo.insert({
    name: request.body.name,
    deviceUid: request.body.deviceUid,
    description: request.body.description,
    location: request.body.location,
  });

  reply.code(200).send(result.toJSON());
}

async function updateStore(request: FastifyRequest<UpdateStore>, reply: FastifyReply) {
  const repo = new StoreInfoCommandRepo(StoreInfo, DeviceInfo);

  await repo.update({
    uid: request.params.uid,
    name: request.body.name,
    description: request.body.description,
    location: request.body.location,
  });

  reply.code(200).send();
}

async function removeStore(request: FastifyRequest<RemoveStore>, reply: FastifyReply) {
  const repo = new StoreInfoCommandRepo(StoreInfo, DeviceInfo);

  await repo.remove(request.params.uid);

  reply.code(200).send();
}

async function getMultipleStores(request: FastifyRequest<GetMultipleStores>, reply: FastifyReply) {
  const repo = new StoreInfoQueryRepo(StoreInfo);
  const options: FindManyOptions<OmitFuncs<StoreInfoEntity>, string> =
    createFindManyOptions(
      request.query.searchOption === 'coordinates' || request.query.searchOption === 'area'
        ? {
          searchOption: undefined,
          amount: request.query.amount,
          order: request.query.order,
        }
        : request.query,
      orderParam,
    );

  let results: StoreInfoEntity[] = [];
  if (request.query?.searchOption != null && request.query.searchOption === 'coordinates') {
    if (request.query.minDistance != null && request.query.minDistance > request.query.maxDistance) {
      reply.code(422).send('minDistance must be less than maxDistance');
      return;
    }

    const coordinates: Static<typeof coordinatesParam> | unknown = JSON.parse(request.query.coordinates);
    const checker = TypeCompiler.Compile(coordinatesParam);
    if (!checker.Check(coordinates)) {
      reply.code(422).send('coordinates are invalid');
      return;
    }

    results = await repo.findNearby(
      coordinates,
      request.query.maxDistance,
      request.query.minDistance ?? request.query.maxDistance,
      options,
    );
  } else if (request.query?.searchOption === 'area') {
    const area: Static<typeof areaParam> | unknown = JSON.parse(request.query.area);
    const checker = TypeCompiler.Compile(areaParam);
    if (!checker.Check(area)) {
      reply.code(422).send('area is invalid');
      return;
    }

    results = await repo.findInArea(area, options);
  } else {
    results = await repo.findMany(options);
  }

  reply.code(200).send(results.map(result => result.toJSON()));
}

async function getSingularStore(request: FastifyRequest<GetSingularStore>, reply: FastifyReply) {
  const repo = new StoreInfoQueryRepo(StoreInfo);
  const result = await repo.findOne(request.params.uid);
  if (result == null) {
    reply.code(404).send();
    return;
  }

  reply.code(200).send(result.toJSON());
}

export function storeRoutes(instance: FastifyInstance, _: FastifyPluginOptions, done: (err?: Error) => void) {
  instance.post('/', { schema: createStoreInfo }, createStore);
  instance.patch('/:uid', { schema: updateStoreInfo }, updateStore);
  instance.delete('/:uid', { schema: removeStoreInfo }, removeStore);

  instance.get('/', { schema: getMultipleStoreInfo }, getMultipleStores);
  instance.get('/:uid', { schema: getSingularStoreInfo }, getSingularStore);

  done();
}
