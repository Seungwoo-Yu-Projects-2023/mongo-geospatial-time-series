import { FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import { UserInfo } from '@mongo/geospatial-time-series/domains/entities/user-info';

export interface UserInfoQuery {
  exists(userUid: string): Promise<boolean>,
  findOne(userUid: string): Promise<UserInfo | undefined>,
  findMany(options: FindManyOptions<Omit<OmitFuncs<UserInfo>, 'pointLogs'>, string>): Promise<UserInfo[]>,
}
