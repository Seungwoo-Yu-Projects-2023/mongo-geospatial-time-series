import { UserInfo } from '@mongo/geospatial-time-series/domains/entities/user-info';
import { OmitFuncs, PartialExcept } from '@mongo/geospatial-time-series/types';

export interface UserInfoCommand {
  insert(info: Omit<OmitFuncs<UserInfo>, 'uid' | 'pointLogs' | 'createdAtRaw'>): Promise<UserInfo>,
  update(info: PartialExcept<OmitFuncs<UserInfo>, 'uid'>): Promise<void>,
  remove(uid: string): Promise<void>,
}
