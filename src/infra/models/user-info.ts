import { model, Model, Schema } from 'mongoose';
import { DocumentVersion, TemplateVersion } from '@mongo/geospatial-time-series/infra/interfaces/versions';
import { CreatedAt } from '@mongo/geospatial-time-series/infra/interfaces/created-at';
import { Enum } from '@mongo/geospatial-time-series/types';
import {
  PointDepositReason,
  PointLogType,
  PointWithdrawReason,
} from '@mongo/geospatial-time-series/domains/entities/point-log';
import { MAX_LENGTH_POINT_LOG } from '@mongo/geospatial-time-series/domains/entities/user-info';
import { PrimaryKey } from '@mongo/geospatial-time-series/infra/interfaces/primary-key';

export interface PointLogRaw extends PrimaryKey, TemplateVersion, CreatedAt {
  type: Enum<typeof PointLogType>,
  amount: number,
  reason: Enum<typeof PointDepositReason> | Enum<typeof PointWithdrawReason>,
  createdAtRaw: Date,
}
export interface UserInfoRaw extends PrimaryKey, DocumentVersion, TemplateVersion, CreatedAt {
  nickname: string,
  pointLogs: PointLogRaw[],
  pointBalance: number,
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
    required: true,
  },
  createdAtRaw: {
    type: Date,
    required: true,
  },
}, {
  versionKey: false,
});

export type UserInfoModel = Model<UserInfoRaw>;
const userInfo: Schema<UserInfoRaw, UserInfoModel> = new Schema({
  _tplVer: {
    type: 'number',
    default: 1,
    required: true,
    min: 1,
  },
  nickname: {
    type: 'string',
    minlength: 1,
    maxlength: 20,
    required: true,
    unique: 1,
  },
  pointLogs: [
    pointLog,
    {
      default: [],
      required: true,
      maxlength: MAX_LENGTH_POINT_LOG,
    },
  ],
  pointBalance: {
    type: 'number',
    default: 0,
    min: 0,
    required: true,
  },
  createdAtRaw: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  versionKey: false,
});

export const UserInfo = model<UserInfoRaw, UserInfoModel>(
  'UserInfo',
  userInfo,
  'userInfo',
);
