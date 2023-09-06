import { model, Model, Schema, Types } from 'mongoose';
import { DocumentVersion, TemplateVersion } from '@mongo/geospatial-time-series/infra/interfaces/versions';
import { CreatedAt } from '@mongo/geospatial-time-series/infra/interfaces/created-at';
import { Point2D, pointSchema } from '@mongo/geospatial-time-series/infra/models/common';
import { PrimaryKey } from '@mongo/geospatial-time-series/infra/interfaces/primary-key';

export interface StoreInfoRaw extends PrimaryKey, DocumentVersion, TemplateVersion, CreatedAt {
  name: string,
  description: string,
  deviceUid: Types.ObjectId,
  location: Point2D,
}

export type StoreInfoModel = Model<StoreInfoRaw>;
const storeInfo: Schema<StoreInfoRaw, StoreInfoModel> = new Schema({
  name: {
    type: 'string',
    minlength: 1,
    maxlength: 20,
    required: true,
  },
  description: {
    type: 'string',
    minlength: 1,
    maxlength: 100,
    required: true,
  },
  deviceUid: {
    type: Schema.Types.ObjectId,
    required: true,
    index: 1,
  },
  location: {
    type: pointSchema,
    required: true,
    index: '2dsphere',
  },
  createdAtRaw: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  versionKey: false,
});

export const StoreInfo = model<StoreInfoRaw, StoreInfoModel>(
  'StoreInfo',
  storeInfo,
  'storeInfo',
);
