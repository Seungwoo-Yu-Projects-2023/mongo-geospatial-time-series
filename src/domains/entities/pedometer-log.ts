import { ToJSON } from '@mongo/geospatial-time-series/utils';
import { PedometerLogType } from '@mongo/geospatial-time-series/apps/pedometers/schema';
import { DateTime } from 'luxon';

export const MAX_SEARCH_LENGTH_PEDOMETER_LOG = 1000;

export class PedometerLog implements ToJSON<PedometerLogType> {
  constructor(
    public readonly uid: string,
    public readonly userUid: string,
    public readonly count: number,
    public readonly createdAtRaw: Date,
  ) {}

  public toJSON(): PedometerLogType {
    return {
      ...this,
      createdAtRaw: DateTime.fromJSDate(this.createdAtRaw, { zone: 'UTC' }).toISO()!,
    };
  }
}
