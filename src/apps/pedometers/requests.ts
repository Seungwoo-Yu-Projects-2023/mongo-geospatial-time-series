import { RouteGenericInterface } from 'fastify';
import {
  ParamUserUidType,
  PedometerDailyInputType,
  PedometerPeriodicInputType,
  PedometerType,
} from '@mongo/geospatial-time-series/apps/pedometers/schema';

export interface CreatePedometer extends RouteGenericInterface {
  Body: PedometerType,
  Params: ParamUserUidType,
}

export interface GetTotal extends RouteGenericInterface {
  Params: ParamUserUidType,
}

export interface GetDaily extends RouteGenericInterface {
  Querystring: PedometerDailyInputType,
  Params: ParamUserUidType,
}

export interface GetPeriodic extends RouteGenericInterface {
  Querystring: PedometerPeriodicInputType,
  Params: ParamUserUidType,
}
