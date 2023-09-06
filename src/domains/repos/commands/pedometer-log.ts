import { PedometerLog } from '@mongo/geospatial-time-series/domains/entities/pedometer-log';
import { OmitFuncs, PartialExcept } from '@mongo/geospatial-time-series/types';

export interface PedometerLogCommand {
  insert(log: PartialExcept<Omit<OmitFuncs<PedometerLog>, 'uid'>, 'userUid' | 'count'>): Promise<PedometerLog>,
}
