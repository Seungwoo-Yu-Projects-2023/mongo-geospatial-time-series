import { StoreInfo } from '@mongo/geospatial-time-series/domains/entities/store-info';
import { OmitFuncs, PartialExcept } from '@mongo/geospatial-time-series/types';

export interface StoreInfoCommand {
  insert(info: Omit<OmitFuncs<StoreInfo>, 'uid' | 'createdAtRaw'>): Promise<StoreInfo>,
  update(info: PartialExcept<OmitFuncs<StoreInfo>, 'uid' | 'deviceUid' | 'createdAtRaw'>): Promise<void>,
  remove(uid: string): Promise<void>,
}
