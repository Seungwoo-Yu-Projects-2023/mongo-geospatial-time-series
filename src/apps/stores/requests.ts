import { RouteGenericInterface } from 'fastify';
import {
  FindManyOptionType,
  ParamUidType, StoreInfoType,
  StoreType,
  StoreUpdateType,
} from '@mongo/geospatial-time-series/apps/stores/schema';

export interface CreateStore extends RouteGenericInterface {
  Body: StoreType,
  Reply: StoreInfoType,
}

export interface UpdateStore extends RouteGenericInterface {
  Body: StoreUpdateType,
  Params: ParamUidType,
}

export interface RemoveStore extends RouteGenericInterface {
  Params: ParamUidType,
}

export interface GetMultipleStores extends RouteGenericInterface {
  Querystring: FindManyOptionType,
}

export interface GetSingularStore extends RouteGenericInterface {
  Params: ParamUidType,
}
