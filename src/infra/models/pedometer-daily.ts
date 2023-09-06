import { model, Model, Schema, Types } from 'mongoose';
import { DocumentVersion, TemplateVersion } from '@mongo/geospatial-time-series/infra/interfaces/versions';
import { PrimaryKey } from '@mongo/geospatial-time-series/infra/interfaces/primary-key';
import { MAX_LENGTH_DAILY_LOG } from '@mongo/geospatial-time-series/domains/entities/pedometer-daily';

export interface PedometerDailyRaw extends PrimaryKey, DocumentVersion, TemplateVersion {
  userUid: Types.ObjectId,
  cnt: number,
  logUids: (Types.ObjectId)[],
  baseCreatedAtRaw: Date,
}

export type PedometerDailyModel = Model<PedometerDailyRaw>;
const pedometerDaily: Schema<PedometerDailyRaw, PedometerDailyModel> = new Schema({
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
  logUids: {
    type: [Schema.Types.ObjectId],
    default: [],
    required: true,
    maxlength: MAX_LENGTH_DAILY_LOG,
    unique: 1,
  },
  baseCreatedAtRaw: {
    type: Date,
    required: true,
  },
}, {
  versionKey: false,
});

pedometerDaily.index({
  userUid: 1,
  baseCreatedAtRaw: 1,
}, { unique: true });

export const PedometerDaily = model<PedometerDailyRaw, PedometerDailyModel>(
  'PedometerDaily',
  pedometerDaily,
  'pedometerDaily',
);
