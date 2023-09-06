import { Enum, FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import {
  PointDepositReason, PointLog,
  PointLogType,
  PointWithdrawReason,
} from '@mongo/geospatial-time-series/domains/entities/point-log';
import { DateTime } from 'luxon';

export type PointExtraOptions = {
  pointType?: Enum<typeof PointLogType>,
  reason?: never,
} | {
  pointType: 'deposit',
  reason?: Enum<typeof PointDepositReason>,
} | {
  pointType: 'withdraw',
  reason?: Enum<typeof PointWithdrawReason>,
};

export interface PointLogQuery {
  findOne(pointUid: string): Promise<PointLog | undefined>,
  findBetween(
    start: DateTime,
    end: DateTime,
    userUid?: string,
    options?: FindManyOptions<OmitFuncs<PointLog>, string> & PointExtraOptions,
  ): Promise<PointLog[]>,
  findMany(
    userUid?: string,
    options?: FindManyOptions<OmitFuncs<PointLog>, string> & PointExtraOptions,
  ): Promise<PointLog[]>,
}
