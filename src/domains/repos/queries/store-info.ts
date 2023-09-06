import { StoreInfo } from '@mongo/geospatial-time-series/domains/entities/store-info';
import { Area, Coordinates, FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';

export interface StoreInfoQuery {
  findOne(uid: string): Promise<StoreInfo | undefined>,
  findMany(options?: FindManyOptions<OmitFuncs<StoreInfo>, string>): Promise<StoreInfo[]>,
  findNearby(
    coordinates: Coordinates,
    maxDistanceInMeters: number,
    minDistanceInMeters?: number,
    options?: FindManyOptions<OmitFuncs<StoreInfo>, string>,
  ): Promise<StoreInfo[]>,
  findInArea(
    area: Area,
    options?: FindManyOptions<OmitFuncs<StoreInfo>, string>,
  ): Promise<StoreInfo[]>,
}
