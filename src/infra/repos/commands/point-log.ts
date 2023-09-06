import { PointLogCommand } from '@mongo/geospatial-time-series/domains/repos/commands/point-log';
import { ClientSession } from 'mongoose';
import { PointLog } from '@mongo/geospatial-time-series/domains/entities/point-log';
import { PointLogModel } from '@mongo/geospatial-time-series/infra/models/point-log';
import { UserInfoModel } from '@mongo/geospatial-time-series/infra/models/user-info';
import { MAX_LENGTH_POINT_LOG } from '@mongo/geospatial-time-series/domains/entities/user-info';
import { OmitFuncs } from '@mongo/geospatial-time-series/types';

export class PointLogCommandRepo implements PointLogCommand {
  constructor(
    private readonly pointLogModel: PointLogModel,
    private readonly userInfoModel: UserInfoModel,
    private readonly session: ClientSession,
  ) {
  }

  public async insert(log: Omit<OmitFuncs<PointLog>, 'uid' | 'createdAtRaw'>) {
    const info = await this.userInfoModel.findOne(
      {
        _id: log.userUid,
      },
      undefined,
      {
        session: this.session,
      },
    );

    if (info == null) {
      throw new Error('user uid not found in user info');
    }

    if (log.type === 'deposit') {
      info.pointBalance += log.amount;
    } else if (info.pointBalance - log.amount >= 0) {
      info.pointBalance -= log.amount;
    } else {
      throw new Error('insufficient_points');
    }

    const created = await this.pointLogModel.create(
      [
        {
          userUid: log.userUid,
          type: log.type,
          amount: log.amount,
          reason: log.reason,
        },
      ],
    );

    info.pointLogs.push(created[0]);

    if (info.pointLogs.length > MAX_LENGTH_POINT_LOG) {
      info.pointLogs.splice(0, info.pointLogs.length - MAX_LENGTH_POINT_LOG);
    }

    await this.userInfoModel.updateOne(
      {
        _id: log.userUid,
      },
      {
        $set: {
          pointLogs: info.pointLogs,
          pointBalance: info.pointBalance,
        },
      },
      {
        session: this.session,
      },
    );

    return new PointLog(
      created[0]._id.toHexString(),
      created[0].userUid.toHexString(),
      created[0].type,
      created[0].amount,
      created[0].reason,
      created[0].createdAtRaw,
    );
  }
}
