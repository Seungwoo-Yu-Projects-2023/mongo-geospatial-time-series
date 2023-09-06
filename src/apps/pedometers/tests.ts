import { authorizeTestRequest, superAgent } from '@mongo/geospatial-time-series/global.mocks';
import { UserInfoType, UserType } from '@mongo/geospatial-time-series/apps/users/schema';
import {
  PedometerDailyType, PedometerLogType, PedometerPeriodicInputType, PedometerPeriodicType,
  PedometerTotalType,
  PedometerType,
} from '@mongo/geospatial-time-series/apps/pedometers/schema';
import { DateTime } from 'luxon';
import * as crypto from 'crypto';
import { START_OF_WEEK } from '@mongo/geospatial-time-series/domains/entities/pedometer-periodic';

describe('pedometer command api tests', () => {
  let userId: string;

  beforeAll(async () => {
    const { body: { uid } }: { body: UserInfoType } = await superAgent.post('/api/v1/users')
      .use(authorizeTestRequest)
      .send({
        nickname: 'my nickname 1',
      } as UserType)
      .expect(200);

    userId = uid;
  });

  it('should create pedometer log', async () => {
    await superAgent.post('/api/v1/pedometers/' + userId)
      .use(authorizeTestRequest)
      .send({
        count: 10,
        createdAtRaw: DateTime.now().toISO()!,
      } as PedometerType)
      .expect(200);
  });
});

describe('pedometer query api tests', () => {
  let userId: string;
  const pedometerInfo: PedometerLogType[] = [];
  let calcCount = 0;
  let extraCount = 0;

  beforeAll(async () => {
    const { body: { uid } }: { body: UserInfoType } = await superAgent.post('/api/v1/users')
      .use(authorizeTestRequest)
      .send({
        nickname: 'my nickname ' + crypto.randomInt(10000),
      } as UserType)
      .expect(200);

    userId = uid;

    let createdAt = DateTime.now();
    for (let i = 0; i < 30; i++) {
      const data: PedometerLogType = {
        createdAtRaw: createdAt.toISO()!,
        count: crypto.randomInt(1, 10),
      };

      pedometerInfo.push(data);
      createdAt = createdAt.plus({ day: 1 });

      await superAgent.post('/api/v1/pedometers/' + userId)
        .use(authorizeTestRequest)
        .send(data as PedometerLogType)
        .expect(200);
    }

    calcCount = pedometerInfo.reduce((pv, cv) => {
      if (cv != null) {
        pv += cv.count;
      }

      return pv;
    }, 0);
  });

  it('should get pedometer total log', async () => {
    const { body: { count } }: { body: PedometerTotalType } =
      await superAgent.get(`/api/v1/pedometers/${userId}/total`)
        .use(authorizeTestRequest)
        .send()
        .expect(200);

    expect(count).toStrictEqual(calcCount);
  });

  it('should get pedometer daily log', async () => {
    extraCount = 1;

    await superAgent.post('/api/v1/pedometers/' + userId)
      .use(authorizeTestRequest)
      .send({
        createdAtRaw: DateTime.now().toISO()!,
        count: extraCount,
      } as PedometerLogType)
      .expect(200);

    const { body: { count } }: { body: PedometerDailyType } =
      await superAgent.get(`/api/v1/pedometers/${userId}/daily`)
        .use(authorizeTestRequest)
        .query({
          createdAtRaw: pedometerInfo[0].createdAtRaw,
        })
        .expect(200);

    expect(count).toStrictEqual(pedometerInfo[0].count + extraCount);
  });

  it('should get pedometer periodic log', async () => {
    const { body: body1 }: { body: PedometerPeriodicType } =
      await superAgent.get(`/api/v1/pedometers/${userId}/periodic`)
        .use(authorizeTestRequest)
        .query({
          start: pedometerInfo[0].createdAtRaw,
          end: pedometerInfo[pedometerInfo.length - 1].createdAtRaw,
        } as PedometerPeriodicInputType)
        .expect(200);

    expect(calcCount + extraCount).toStrictEqual(body1.totalCount);

    const _firstPeriodStart = DateTime.fromISO(pedometerInfo[0].createdAtRaw);
    const firstPeriodStart = _firstPeriodStart.minus({ day: _firstPeriodStart.weekday - START_OF_WEEK });
    const firstPeriodEnd = firstPeriodStart.plus({ day: 7 });
    const { body: body2 }: { body: PedometerPeriodicType } =
      await superAgent.get(`/api/v1/pedometers/${userId}/periodic`)
        .use(authorizeTestRequest)
        .query({
          start: firstPeriodStart.toISO()!,
          end: firstPeriodEnd.toISO()!,
        } as PedometerPeriodicInputType)
        .expect(200);
    const { body: body3 }: { body: PedometerPeriodicType } =
      await superAgent.get(`/api/v1/pedometers/${userId}/periodic`)
        .use(authorizeTestRequest)
        .query({
          start: firstPeriodEnd.toISO()!,
          end: pedometerInfo[pedometerInfo.length - 1].createdAtRaw,
        } as PedometerPeriodicInputType)
        .expect(200);

    expect(calcCount + extraCount).toStrictEqual(body2.totalCount + body3.totalCount);
  });
});
