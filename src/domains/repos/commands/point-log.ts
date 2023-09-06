import { PointLog } from '@mongo/geospatial-time-series/domains/entities/point-log';
import { OmitFuncs } from '@mongo/geospatial-time-series/types';

export interface PointLogCommand {
  insert(log: Omit<OmitFuncs<PointLog>, 'uid' | 'createdAtRaw'>): Promise<PointLog>,
}
