import { model, Model, Schema, Types } from 'mongoose';
import { DocumentVersion, TemplateVersion } from '@mongo/geospatial-time-series/infra/interfaces/versions';
import { PrimaryKey } from '@mongo/geospatial-time-series/infra/interfaces/primary-key';
import { PERIODIC_DURATION_IN_DAYS } from '@mongo/geospatial-time-series/domains/entities/pedometer-periodic';

export interface PedometerPeriodicRaw extends PrimaryKey, DocumentVersion, TemplateVersion {
  userUid: Types.ObjectId,
  cnt: number,
  dailyUids: (Types.ObjectId)[],
  baseCreatedAtRaw: Date,
}

export type PedometerPeriodicModel = Model<PedometerPeriodicRaw>;
const pedometerPeriodic: Schema<PedometerPeriodicRaw, PedometerPeriodicModel> = new Schema({
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
  dailyUids: {
    type: [Schema.Types.ObjectId],
    default: [],
    required: true,
    maxlength: PERIODIC_DURATION_IN_DAYS,
    unique: 1,
  },
  baseCreatedAtRaw: {
    type: Date,
    required: true,
  },
}, {
  versionKey: false,
});

pedometerPeriodic.index({
  userUid: 1,
  baseCreatedAtRaw: 1,
}, { unique: true });

export const PedometerPeriodic = model<PedometerPeriodicRaw, PedometerPeriodicModel>(
  'PedometerPeriodic',
  pedometerPeriodic,
  'pedometerPeriodic',
);
