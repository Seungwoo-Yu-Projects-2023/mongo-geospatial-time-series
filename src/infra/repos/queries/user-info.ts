import { ClientSession, Types } from 'mongoose';
import { UserInfoModel } from '@mongo/geospatial-time-series/infra/models/user-info';
import { FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import {
  MAX_LENGTH_POINT_LOG,
  MAX_SEARCH_LENGTH_USER_INFO,
  PointLog,
  UserInfo,
} from '@mongo/geospatial-time-series/domains/entities/user-info';
import { Expendable, Sized, mongoOrder } from '@mongo/geospatial-time-series/utils';
import { UserInfoQuery } from '@mongo/geospatial-time-series/domains/repos/queries/user-info';
import { PointLogModel } from '@mongo/geospatial-time-series/infra/models/point-log';

export class UserInfoQueryRepo implements UserInfoQuery {
  constructor(
    private readonly userInfoModel: UserInfoModel,
    private readonly pointLogModel: PointLogModel,
    private readonly session?: ClientSession,
  ) {}

  public async exists(userUid: string) {
    const user = await this.userInfoModel.exists({
      _id: userUid,
    });

    return user?._id != null;
  }

  public async findOne(uid: string) {
    const query = this.userInfoModel.findOne(
      { _id: uid },
      undefined,
      { session: this.session },
    );
    const item = await query;
    if (item == null) {
      return undefined;
    }

    const next = await this.pointLogModel.findOne(
      { userUid: item.id },
      { _id: 1 },
    ).skip(MAX_LENGTH_POINT_LOG);
    const logs = item.pointLogs.map(log => new PointLog(
      log._id.toHexString(),
      log.type,
      log.amount,
      log.reason,
      log.createdAtRaw,
    ));

    return new UserInfo(
      item._id.toHexString(),
      item.nickname,
      next == null
        ? new Sized(logs)
        : new Expendable(logs, next._id.toHexString()),
      item.pointBalance,
      item.createdAtRaw,
    );
  }

  public async findMany(
    findOptions?: FindManyOptions<Omit<OmitFuncs<UserInfo>, 'pointLogs'>, string>,
  ) {
    let query = this.userInfoModel.find();
    if (findOptions?.searchOption != null && findOptions.cursor != null) {
      query = this.userInfoModel.find({
        _id: { $gte: new Types.ObjectId(findOptions.cursor) },
      });
    }

    if (findOptions?.order != null) {
      query = query.sort(mongoOrder(findOptions.order));
    }

    if (findOptions?.amount != null && findOptions.amount !== 'max') {
      query = query.limit(findOptions.amount);
    } else {
      query = query.limit(MAX_SEARCH_LENGTH_USER_INFO);
    }

    const items = await query;
    if (items.length === 0) {
      return [];
    }

    return Promise.all(items.map(async item => {
      const next = await this.pointLogModel.findOne(
        { userUid: item.id },
        { _id: 1 },
      ).skip(MAX_LENGTH_POINT_LOG);
      const logs = item.pointLogs.map(log => new PointLog(
        log._id.toHexString(),
        log.type,
        log.amount,
        log.reason,
        log.createdAtRaw,
      ));

      return new UserInfo(
        item._id.toHexString(),
        item.nickname,
        next == null
          ? new Sized(logs)
          : new Expendable(logs, next._id.toHexString()),
        item.pointBalance,
        item.createdAtRaw,
      );
    }));
  }
}
