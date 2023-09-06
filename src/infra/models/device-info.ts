import { model, Model, Schema } from 'mongoose';
import { DocumentVersion, TemplateVersion } from '@mongo/geospatial-time-series/infra/interfaces/versions';
import { CreatedAt } from '@mongo/geospatial-time-series/infra/interfaces/created-at';
import { Enum } from '@mongo/geospatial-time-series/types';
import { DeviceState, MAX_LENGTH_DEVICE_LOG } from '@mongo/geospatial-time-series/domains/entities/device-info';
import { PrimaryKey } from '@mongo/geospatial-time-series/infra/interfaces/primary-key';

export interface DeviceLogRaw extends PrimaryKey, TemplateVersion, CreatedAt {
  state: Enum<typeof DeviceState>,
}
export interface DeviceInfoRaw extends PrimaryKey, DocumentVersion, TemplateVersion, CreatedAt {
  name: string,
  macAddress: string,
  recentLogs: DeviceLogRaw[],
}

export type DeviceLogModel = Model<DeviceLogRaw>;
const deviceLog: Schema<DeviceLogRaw, DeviceLogModel> = new Schema({
  _tplVer: {
    type: 'number',
    default: 1,
    required: true,
  },
  state: {
    type: 'string',
    enum: DeviceState,
    required: true,
  },
  createdAtRaw: {
    type: Date,
    default: () => Date.now(),
    required: true,
  },
}, {
  versionKey: false,
});

export type DeviceInfoModel = Model<DeviceInfoRaw>;
const deviceInfo: Schema<DeviceInfoRaw, DeviceInfoModel> = new Schema({
  _tplVer: {
    type: 'number',
    default: 1,
    required: true,
  },
  name: {
    type: 'string',
    minlength: 1,
    maxlength: 20,
    required: true,
    unique: 1,
  },
  macAddress: {
    type: 'string',
    required: true,
    unique: 1,
  },
  recentLogs: [
    deviceLog,
    {
      default: [],
      required: true,
      maxlength: MAX_LENGTH_DEVICE_LOG,
    },
  ],
  createdAtRaw: {
    type: Date,
    default: () => Date.now(),
    required: true,
  },
}, {
  versionKey: false,
});

export const DeviceInfo = model<DeviceInfoRaw, DeviceInfoModel>(
  'DeviceInfo',
  deviceInfo,
  'deviceInfo',
);
