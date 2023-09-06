import { ClientSession, Types } from 'mongoose';
import { DeviceLogModel } from '@mongo/geospatial-time-series/infra/models/device-log';
import { FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import { DeviceLog, MAX_SEARCH_LENGTH_DEVICE_LOG } from '@mongo/geospatial-time-series/domains/entities/device-log';
import { DeviceLogQuery } from '@mongo/geospatial-time-series/domains/repos/queries/device-log';
import { mongoOrder } from '@mongo/geospatial-time-series/utils';

export class DeviceLogQueryRepo implements DeviceLogQuery {
  constructor(
    private readonly deviceLogModel: DeviceLogModel,
    private readonly session?: ClientSession,
  ) {}

  public async findOne(uid: string) {
    const query = this.deviceLogModel.findOne(
      { _id: uid },
      undefined,
      { session: this.session },
    );
    const item = await query;
    if (item == null) {
      return undefined;
    }

    return new DeviceLog(
      item._id.toHexString(),
      item.deviceUid.toHexString(),
      item.state,
      item.macAddress,
      item.createdAtRaw,
    );
  }

  public async findMany(
    deviceUid: string,
    findOptions?: FindManyOptions<Omit<OmitFuncs<DeviceLog>, 'uid' | 'deviceUid'>, string>,
  ) {
    let query = this.deviceLogModel.find(
      { deviceUid },
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
      query = query.limit(MAX_SEARCH_LENGTH_DEVICE_LOG);
    }

    const items = await query;
    if (items.length === 0) {
      return [];
    }

    return items.map(item => {
      return new DeviceLog(
        item._id.toHexString(),
        item.deviceUid.toHexString(),
        item.state,
        item.macAddress,
        item.createdAtRaw,
      );
    });
  }
}
