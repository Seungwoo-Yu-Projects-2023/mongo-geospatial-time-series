import { DeviceInfoCommand } from '@mongo/geospatial-time-series/domains/repos/commands/device-info';
import { DeviceInfo } from '@mongo/geospatial-time-series/domains/entities/device-info';
import { OmitFuncs, PartialExcept } from '@mongo/geospatial-time-series/types';
import { DeviceInfoModel } from '@mongo/geospatial-time-series/infra/models/device-info';
import { ClientSession } from 'mongoose';
import { Sized } from '@mongo/geospatial-time-series/utils';

export class DeviceInfoCommandRepo implements DeviceInfoCommand {
  constructor(
    private readonly deviceInfoModel: DeviceInfoModel,
    private readonly session?: ClientSession,
  ) {
  }

  public async insert(info: Omit<OmitFuncs<DeviceInfo>, 'uid' | 'recentLogs' | 'createdAtRaw'>): Promise<DeviceInfo> {
    const created = await this.deviceInfoModel.create(
      [
        {
          name: info.name,
          macAddress: info.macAddress,
          recentLogs: [],
        },
      ],
      {
        session: this.session,
      },
    );

    return new DeviceInfo(
      created[0]._id.toHexString(),
      created[0].name,
      created[0].macAddress,
      new Sized([]),
      created[0].createdAtRaw,
    );
  }

  public async remove(uid: string) {
    await this.deviceInfoModel.deleteOne(
      {
        _id: uid,
      },
      {
        session: this.session,
      },
    );
  }

  public async update(
    info: PartialExcept<Omit<OmitFuncs<DeviceInfo>, 'macAddress' | 'recentLogs' | 'createdAtRaw'>, 'uid'>,
  ): Promise<void> {
    await this.deviceInfoModel.updateOne(
      {
        _id: info.uid,
      },
      {
        $set: {
          name: info.name,
        },
      },
      {
        session: this.session,
      },
    );
  }
}
