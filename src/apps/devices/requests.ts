import { RouteGenericInterface } from 'fastify';
import {
  PartialDeviceLogType,
  DeviceType,
  DeviceUpdateType,
  FindManyInfoOptionType,
  ParamUidType, DeviceInfoType, MultipleDeviceInfoType, MultipleDeviceLogType, FindManyLogOptionType,
} from '@mongo/geospatial-time-series/apps/devices/schema';

export interface CreateDevice extends RouteGenericInterface {
  Body: DeviceType,
  Reply: DeviceInfoType,
}

export interface CreateDeviceLog extends RouteGenericInterface {
  Body: PartialDeviceLogType,
  Params: ParamUidType,
}

export interface UpdateDevice extends RouteGenericInterface {
  Body: DeviceUpdateType,
  Params: ParamUidType,
}

export interface RemoveDevice extends RouteGenericInterface {
  Params: ParamUidType,
}

export interface GetMultipleDevices extends RouteGenericInterface {
  Querystring: FindManyInfoOptionType,
  Reply: MultipleDeviceInfoType,
}

export interface GetSingularDevice extends RouteGenericInterface {
  Params: ParamUidType,
  Reply: DeviceInfoType,
}

export interface GetMultipleDeviceLogs extends RouteGenericInterface {
  Querystring: FindManyLogOptionType,
  Params: ParamUidType,
  Reply: MultipleDeviceLogType,
}
