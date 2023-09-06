import { model, Model, Schema, Types } from 'mongoose';
import { DocumentVersion, TemplateVersion } from '@mongo/geospatial-time-series/infra/interfaces/versions';

export interface PedometerTotalRaw extends DocumentVersion, TemplateVersion {
  userUid: Types.ObjectId,
  cnt: number,
}

export type PedometerTotalModel = Model<PedometerTotalRaw>;
const pedometerTotal: Schema<PedometerTotalRaw, PedometerTotalModel> = new Schema({
  _tplVer: {
    type: 'number',
    default: 1,
    required: true,
    min: 1,
  },
  userUid: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  cnt: {
    type: 'number',
    min: 0,
    required: true,
  },
}, {
  versionKey: false,
});

export const PedometerTotal = model<PedometerTotalRaw, PedometerTotalModel>(
  'PedometerTotal',
  pedometerTotal,
  'pedometerTotal',
);
