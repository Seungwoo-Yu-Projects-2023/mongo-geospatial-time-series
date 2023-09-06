import { model, Model, Schema, Types } from 'mongoose';
import { CreatedAt } from '@mongo/geospatial-time-series/infra/interfaces/created-at';
import { DocumentVersion, TemplateVersion } from '@mongo/geospatial-time-series/infra/interfaces/versions';
import { PrimaryKey } from '@mongo/geospatial-time-series/infra/interfaces/primary-key';

export interface PedometerLogRaw extends PrimaryKey, DocumentVersion, TemplateVersion, CreatedAt {
  userUid: Types.ObjectId,
  cnt: number,
}

export type PedometerLogModel = Model<PedometerLogRaw>;
const pedometerLog: Schema<PedometerLogRaw, PedometerLogModel> = new Schema({
  _tplVer: {
    type: 'number',
    default: 1,
    required: true,
    min: 1,
  },
  userUid: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  cnt: {
    type: 'number',
    min: 0,
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

pedometerLog.index({
  userUid: 1,
  createdAtRaw: 1,
}, { unique: true });

export const PedometerLog = model<PedometerLogRaw, PedometerLogModel>(
  'PedometerLog',
  pedometerLog,
  'pedometerLog',
);
