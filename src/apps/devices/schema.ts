import { FastifySchema } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { DeviceState, MAX_SEARCH_LENGTH_DEVICE_INFO } from '@mongo/geospatial-time-series/domains/entities/device-info';
import {
  createAmountParam,
  createFindManyTypeBoxOptions,
  createOrderParam,
  createSizedOrExpendableParam,
  createTypeBoxUnion,
} from '@mongo/geospatial-time-series/utils';
import { MAX_SEARCH_LENGTH_DEVICE_LOG } from '@mongo/geospatial-time-series/domains/entities/device-log';

const Device = Type.Object({
  name: Type.String({
    examples: ['device name'],
    minLength: 1,
    maxLength: 20,
  }),
  macAddress: Type.RegExp(
    /([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}/,
    {
      examples: ['11:22:33:44:55:66'],
    },
  ),
});

export type DeviceType = Static<typeof Device>;

export const DeviceInfo = Type.Object({
  uid: Type.String(),
  name: Type.String(),
  macAddress: Type.String(),
  recentLogs: createSizedOrExpendableParam(
    Type.Object({
      state: createTypeBoxUnion(DeviceState),
      createdAtRaw: Type.String(),
    }),
    Type.String(),
  ),
  createdAtRaw: Type.String(),
});

export type DeviceInfoType = Static<typeof DeviceInfo>;

export const createDeviceInfo: FastifySchema = {
  tags: ['devices'],
  body: Device,
  response: {
    200: DeviceInfo,
  },
};

const DeviceUpdate = Type.Object({
  name: Type.Optional(Device.properties.name),
});

export type DeviceUpdateType = Static<typeof DeviceUpdate>;

const ParamUid = Type.Object({
  uid: Type.String({
    minLength: 24,
    maxLength: 24,
  }),
});

export type ParamUidType = Static<typeof ParamUid>;

export const updateDeviceInfo: FastifySchema = {
  tags: ['devices'],
  params: ParamUid,
  body: DeviceUpdate,
  response: {
    200: Type.Null(),
  },
};

export const removeDeviceInfo: FastifySchema = {
  tags: ['devices'],
  params: ParamUid,
  response: {
    200: Type.Null(),
  },
};

const PartialDeviceLog = Type.Object({
  state: createTypeBoxUnion(DeviceState),
});

export type PartialDeviceLogType = Static<typeof PartialDeviceLog>;

export const createDeviceLog: FastifySchema = {
  tags: ['devices'],
  body: PartialDeviceLog,
  params: ParamUid,
  response: {
    200: Type.Null(),
    404: Type.Null(),
  },
};

export const orderDeviceParam = createOrderParam(
  Type.Omit(DeviceInfo, ['recentLogs']).properties,
);

const FindManyInfoOptions = createFindManyTypeBoxOptions(
  Type.String({
    minLength: 24,
    maxLength: 24,
  }),
  createAmountParam(MAX_SEARCH_LENGTH_DEVICE_INFO),
);

export type FindManyInfoOptionType = Static<typeof FindManyInfoOptions>;

export const MultipleDeviceInfo = Type.Array(DeviceInfo);
export type MultipleDeviceInfoType = Static<typeof MultipleDeviceInfo>;

export const getMultipleDeviceInfo: FastifySchema = {
  tags: ['devices'],
  querystring: FindManyInfoOptions,
  response: {
    200: MultipleDeviceInfo,
  },
};

export const getSingularDeviceInfo: FastifySchema = {
  tags: ['devices'],
  params: ParamUid,
  response: {
    200: DeviceInfo,
    404: Type.Null(),
  },
};

export const DeviceLog = Type.Object({
  uid: Type.String(),
  deviceUid: Type.String(),
  state: createTypeBoxUnion(DeviceState),
  macAddress: Type.String(),
  createdAtRaw: Type.String(),
});

export type DeviceLogType = Static<typeof DeviceLog>;

const FindManyLogOptions = createFindManyTypeBoxOptions(
  Type.String({
    minLength: 24,
    maxLength: 24,
  }),
  createAmountParam(MAX_SEARCH_LENGTH_DEVICE_LOG),
);

export type FindManyLogOptionType = Static<typeof FindManyLogOptions>;

export const MultipleDeviceLog = Type.Array(DeviceLog);
export type MultipleDeviceLogType = Static<typeof MultipleDeviceLog>;

export const orderLogParam = createOrderParam(
  DeviceLog.properties,
);

export const getMultipleDeviceLogs: FastifySchema = {
  tags: ['devices'],
  querystring: FindManyLogOptions,
  params: ParamUid,
  response: {
    200: MultipleDeviceLog,
  },
};


