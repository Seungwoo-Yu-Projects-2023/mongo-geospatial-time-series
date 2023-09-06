import { RouteGenericInterface } from 'fastify';
import {
  FindManyOptionType, FindManyPointOptionType,
  ParamUidType, PointType, UserInfoType,
  UserType,
  UserUpdateType,
} from '@mongo/geospatial-time-series/apps/users/schema';

export interface CreateUser extends RouteGenericInterface {
  Body: UserType,
  Reply: UserInfoType,
}

export interface CreatePoint extends RouteGenericInterface {
  Body: PointType,
  Params: ParamUidType,
}

export interface UpdateUser extends RouteGenericInterface {
  Body: UserUpdateType,
  Params: ParamUidType,
}

export interface RemoveUser extends RouteGenericInterface {
  Params: ParamUidType,
}

export interface GetMultipleUsers extends RouteGenericInterface {
  Querystring: FindManyOptionType,
}

export interface GetSingularUser extends RouteGenericInterface {
  Params: ParamUidType,
}

export interface GetMultiplePoints extends RouteGenericInterface {
  Querystring: FindManyPointOptionType,
  Params: ParamUidType,
}
