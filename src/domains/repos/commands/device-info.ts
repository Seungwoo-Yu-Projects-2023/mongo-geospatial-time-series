import { DeviceInfo } from '@mongo/geospatial-time-series/domains/entities/device-info';
import { OmitFuncs, PartialExcept } from '@mongo/geospatial-time-series/types';

export interface DeviceInfoCommand {
  insert(info: Omit<OmitFuncs<DeviceInfo>, 'uid' | 'recentLogs' | 'createdAtRaw'>): Promise<DeviceInfo>,
  update(
    info: PartialExcept<Omit<OmitFuncs<DeviceInfo>, 'macAddress' | 'recentLogs' | 'createdAtRaw'>, 'uid'>,
  ): Promise<void>,
  remove(uid: string): Promise<void>,
}
