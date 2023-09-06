import { ClientSession, Types } from 'mongoose';
import { StoreInfoQuery } from '@mongo/geospatial-time-series/domains/repos/queries/store-info';
import { StoreInfoModel } from '@mongo/geospatial-time-series/infra/models/store-info';
import { Area, Coordinates, FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import { MAX_SEARCH_LENGTH_STORE_INFO, StoreInfo } from '@mongo/geospatial-time-series/domains/entities/store-info';
import { mongoOrder } from '@mongo/geospatial-time-series/utils';
import { Point2D, RectPolygon } from '@mongo/geospatial-time-series/infra/models/common';

export class StoreInfoQueryRepo implements StoreInfoQuery {
  constructor(
    private readonly storeInfoModel: StoreInfoModel,
    private readonly session?: ClientSession,
  ) {}

  public async findOne(uid: string) {
    const query = this.storeInfoModel.findOne(
      { _id: uid },
      undefined,
      { session: this.session },
    );
    const item = await query;
    if (item == null) {
      return undefined;
    }

    return new StoreInfo(
      item._id.toHexString(),
      item.name,
      item.description,
      item.deviceUid.toHexString(),
      item.location.coordinates,
      item.createdAtRaw,
    );
  }

  public async findMany(findOptions?: FindManyOptions<OmitFuncs<StoreInfo>, string>) {
    let query = this.storeInfoModel.find(
      {},
      undefined,
      { session: this.session },
    );
    if (findOptions?.searchOption != null && findOptions.cursor != null) {
      query = query.and([
        {
          _id: { $gte: new Types.ObjectId(findOptions.cursor) },
        },
      ]);
    }

    if (findOptions?.order != null) {
      query = query.sort(mongoOrder(findOptions.order));
    }

    if (findOptions?.amount != null && findOptions.amount !== 'max') {
      query = query.limit(findOptions.amount);
    } else {
      query = query.limit(MAX_SEARCH_LENGTH_STORE_INFO);
    }

    const items = await query;
    if (items.length === 0) {
      return [];
    }

    return items.map(item => {
      return new StoreInfo(
        item._id.toHexString(),
        item.name,
        item.description,
        item.deviceUid.toHexString(),
        item.location.coordinates,
        item.createdAtRaw,
      );
    });
  }

  public async findInArea(area: Area, findOptions?: FindManyOptions<OmitFuncs<StoreInfo>, string>) {
    let query = this.storeInfoModel.find(
      {},
      undefined,
      { session: this.session },
    );
    if (findOptions?.searchOption != null && findOptions.cursor != null) {
      query = query.and([
        {
          _id: { $gte: new Types.ObjectId(findOptions.cursor) },
        },
      ]);
    }

    if (findOptions?.order != null) {
      query = query.sort(mongoOrder(findOptions.order));
    }

    if (findOptions?.amount != null && findOptions.amount !== 'max') {
      query = query.limit(findOptions.amount);
    } else {
      query = query.limit(MAX_SEARCH_LENGTH_STORE_INFO);
    }

    query = query.and([
      {
        location: {
          $geoWithin: {
            $geometry: new RectPolygon(area),
          },
        },
      },
    ]);

    const items = await query;
    if (items.length === 0) {
      return [];
    }

    return items.map(item => {
      return new StoreInfo(
        item._id.toHexString(),
        item.name,
        item.description,
        item.deviceUid.toHexString(),
        item.location.coordinates,
        item.createdAtRaw,
      );
    });
  }

  public async findNearby(
    coordinates: Coordinates,
    maxDistanceInMeters: number,
    minDistanceInMeters?: number,
    findOptions?: FindManyOptions<OmitFuncs<StoreInfo>, string>,
  ) {
    let query = this.storeInfoModel.find(
      {},
      undefined,
      { session: this.session },
    );
    if (findOptions?.searchOption != null) {
      if (findOptions.cursor != null) {
        query = query.and([
          {
            _id: { $gte: new Types.ObjectId(findOptions.cursor) },
          },
        ]);
      }

      if (findOptions.amount != null && findOptions.amount !== 'max') {
        query = query.limit(findOptions.amount);
      }

      if (findOptions.order != null) {
        query = query.sort(mongoOrder(findOptions.order));
      }
    }

    query = query.and([
      {
        location: {
          $near: {
            $geometry: new Point2D(coordinates),
            $maxDistance: maxDistanceInMeters,
            $minDistance: minDistanceInMeters,
          },
        },
      },
    ]);

    const items = await query;
    if (items.length === 0) {
      return [];
    }

    return items.map(item => {
      return new StoreInfo(
        item._id.toHexString(),
        item.name,
        item.description,
        item.deviceUid.toHexString(),
        item.location.coordinates,
        item.createdAtRaw,
      );
    });
  }
}
