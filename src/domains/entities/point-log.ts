import { Enum } from '@mongo/geospatial-time-series/types';
import { ToJSON } from '@mongo/geospatial-time-series/utils';
import { PointLogType as PointLogSchemaType } from '@mongo/geospatial-time-series/apps/users/schema';
import { DateTime } from 'luxon';

export const MAX_SEARCH_LENGTH_POINT_LOG = 1000;
export const PointLogType = ['deposit', 'withdraw'] as const;
export const PointDepositReason = ['admin'] as const;
export const PointWithdrawReason = ['admin'] as const;

export class PointLog implements ToJSON<PointLogSchemaType> {
  constructor(
    public readonly uid: string,
    public readonly userUid: string,
    public readonly type: Enum<typeof PointLogType>,
    public readonly amount: number,
    public readonly reason: Enum<typeof PointDepositReason> | Enum<typeof PointWithdrawReason>,
    public readonly createdAtRaw: Date,
  ) {}

  public toJSON(): PointLogSchemaType {
    return {
      ...this,
      createdAtRaw: DateTime.fromJSDate(this.createdAtRaw, { zone: 'UTC' }).toISO()!,
    };
  }
}
