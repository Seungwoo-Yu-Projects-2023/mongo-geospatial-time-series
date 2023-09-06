import { FastifySchema } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import {
  createFindManyTypeBoxOptions,
  coordinatesParam, createOrderParam, createAmountParam,
} from '@mongo/geospatial-time-series/utils';
import { MAX_SEARCH_LENGTH_STORE_INFO } from '@mongo/geospatial-time-series/domains/entities/store-info';

const Store = Type.Object({
  name: Type.String({
    examples: ['store name'],
    minLength: 1,
    maxLength: 20,
  }),
  description: Type.String({
    examples: ['store description'],
    minLength: 1,
    maxLength: 100,
  }),
  deviceUid: Type.String({
    minLength: 24,
    maxLength: 24,
  }),
  location: Type.Tuple([
    Type.Number({
      minimum: -180,
      maximum: 180,
    }),
    Type.Number({
      minimum: -90,
      maximum: 90,
    }),
  ]),
});

export type StoreType = Static<typeof Store>;

const StoreInfo = Type.Object({
  uid: Type.String(),
  name: Type.String(),
  description: Type.String(),
  deviceUid: Type.String(),
  location: coordinatesParam,
  createdAtRaw: Type.String(),
});

export type StoreInfoType = Static<typeof StoreInfo>;

export const createStoreInfo: FastifySchema = {
  tags: ['stores'],
  body: Store,
  response: {
    200: StoreInfo,
  },
};

const StoreUpdate = Type.Object({
  name: Type.Optional(Type.String({
    examples: ['store name'],
    minLength: 1,
    maxLength: 20,
  })),
  description: Type.Optional(Type.String({
    examples: ['store description'],
    minLength: 1,
    maxLength: 100,
  })),
  location: Type.Optional(Type.Tuple([
    Type.Number({
      minimum: -180,
      maximum: 180,
    }),
    Type.Number({
      minimum: -90,
      maximum: 90,
    }),
  ])),
});

export type StoreUpdateType = Static<typeof StoreUpdate>;

const ParamUid = Type.Object({
  uid: Type.String({
    minLength: 24,
    maxLength: 24,
  }),
});

export type ParamUidType = Static<typeof ParamUid>;

export const updateStoreInfo: FastifySchema = {
  tags: ['stores'],
  params: ParamUid,
  body: StoreUpdate,
  response: {
    200: Type.Null(),
  },
};

export const removeStoreInfo: FastifySchema = {
  tags: ['stores'],
  params: ParamUid,
  response: {
    200: Type.Null(),
  },
};

export const orderParam = createOrderParam(StoreInfo.properties);

const findManyAmountParam = createAmountParam(MAX_SEARCH_LENGTH_STORE_INFO);
const FindManyOptions = Type.Union([
  Type.Object({
    searchOption: Type.Literal('coordinates'),
    coordinates: Type.String(), // JSON Array
    maxDistance: Type.Number({
      minimum: 0,
    }),
    minDistance: Type.Optional(Type.Number({
      minimum: 0,
    })),
    amount: findManyAmountParam,
    order: Type.Optional(Type.String()), // JSON Object
  }),
  Type.Object({
    searchOption: Type.Literal('area'),
    area: Type.String(), // JSON Array
    amount: findManyAmountParam,
    order: Type.Optional(Type.String()), // JSON Object
  }),
  ...createFindManyTypeBoxOptions(Type.String(), findManyAmountParam).anyOf,
]);

export type FindManyOptionType = Static<typeof FindManyOptions>;

export const getMultipleStoreInfo: FastifySchema = {
  tags: ['stores'],
  querystring: FindManyOptions,
  response: {
    200: Type.Array(StoreInfo),
  },
};

export const getSingularStoreInfo: FastifySchema = {
  tags: ['stores'],
  params: ParamUid,
  response: {
    200: StoreInfo,
    404: Type.Null(),
  },
};
