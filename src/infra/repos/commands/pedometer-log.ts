import { PedometerLogCommand } from '@mongo/geospatial-time-series/domains/repos/commands/pedometer-log';
import { PedometerLog } from '@mongo/geospatial-time-series/domains/entities/pedometer-log';
import { ClientSession, Types } from 'mongoose';
import { PedometerLogModel } from '@mongo/geospatial-time-series/infra/models/pedometer-log';
import { PedometerPeriodicModel } from '@mongo/geospatial-time-series/infra/models/pedometer-periodic';
import { PedometerTotalModel } from '@mongo/geospatial-time-series/infra/models/pedometer-total';
import { DateTime } from 'luxon';
import { START_OF_WEEK } from '@mongo/geospatial-time-series/domains/entities/pedometer-periodic';
import { OmitFuncs, PartialExcept } from '@mongo/geospatial-time-series/types';
import { PedometerDailyModel } from '@mongo/geospatial-time-series/infra/models/pedometer-daily';

export class PedometerLogCommandRepo implements PedometerLogCommand {
  constructor(
    private readonly pedometerLogRawModel: PedometerLogModel,
    private readonly pedometerDailyModel: PedometerDailyModel,
    private readonly pedometerPeriodicRawModel: PedometerPeriodicModel,
    private readonly pedometerTotalRawModel: PedometerTotalModel,
    private readonly session: ClientSession,
  ) {
  }

  public async insert(log: PartialExcept<Omit<OmitFuncs<PedometerLog>, 'uid'>, 'userUid' | 'count'>) {
    const created = await this.pedometerLogRawModel.create(
      [
        {
          userUid: log.userUid,
          cnt: log.count,
          createdAtRaw: log.createdAtRaw,
        },
      ],
    );
    const _createdAt = DateTime.fromJSDate(created[0].createdAtRaw, { zone: 'UTC' });
    const dailyCreatedAt = _createdAt.startOf('day');
    const periodicCreatedAt = dailyCreatedAt.minus({ day: dailyCreatedAt.weekday - START_OF_WEEK });

    const _daily = (await this.pedometerDailyModel.findOne(
      {
        userUid: created[0].userUid,
        baseCreatedAtRaw: dailyCreatedAt.toJSDate(),
      },
      undefined,
      { session: this.session },
    )) ?? {
      userUid: created[0].userUid,
      cnt: 0,
      baseCreatedAtRaw: dailyCreatedAt.toJSDate(),
      logUids: [] as Types.ObjectId[],
    };
    _daily.cnt += created[0].cnt;
    _daily.logUids.push(created[0]._id);

    const daily = await this.pedometerDailyModel.findOneAndUpdate(
      {
        userUid: created[0].userUid,
        baseCreatedAtRaw: dailyCreatedAt.toJSDate(),
      },
      _daily,
      {
        upsert: true,
        session: this.session,
        new: true,
      },
    );

    const periodic = (await this.pedometerPeriodicRawModel.findOne(
      {
        userUid: created[0].userUid,
        baseCreatedAtRaw: periodicCreatedAt.toJSDate(),
      },
      undefined,
      { session: this.session },
    )) ?? {
      userUid: created[0].userUid,
      cnt: 0,
      baseCreatedAtRaw: periodicCreatedAt.toJSDate(),
      dailyUids: [] as Types.ObjectId[],
    };
    periodic.cnt += daily.cnt;
    periodic.dailyUids.push(daily._id);

    await this.pedometerPeriodicRawModel.findOneAndUpdate(
      {
        userUid: created[0].userUid,
        baseCreatedAtRaw: periodicCreatedAt.toJSDate(),
      },
      periodic,
      {
        upsert: true,
        session: this.session,
      },
    );

    const total = (await this.pedometerTotalRawModel.findOne(
      {
        userUid: created[0].userUid,
      },
      undefined,
      { session: this.session },
    )) ?? {
      userUid: created[0].userUid,
      cnt: 0,
    };
    total.cnt += created[0].cnt;

    await this.pedometerTotalRawModel.findOneAndUpdate(
      {
        userUid: created[0].userUid,
      },
      total,
      {
        upsert: true,
        session: this.session,
      },
    );

    return new PedometerLog(
      created[0]._id.toHexString(),
      created[0].userUid.toHexString(),
      created[0].cnt,
      created[0].createdAtRaw,
    );
  }
}
