import { PedometerDaily } from '@mongo/geospatial-time-series/domains/entities/pedometer-daily';
import { ToJSON } from '@mongo/geospatial-time-series/utils';
import { PedometerPeriodicType } from '@mongo/geospatial-time-series/apps/pedometers/schema';
import { DateTime } from 'luxon';

// https://en.wikipedia.org/wiki/ISO_week_date
export const START_OF_WEEK: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 1;
// duration for PedometerPeriodic
export const PERIODIC_DURATION_IN_DAYS = 7;

export class PedometerPeriodic implements ToJSON<PedometerPeriodicType>{
  constructor(
    public readonly userUid: string,
    public readonly dailyList: PedometerDaily[],
    public readonly totalCount: number,
    public readonly start: Date,
    public readonly end: Date,
  ) {}

  public toJSON(): PedometerPeriodicType {
    return {
      ...this,
      dailyList: this.dailyList.map(daily => daily.toJSON()),
      start: DateTime.fromJSDate(this.start, { zone: 'UTC' }).toISO()!,
      end: DateTime.fromJSDate(this.end, { zone: 'UTC' }).toISO()!,
    };
  }
}
