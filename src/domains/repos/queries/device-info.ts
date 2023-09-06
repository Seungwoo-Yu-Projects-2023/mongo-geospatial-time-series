import { DeviceInfo } from '@mongo/geospatial-time-series/domains/entities/device-info';
import { FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';

export interface DeviceInfoQuery {
  findOne(uid: string): Promise<DeviceInfo | undefined>,
  findMany(findOptions?: FindManyOptions<Omit<OmitFuncs<DeviceInfo>, 'recentLogs'>, string>): Promise<DeviceInfo[]>,
}
