import { UserInfoCommand } from '@mongo/geospatial-time-series/domains/repos/commands/user-info';
import { UserInfo } from '@mongo/geospatial-time-series/domains/entities/user-info';
import { OmitFuncs, PartialExcept } from '@mongo/geospatial-time-series/types';
import { UserInfoModel } from '@mongo/geospatial-time-series/infra/models/user-info';
import { ClientSession } from 'mongoose';
import { Sized } from '@mongo/geospatial-time-series/utils';

export class UserInfoCommandRepo implements UserInfoCommand {
  constructor(
    private readonly userInfoModel: UserInfoModel,
    private readonly session?: ClientSession,
  ) {
  }

  public async insert(info: Omit<OmitFuncs<UserInfo>, 'uid' | 'pointLogs' | 'createdAtRaw'>) {
    const created = await this.userInfoModel.create(
      [
        {
          nickname: info.nickname,
          pointBalance: info.pointBalance,
        },
      ],
    );

    return new UserInfo(
      created[0]._id.toHexString(),
      created[0].nickname,
      new Sized([]),
      created[0].pointBalance,
      created[0].createdAtRaw,
    );
  }

  public async remove(uid: string) {
    await this.userInfoModel.deleteOne(
      {
        _id: uid,
      },
      {
        session: this.session,
      },
    );
  }

  public async update(info: PartialExcept<UserInfo, 'uid'>) {
    await this.userInfoModel.updateOne(
      {
        _id: info.uid,
      },
      {
        $set: {
          nickname: info.nickname,
          pointBalance: info.pointBalance,
          pointLogs: info.pointLogs?.array,
        },
      },
      {
        session: this.session,
      },
    );
  }
}
