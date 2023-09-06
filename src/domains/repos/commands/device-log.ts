import { DeviceLog } from '@mongo/geospatial-time-series/domains/entities/device-log';
import { OmitFuncs } from '@mongo/geospatial-time-series/types';

export interface DeviceLogCommand {
  insert(log: Omit<OmitFuncs<DeviceLog>, 'uid' | 'createdAtRaw' | 'macAddress'>): Promise<DeviceLog>,
}
