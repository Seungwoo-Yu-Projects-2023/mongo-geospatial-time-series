import { Enum } from '@mongo/geospatial-time-series/types';
import { DeviceState } from '@mongo/geospatial-time-series/domains/entities/device-info';
import { ToJSON } from '@mongo/geospatial-time-series/utils';
import { DeviceLogType } from '@mongo/geospatial-time-series/apps/devices/schema';
import { DateTime } from 'luxon';

export const MAX_SEARCH_LENGTH_DEVICE_LOG = 1000;
export const MAX_LENGTH_DEVICE_LOG = 1000;

export class DeviceLog implements ToJSON<DeviceLogType> {
  constructor(
    public readonly uid: string,
    public readonly deviceUid: string,
    public readonly state: Enum<typeof DeviceState>,
    public readonly macAddress: string,
    public readonly createdAtRaw: Date,
  ) {}

  public toJSON(): DeviceLogType {
    return {
      ...this,
      createdAtRaw: DateTime.fromJSDate(this.createdAtRaw, { zone: 'UTC' }).toISO()!,
    };
  }
}
