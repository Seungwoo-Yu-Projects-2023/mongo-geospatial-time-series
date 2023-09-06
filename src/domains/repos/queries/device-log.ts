import { FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import { DeviceLog } from '@mongo/geospatial-time-series/domains/entities/device-log';

export interface DeviceLogQuery {
  findOne(uid: string): Promise<DeviceLog | undefined>,
  findMany(
    deviceUid: string,
    findOptions?: FindManyOptions<Omit<OmitFuncs<DeviceLog>, 'uid' | 'deviceUid'>, string>,
  ): Promise<DeviceLog[]>,
}
