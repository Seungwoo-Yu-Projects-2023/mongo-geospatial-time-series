import { Coordinates } from '@mongo/geospatial-time-series/types';
import { ToJSON } from '@mongo/geospatial-time-series/utils';
import { StoreInfoType } from '@mongo/geospatial-time-series/apps/stores/schema';
import { DateTime } from 'luxon';

export const MAX_SEARCH_LENGTH_STORE_INFO = 1000;

export class StoreInfo implements ToJSON<StoreInfoType> {
  constructor(
    public readonly uid: string,
    public readonly name: string,
    public readonly description: string,
    public readonly deviceUid: string,
    public readonly location: Coordinates,
    public readonly createdAtRaw: Date,
  ) {}

  public toJSON(): StoreInfoType {
    return {
      ...this,
      createdAtRaw: DateTime.fromJSDate(this.createdAtRaw, { zone: 'UTC' }).toISO()!,
    };
  }
}
