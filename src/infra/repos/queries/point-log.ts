import { ClientSession, Types } from 'mongoose';
import { PointLogModel } from '@mongo/geospatial-time-series/infra/models/point-log';
import { FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import { MAX_SEARCH_LENGTH_POINT_LOG, PointLog } from '@mongo/geospatial-time-series/domains/entities/point-log';
import { PointExtraOptions, PointLogQuery } from '@mongo/geospatial-time-series/domains/repos/queries/point-log';
import { mongoOrder } from '@mongo/geospatial-time-series/utils';
import { DateTime } from 'luxon';

export class PointLogQueryRepo implements PointLogQuery {
  constructor(
    private readonly pointLogModel: PointLogModel,
    private readonly session?: ClientSession,
  ) {}

  public async findOne(
    pointUid: string,
  ) {
    const query = this.pointLogModel.findOne(
      { _id: pointUid },
      undefined,
      { session: this.session },
    );
    const item = await query;
    if (item == null) {
      return undefined;
    }

    return new PointLog(
      item._id.toHexString(),
      item.userUid.toHexString(),
      item.type,
      item.amount,
      item.reason,
      item.createdAtRaw,
    );
  }

  public async findBetween(
    start: DateTime,
    end: DateTime,
    userUid?: string,
    findOptions?: FindManyOptions<Pick<OmitFuncs<PointLog>, 'createdAtRaw'>, string> & PointExtraOptions,
  ) {
    let query = this.pointLogModel.find({
      $and: [
        {
          createdAtRaw: {
            $gte: start.startOf('day').toJSDate(),
          },
        },
        {
          createdAtRaw: {
            $lte: end.endOf('day').toJSDate(),
          },
        },
      ],
    });
    if (findOptions?.searchOption != null) {
      if (findOptions.cursor != null) {
        query = query.and([
          {
            _id: { $gte: new Types.ObjectId(findOptions.cursor) },
          },
        ]);
      }
    }

    if (findOptions?.order != null) {
      query = query.sort(mongoOrder(findOptions.order));
    }

    if (findOptions?.pointType != null) {
      query = query.and([
        {
          type: findOptions.pointType,
        },
      ]);
    }

    if (findOptions?.reason != null) {
      query = query.and([
        {
          reason: findOptions.reason,
        },
      ]);
    }

    if (findOptions?.amount != null && findOptions.amount !== 'max') {
      query = query.limit(findOptions.amount);
    } else {
      query = query.limit(MAX_SEARCH_LENGTH_POINT_LOG);
    }

    if (userUid != null) {
      query = query.and([
        {
          userUid,
        },
      ]);
    }

    const items = await query;
    if (items.length === 0) {
      return [];
    }

    return items.map(item => {
      return new PointLog(
        item._id.toHexString(),
        item.userUid.toHexString(),
        item.type,
        item.amount,
        item.reason,
        item.createdAtRaw,
      );
    });
  }

  public async findMany(
    userUid?: string,
    findOptions?: FindManyOptions<Pick<OmitFuncs<PointLog>, 'createdAtRaw'>, string> & PointExtraOptions,
  ) {
    let query = this.pointLogModel.find();
    if (findOptions?.searchOption != null) {
      if (findOptions.cursor != null) {
        query = query.and([
          {
            _id: { $gte: new Types.ObjectId(findOptions.cursor) },
          },
        ]);
      }
    }

    if (findOptions?.order != null) {
      query = query.sort(mongoOrder(findOptions.order));
    }

    if (findOptions?.pointType != null) {
      query = query.and([
        {
          type: findOptions.pointType,
        },
      ]);
    }

    if (findOptions?.reason != null) {
      query = query.and([
        {
          reason: findOptions.reason,
        },
      ]);
    }

    if (findOptions?.amount != null && findOptions.amount !== 'max') {
      query = query.limit(findOptions.amount);
    } else {
      query = query.limit(MAX_SEARCH_LENGTH_POINT_LOG);
    }

    if (userUid != null) {
      query = query.and([
        {
          userUid,
        },
      ]);
    }

    const items = await query;
    if (items.length === 0) {
      return [];
    }

    return items.map(item => {
      return new PointLog(
        item._id.toHexString(),
        item.userUid.toHexString(),
        item.type,
        item.amount,
        item.reason,
        item.createdAtRaw,
      );
    });
  }
}
