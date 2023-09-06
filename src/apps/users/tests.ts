import {
  FindManyOptionType, orderPointParam,
  orderUserParam, PointLogType,
  PointType,
  UserInfoType,
  UserType,
} from '@mongo/geospatial-time-series/apps/users/schema';
import { authorizeTestRequest, superAgent } from '@mongo/geospatial-time-series/global.mocks';
import { Static } from '@sinclair/typebox';
import { PointExtraOptions } from '@mongo/geospatial-time-series/domains/repos/queries/point-log';
import crypto from 'crypto';

describe('user command api tests', () => {
  let preUid: string;

  beforeAll(async () => {
    const { body: { uid } }: { body: UserInfoType } = await superAgent.post('/api/v1/users')
      .use(authorizeTestRequest)
      .send({
        nickname: 'my nickname 1',
      } as UserType)
      .expect(200);

    preUid = uid;
  });

  it('should create user info', async () => {
    const { body: body1 }: { body: UserInfoType } = await superAgent.post('/api/v1/users')
      .use(authorizeTestRequest)
      .send({
        nickname: 'my nickname 2',
      } as UserType)
      .expect(200);

    expect(body1.uid).toBeDefined();

    const { body: body2 }: { body: UserInfoType } = await superAgent.get('/api/v1/users/' + body1.uid)
      .use(authorizeTestRequest)
      .expect(200);

    expect(body1.uid).toStrictEqual(body2.uid);
    expect(body1.nickname).toStrictEqual(body2.nickname);
  });

  describe('point log', () => {
    it('should create point log for deposit', async () => {
      const { body: body1 }: { body: UserInfoType } = await superAgent.get('/api/v1/users/' + preUid)
        .use(authorizeTestRequest)
        .expect(200);

      const pointLogRaw: PointType = {
        type: 'deposit',
        amount: 100,
        reason: 'admin',
      };
      await superAgent.post(`/api/v1/users/${preUid}/points`)
        .use(authorizeTestRequest)
        .send(pointLogRaw)
        .expect(200);

      const { body: body2 }: { body: UserInfoType } = await superAgent.get('/api/v1/users/' + preUid)
        .use(authorizeTestRequest)
        .expect(200);
      const pointLog = body2.pointLogs.array[body2.pointLogs.array.length - 1];

      expect(body2.pointBalance).toStrictEqual(body1.pointBalance + pointLogRaw.amount);
      expect(body2.pointLogs.array.length).toStrictEqual(body1.pointLogs.array.length + 1);
      expect(pointLog.type).toStrictEqual(pointLogRaw.type);
      expect(pointLog.type).toStrictEqual('deposit');
      expect(pointLog.amount).toStrictEqual(pointLogRaw.amount);
      expect(pointLog.reason).toStrictEqual(pointLogRaw.reason);
    });

    it('should create point log for deposit', async () => {
      await superAgent.post(`/api/v1/users/${preUid}/points`)
        .use(authorizeTestRequest)
        .send({
          type: 'deposit',
          amount: 100,
          reason: 'admin',
        } as PointType)
        .expect(200);

      const { body: body1 }: { body: UserInfoType } = await superAgent.get('/api/v1/users/' + preUid)
        .use(authorizeTestRequest)
        .expect(200);

      const pointLogRaw: PointType = {
        type: 'withdraw',
        amount: 100,
        reason: 'admin',
      };
      await superAgent.post(`/api/v1/users/${preUid}/points`)
        .use(authorizeTestRequest)
        .send(pointLogRaw)
        .expect(200);

      const { body: body2 }: { body: UserInfoType } = await superAgent.get('/api/v1/users/' + preUid)
        .use(authorizeTestRequest)
        .expect(200);
      const pointLog = body2.pointLogs.array[body2.pointLogs.array.length - 1];

      expect(body2.pointBalance).toStrictEqual(body1.pointBalance - pointLogRaw.amount);
      expect(body2.pointLogs.array.length).toStrictEqual(body1.pointLogs.array.length + 1);
      expect(pointLog.type).toStrictEqual(pointLogRaw.type);
      expect(pointLog.type).toStrictEqual('withdraw');
      expect(pointLog.amount).toStrictEqual(pointLogRaw.amount);
      expect(pointLog.reason).toStrictEqual(pointLogRaw.reason);
    });

    it('should not create point log for deposit because of insufficient points', async () => {
      await superAgent.post(`/api/v1/users/${preUid}/points`)
        .use(authorizeTestRequest)
        .send({
          type: 'deposit',
          amount: 100,
          reason: 'admin',
        } as PointType)
        .expect(200);

      const { body: body1 }: { body: UserInfoType } = await superAgent.get('/api/v1/users/' + preUid)
        .use(authorizeTestRequest)
        .expect(200);

      const pointLogRaw: PointType = {
        type: 'withdraw',
        amount: body1.pointBalance + 1, // more than current balance
        reason: 'admin',
      };

      await new Promise<void>((resolve, reject) => {
        superAgent.post(`/api/v1/users/${preUid}/points`)
          .use(authorizeTestRequest)
          .send(pointLogRaw)
          .expect(422)
          .then(res => {
            expect(res.body).toBeDefined();
            expect(res.body.message).toStrictEqual('insufficient_points');

            return resolve();
          }).catch(reason => reject(reason));
      });
    });
  });

  it('should update user info', async () => {
    const changed = 'changed nickname';
    const { body: body1 }: { body: UserInfoType } = await superAgent.get('/api/v1/users/' + preUid)
      .use(authorizeTestRequest)
      .expect(200);

    await superAgent.patch('/api/v1/users/' + preUid)
      .use(authorizeTestRequest)
      .send({
        nickname: changed,
      } as UserType)
      .expect(200);

    const { body: body2 }: { body: UserInfoType } = await superAgent.get('/api/v1/users/' + preUid)
      .use(authorizeTestRequest)
      .expect(200);

    expect(body1.nickname).not.toStrictEqual(body2.nickname);
    expect(body2.nickname).toStrictEqual(changed);
  });

  it('should delete user info', async () => {
    const { body: { uid } }: { body: UserInfoType } = await superAgent.post('/api/v1/users')
      .use(authorizeTestRequest)
      .send({
        nickname: 'my nickname 3',
      } as UserType)
      .expect(200);

    await superAgent.delete('/api/v1/users/' + uid).use(authorizeTestRequest).expect(200);
    await superAgent.get('/api/v1/users/' + uid).use(authorizeTestRequest).expect(404);
  });
});

describe('user query api tests', () => {
  const preUids: string[] = [];

  beforeAll(async () => {
    const uids = await Promise.all(
      Array.from({ length: 5 })
        .map(async () => {
          const { body: { uid } }: { body: UserInfoType } = await superAgent.post('/api/v1/users')
            .use(authorizeTestRequest)
            .send({
              nickname: 'my nickname ' + crypto.randomInt(10000),
            } as UserType)
            .expect(200);

          return uid;
        }),
    );

    await superAgent.post(`/api/v1/users/${uids[0]}/points`)
      .use(authorizeTestRequest)
      .send({
        type: 'deposit',
        amount: 100,
        reason: 'admin',
      } as PointType)
      .expect(200);

    preUids.push(...uids);
    preUids.sort((a, b) => a.localeCompare(b));
  });

  it('should get multiple user info', async () => {
    const order: Static<typeof orderUserParam> = {
      uid: 'DESC',
    };
    const { body }: { body: UserInfoType[] } = await superAgent.get('/api/v1/users')
      .use(authorizeTestRequest)
      .query({
        searchOption: 'cursor',
        order: JSON.stringify(order),
        cursor: preUids[0],
      } as FindManyOptionType)
      .expect(200);

    expect(body.map(user => user.uid)).toEqual([...preUids].reverse());
  });

  it('should get singular user info', async () => {
    const { body }: { body: UserInfoType } = await superAgent.get('/api/v1/users/' + preUids[0])
      .use(authorizeTestRequest)
      .expect(200);

    expect(body.uid).toStrictEqual(preUids[0]);
  });

  describe('point log', () => {
    it('should get multiple point logs', async () => {
      const point: PointType = {
        type: 'withdraw',
        amount: 1,
        reason: 'admin',
      };
      await superAgent.post(`/api/v1/users/${preUids[0]}/points`)
        .use(authorizeTestRequest)
        .send(point)
        .expect(200);

      const order: Static<typeof orderPointParam> = {
        createdAtRaw: 'DESC',
      };
      const { body }: { body: PointLogType[] } = await superAgent.get(`/api/v1/users/${preUids[0]}/points`)
        .use(authorizeTestRequest)
        .query({
          order: JSON.stringify(order),
        })
        .expect(200);

      expect(body.map(log => log.type)).toStrictEqual(['withdraw', 'deposit']);
    });

    it('should get multiple withdraw point logs', async () => {
      await superAgent.post(`/api/v1/users/${preUids[1]}/points`)
        .use(authorizeTestRequest)
        .send({
          type: 'deposit',
          amount: 100,
          reason: 'admin',
        } as PointType)
        .expect(200);

      const point: PointType = {
        type: 'withdraw',
        amount: 50,
        reason: 'admin',
      };
      await superAgent.post(`/api/v1/users/${preUids[1]}/points`)
        .use(authorizeTestRequest)
        .send(point)
        .expect(200);

      const { body }: { body: PointLogType[] } = await superAgent.get(`/api/v1/users/${preUids[1]}/points`)
        .use(authorizeTestRequest)
        .query({
          pointType: 'withdraw',
        } as PointExtraOptions)
        .expect(200);
      expect(body).toHaveLength(1);

      const log = body[0];
      expect(log.type).toStrictEqual(point.type);
      expect(log.amount).toStrictEqual(point.amount);
    });
  });
});
