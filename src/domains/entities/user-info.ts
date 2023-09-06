import {
  PointDepositReason,
  PointLogType,
  PointWithdrawReason,
} from '@mongo/geospatial-time-series/domains/entities/point-log';
import { SizedOrExpendable, ToJSON } from '@mongo/geospatial-time-series/utils';
import { Enum } from '@mongo/geospatial-time-series/types';
import { UserInfoType } from '@mongo/geospatial-time-series/apps/users/schema';
import { DateTime } from 'luxon';

export const MAX_SEARCH_LENGTH_USER_INFO = 1000;

export const MAX_LENGTH_POINT_LOG = 1000;

export class PointLog {
  constructor(
    public readonly uid: string,
    public readonly type: Enum<typeof PointLogType>,
    public amount: number,
    public reason: Enum<typeof PointDepositReason> | Enum<typeof PointWithdrawReason>,
    public createdAtRaw: Date,
  ) {}
}

export class UserInfo implements ToJSON<UserInfoType> {
  constructor(
    public readonly uid: string,
    public readonly nickname: string,
    public readonly pointLogs: SizedOrExpendable<PointLog, string>,
    public readonly pointBalance: number,
    public readonly createdAtRaw: Date,
  ) {}

  public toJSON(): UserInfoType {
    return {
      ...this,
      pointLogs: {
        ...this.pointLogs,
        array: this.pointLogs.array.map(log => {
          return {
            ...log,
            createdAtRaw: DateTime.fromJSDate(log.createdAtRaw, { zone: 'UTC' }).toISO()!,
          };
        }),
      },
      createdAtRaw: DateTime.fromJSDate(this.createdAtRaw, { zone: 'UTC' }).toISO()!,
    };
  }
}
