import { ClientSession, Types } from 'mongoose';
import { PedometerLogQuery } from '@mongo/geospatial-time-series/domains/repos/queries/pedometer-log';
import { DateTime } from 'luxon';
import { PedometerPeriodic, START_OF_WEEK } from '@mongo/geospatial-time-series/domains/entities/pedometer-periodic';
import { PedometerTotal } from '@mongo/geospatial-time-series/domains/entities/pedometer-total';
import { PedometerPeriodicModel } from '@mongo/geospatial-time-series/infra/models/pedometer-periodic';
import { PedometerTotalModel } from '@mongo/geospatial-time-series/infra/models/pedometer-total';
import { PedometerDailyModel } from '@mongo/geospatial-time-series/infra/models/pedometer-daily';
import { PedometerDaily } from '@mongo/geospatial-time-series/domains/entities/pedometer-daily';

export class PedometerLogQueryRepo implements PedometerLogQuery {
  constructor(
    private readonly pedometerDailyModel: PedometerDailyModel,
    private readonly pedometerPeriodicRawModel: PedometerPeriodicModel,
    private readonly pedometerTotalRawModel: PedometerTotalModel,
    private readonly session?: ClientSession,
  ) {}

  public async findInDay(
    _date: DateTime,
    userUid: string,
  ) {
    const date = _date.startOf('day');
    const dailyQuery = this.pedometerDailyModel.findOne(
      {
        userUid,
        baseCreatedAtRaw: date.toJSDate(),
      },
      undefined,
      { session: this.session },
    );

    const daily = await dailyQuery;
    if (daily == null) {
      return undefined;
    }

    return new PedometerDaily(
      daily._id.toHexString(),
      daily.cnt,
      daily.logUids.map(uid => uid.toHexString()),
      daily.baseCreatedAtRaw,
    );
  }

  public async findBetween(
    _start: DateTime,
    _end: DateTime,
    userUid: string,
  ): Promise<PedometerPeriodic | undefined> {
    const start = _start.startOf('day').minus({ day: _start.weekday - START_OF_WEEK });
    const end = _end.startOf('day').plus({ day: Math.abs(START_OF_WEEK - _end.weekday) });

    const periodicQuery = this.pedometerPeriodicRawModel.find(
      {
        $and: [
          {
            baseCreatedAtRaw: {
              $gte: start.toJSDate(),
            },
          },
          {
            baseCreatedAtRaw: {
              $lte: end.minus({ millisecond: 1 }).toJSDate(),
            },
          },
          {
            userUid,
          },
        ],
      },
      undefined,
      { session: this.session },
    ).sort({ baseCreatedAtRaw: 'asc' });

    const periodicList = await periodicQuery;
    if (periodicList.length === 0) {
      return undefined;
    }

    const periodicDailyUids = periodicList.reduce(
      (pv, cv) => {
        if (cv != null) {
          pv.push(...cv.dailyUids);
        }

        return pv;
      },
      [] as Types.ObjectId[],
    );
    const dailyList = await this.pedometerDailyModel.find(
      {
        _id: {
          $in: periodicDailyUids,
        },
      },
      undefined,
      { session: this.session },
    ).sort({ baseCreatedAtRaw: 'asc' });
    const totalCount = dailyList.reduce((pv, cv) => {
      if (cv != null) {
        pv += cv.cnt;
      }

      return pv;
    }, 0);

    return new PedometerPeriodic(
      periodicList[0].userUid.toHexString(),
      dailyList.map(daily => new PedometerDaily(
        daily._id.toHexString(),
        daily.cnt,
        daily.logUids.map(uid => uid.toHexString()),
        daily.baseCreatedAtRaw,
      )),
      totalCount,
      start.toJSDate(),
      end.toJSDate(),
    );
  }

  public async findTotal(userUid: string): Promise<PedometerTotal> {
    const query = this.pedometerTotalRawModel.findOne(
      {
        userUid,
      },
      undefined,
      { session: this.session },
    );
    const total = await query;

    return new PedometerTotal(
      userUid,
      total?.cnt ?? 0,
    );
  }
}
