import { Enum } from '@mongo/geospatial-time-series/types';
import { SizedOrExpendable, ToJSON } from '@mongo/geospatial-time-series/utils';
import { DeviceInfoType } from '@mongo/geospatial-time-series/apps/devices/schema';
import { DateTime } from 'luxon';

export const MAX_SEARCH_LENGTH_DEVICE_INFO = 1000;
export const MAX_LENGTH_DEVICE_LOG = 1000;
export const DeviceState = ['connected', 'disconnected'] as const;

export class DeviceLog {
  constructor(
    public readonly uid: string,
    public readonly state: Enum<typeof DeviceState>,
    public readonly createdAtRaw: Date,
  ) {}
}

export class DeviceInfo implements ToJSON<DeviceInfoType> {
  constructor(
    public readonly uid: string,
    public readonly name: string,
    public readonly macAddress: string,
    public readonly recentLogs: SizedOrExpendable<DeviceLog, string>,
    public readonly createdAtRaw: Date,
  ) {}

  public toJSON(): DeviceInfoType {
    return {
      ...this,
      recentLogs: {
        ...this.recentLogs,
        array: this.recentLogs.array.map(log => {
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
