import { Model, model, Schema, Types } from 'mongoose';
import { DocumentVersion, TemplateVersion } from '@mongo/geospatial-time-series/infra/interfaces/versions';
import { CreatedAt } from '@mongo/geospatial-time-series/infra/interfaces/created-at';
import { Enum } from '@mongo/geospatial-time-series/types';
import { DeviceState } from '@mongo/geospatial-time-series/domains/entities/device-info';
import { PrimaryKey } from '@mongo/geospatial-time-series/infra/interfaces/primary-key';

export interface DeviceLogRaw extends PrimaryKey, DocumentVersion, TemplateVersion, CreatedAt {
  deviceUid: Types.ObjectId,
  state: Enum<typeof DeviceState>,
  macAddress: string,
}

export type DeviceLogModel = Model<DeviceLogRaw>;
const deviceLog: Schema<DeviceLogRaw, DeviceLogModel> = new Schema({
  _tplVer: {
    type: 'number',
    default: 1,
    required: true,
    min: 1,
  },
  deviceUid: {
    type: Schema.Types.ObjectId,
    required: true,
    index: 1,
  },
  state: {
    type: 'string',
    enum: DeviceState,
    required: true,
  },
  macAddress: {
    type: 'string',
    required: true,
  },
  createdAtRaw: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timeseries: {
    timeField: 'createdAtRaw',
  },
  versionKey: false,
});

export const DeviceLog = model<DeviceLogRaw, DeviceLogModel>(
  'DeviceLog',
  deviceLog,
  'deviceLog',
);
