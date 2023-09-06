import { model, Model, Schema, Types } from 'mongoose';
import { DocumentVersion, TemplateVersion } from '@mongo/geospatial-time-series/infra/interfaces/versions';
import { Enum } from '@mongo/geospatial-time-series/types';
import {
  PointDepositReason,
  PointLogType,
  PointWithdrawReason,
} from '@mongo/geospatial-time-series/domains/entities/point-log';
import { PrimaryKey } from '@mongo/geospatial-time-series/infra/interfaces/primary-key';

export interface PointLogRaw extends PrimaryKey, DocumentVersion, TemplateVersion {
  userUid: Types.ObjectId,
  type: Enum<typeof PointLogType>,
  amount: number,
  reason: Enum<typeof PointDepositReason> | Enum<typeof PointWithdrawReason>,
  createdAtRaw: Date,
}

export type PointLogModel = Model<PointLogRaw>;
const pointLog: Schema<PointLogRaw, PointLogModel> = new Schema({
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
  type: {
    type: 'string',
    enum: PointLogType,
    required: true,
  },
  amount: {
    type: 'number',
    min: 1,
    required: true,
  },
  reason: {
    type: 'string',
    validate: function(this: PointLogRaw, reason: string) {
      if (this.type == null) {
        return false;
      }

      if (this.type === 'deposit' && PointDepositReason.indexOf(reason as never) > -1) {
        return true;
      }

      return this.type === 'withdraw' && PointDepositReason.indexOf(reason as never) > -1;
    },
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

pointLog.index({
  type: 1,
  userUid: 1,
  reason: 1,
});

export const PointLog = model<PointLogRaw, PointLogModel>(
  'PointLog',
  pointLog,
  'pointLog',
);
