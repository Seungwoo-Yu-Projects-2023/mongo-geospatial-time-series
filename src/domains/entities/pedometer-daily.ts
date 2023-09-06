// single log per 5 seconds at least
import { ToJSON } from '@mongo/geospatial-time-series/utils';
import { PedometerDailyType } from '@mongo/geospatial-time-series/apps/pedometers/schema';
import { DateTime } from 'luxon';

export const MIN_DELAY_BETWEEN_LOGS_IN_SECONDS = 5;
// max log count for a day
export const MAX_LENGTH_DAILY_LOG = 60 / MIN_DELAY_BETWEEN_LOGS_IN_SECONDS * 60 * 24;

export class PedometerDaily implements ToJSON<PedometerDailyType> {
  constructor(
    public readonly userUid: string,
    public readonly count: number,
    public readonly logUids: string[],
    public readonly baseCreatedAtRaw: Date,
  ) {}

  public toJSON(): PedometerDailyType {
    return {
      ...this,
      baseCreatedAtRaw: DateTime.fromJSDate(this.baseCreatedAtRaw, { zone: 'UTC' }).toISO()!,
    };
  }
}
