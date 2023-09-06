import { ClientSession, Types } from 'mongoose';
import { DeviceInfoQuery } from '@mongo/geospatial-time-series/domains/repos/queries/device-info';
import { DeviceInfoModel } from '@mongo/geospatial-time-series/infra/models/device-info';
import { FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import {
  DeviceInfo,
  DeviceLog,
  MAX_LENGTH_DEVICE_LOG, MAX_SEARCH_LENGTH_DEVICE_INFO,
} from '@mongo/geospatial-time-series/domains/entities/device-info';
import { Expendable, Sized, mongoOrder } from '@mongo/geospatial-time-series/utils';
import { DeviceLogModel } from '@mongo/geospatial-time-series/infra/models/device-log';

export class DeviceInfoQueryRepo implements DeviceInfoQuery {
  constructor(
    private readonly deviceInfoModel: DeviceInfoModel,
    private readonly deviceLogModel: DeviceLogModel,
    private readonly session?: ClientSession,
  ) {}

  public async findOne(uid: string) {
    const query = this.deviceInfoModel.findOne(
      { _id: uid },
      undefined,
      { session: this.session },
    );
    const item = await query;
    if (item == null) {
      return undefined;
    }

    const next = await this.deviceLogModel.findOne(
      { macAddress: item.macAddress },
      { _id: 1 },
      { session: this.session },
    ).skip(MAX_LENGTH_DEVICE_LOG);
    const logs = item.recentLogs.map(log => new DeviceLog(
      log._id.toHexString(),
      log.state,
      log.createdAtRaw,
    ));

    return new DeviceInfo(
      item.id,
      item.name,
      item.macAddress,
      next == null
        ? new Sized(logs)
        : new Expendable(logs, next._id.toHexString()),
      item.createdAtRaw,
    );
  }

  public async findMany(
    findOptions?: FindManyOptions<Omit<OmitFuncs<DeviceInfo>, 'recentLogs'>, string>,
  ) {
    let query = this.deviceInfoModel.find(
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
      query = query.limit(MAX_SEARCH_LENGTH_DEVICE_INFO);
    }

    const items = await query;
    if (items.length === 0) {
      return [];
    }

    return await Promise.all(items.map(async item => {
      const next = await this.deviceLogModel.findOne(
        { macAddress: item.macAddress },
        { _id: 1 },
        { session: this.session },
      ).skip(MAX_LENGTH_DEVICE_LOG);
      const logs = item.recentLogs.map(log => new DeviceLog(
        log._id.toHexString(),
        log.state,
        log.createdAtRaw,
      ));

      return new DeviceInfo(
        item.id,
        item.name,
        item.macAddress,
        next == null
          ? new Sized(logs)
          : new Expendable(logs, next._id.toHexString()),
        item.createdAtRaw,
      );
    }));
  }
}
