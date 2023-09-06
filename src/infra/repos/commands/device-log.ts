import { DeviceLogCommand } from '@mongo/geospatial-time-series/domains/repos/commands/device-log';
import { ClientSession } from 'mongoose';
import { DeviceLog } from '@mongo/geospatial-time-series/domains/entities/device-log';
import { DeviceLogModel } from '@mongo/geospatial-time-series/infra/models/device-log';
import { DeviceInfoModel } from '@mongo/geospatial-time-series/infra/models/device-info';
import { MAX_LENGTH_DEVICE_LOG } from '@mongo/geospatial-time-series/domains/entities/device-info';
import { OmitFuncs } from '@mongo/geospatial-time-series/types';

export class DeviceLogCommandRepo implements DeviceLogCommand {
  constructor(
    private readonly deviceLogRawModel: DeviceLogModel,
    private readonly deviceInfoModel: DeviceInfoModel,
    private readonly session: ClientSession,
  ) {
  }
  public async insert(log: Omit<OmitFuncs<DeviceLog>, 'uid' | 'createdAtRaw' | 'macAddress'>) {
    const info = await this.deviceInfoModel.findOne(
      {
        _id: log.deviceUid,
      },
      undefined,
      {
        session: this.session,
      },
    );

    if (info == null) {
      throw new Error('uid not found in device info');
    }

    const created = await this.deviceLogRawModel.create(
      [
        {
          deviceUid: log.deviceUid,
          state: log.state,
          macAddress: info.macAddress,
        },
      ],
    );

    info.recentLogs.push(created[0]);

    if (info.recentLogs.length > MAX_LENGTH_DEVICE_LOG) {
      info.recentLogs.splice(0, info.recentLogs.length - MAX_LENGTH_DEVICE_LOG);
    }

    await this.deviceInfoModel.updateOne(
      {
        _id: info._id,
      },
      {
        $set: {
          recentLogs: info.recentLogs,
        },
      },
      {
        session: this.session,
      },
    );

    return new DeviceLog(
      created[0]._id.toHexString(),
      created[0].deviceUid.toHexString(),
      created[0].state,
      created[0].macAddress,
      created[0].createdAtRaw,
    );
  }
}
