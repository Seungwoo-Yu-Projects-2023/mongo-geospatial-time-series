import { StoreInfoCommand } from '@mongo/geospatial-time-series/domains/repos/commands/store-info';
import { StoreInfo } from '@mongo/geospatial-time-series/domains/entities/store-info';
import { OmitFuncs, PartialExcept } from '@mongo/geospatial-time-series/types';
import { StoreInfoModel } from '@mongo/geospatial-time-series/infra/models/store-info';
import { ClientSession } from 'mongoose';
import { DeviceInfoModel } from '@mongo/geospatial-time-series/infra/models/device-info';
import { Point2D } from '@mongo/geospatial-time-series/infra/models/common';

export class StoreInfoCommandRepo implements StoreInfoCommand {
  constructor(
    private readonly storeInfoModel: StoreInfoModel,
    private readonly deviceInfoModel: DeviceInfoModel,
    private readonly session?: ClientSession,
  ) {
  }

  public async insert(info: Omit<OmitFuncs<StoreInfo>, 'uid' | 'createdAtRaw'>) {
    const deviceInfo = await this.deviceInfoModel.findOne(
      {
        _id: info.deviceUid,
      },
      undefined,
      {
        session: this.session,
      },
    );

    if (deviceInfo == null) {
      throw new Error('device uid not found in device info');
    }

    const created = await this.storeInfoModel.create(
      [
        {
          name: info.name,
          description: info.description,
          deviceUid: info.deviceUid,
          location: new Point2D(info.location),
        },
      ],
      {
        session: this.session,
      },
    );

    return new StoreInfo(
      created[0]._id.toHexString(),
      created[0].name,
      created[0].description,
      created[0].deviceUid.toHexString(),
      created[0].location.coordinates,
      created[0].createdAtRaw,
    );
  }

  public async remove(uid: string) {
    await this.storeInfoModel.deleteOne(
      {
        _id: uid,
      },
      {
        session: this.session,
      },
    );
  }

  public async update(info: PartialExcept<Omit<StoreInfo, 'deviceUid' | 'createdAtRaw'>, 'uid'>) {
    await this.storeInfoModel.updateOne(
      {
        _id: info.uid,
      },
      {
        $set: {
          name: info.name,
          description: info.description,
          location: info.location == null ? undefined : new Point2D(info.location),
        },
      },
    );
  }
}
