import { authorizeTestRequest, superAgent } from '@mongo/geospatial-time-series/global.mocks';
import {
  DeviceInfo, DeviceInfoType, DeviceLog, DeviceLogType,
  DeviceType, DeviceUpdateType, FindManyInfoOptionType, MultipleDeviceLogType,
  PartialDeviceLogType,
} from '@mongo/geospatial-time-series/apps/devices/schema';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { DateTime } from 'luxon';
import * as crypto from 'crypto';
import {
  MAX_LENGTH_DEVICE_LOG,
  MAX_SEARCH_LENGTH_DEVICE_INFO,
} from '@mongo/geospatial-time-series/domains/entities/device-info';
import { useFakeTimers } from 'sinon';
import { Type } from '@sinclair/typebox';

describe('device command api tests', () => {
  it('should create device info', async () => {
    await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '11:22:33:44:55:66',
        name: 'command device',
      } as DeviceType)
      .expect(res => {
        const errors = Array.from(TypeCompiler.Compile(DeviceInfo).Errors(res.body));

        expect(errors).toHaveLength(0);
      })
      .expect(200);
  });

  it('should create device log', async () => {
    const { body: { uid: deviceUid } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:90:11',
        name: 'command device 2',
      } as DeviceType)
      .expect(200);
    expect(deviceUid).not.toBeUndefined();

    await superAgent.post(`/api/v1/devices/${deviceUid}/logs`)
      .use(authorizeTestRequest)
      .send({
        state: 'connected',
      } as PartialDeviceLogType)
      .expect(200);
  });

  it('should update device info', async () => {
    const { body: { uid: deviceUid } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:90:12',
        name: 'command device 3',
      } as DeviceType)
      .expect(200);
    expect(deviceUid).not.toBeUndefined();

    const name = 'updated device 3';

    await superAgent.patch('/api/v1/devices/' + deviceUid)
      .use(authorizeTestRequest)
      .send({ name } as DeviceUpdateType)
      .expect(200);

    const deviceInfo: { body: DeviceInfoType } = await superAgent.get('/api/v1/devices/' + deviceUid)
      .use(authorizeTestRequest)
      .expect(200);

    expect(deviceInfo.body.name).toStrictEqual(name);
  });

  it('should delete device info', async () => {
    const { body: { uid: deviceUid } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:90:13',
        name: 'command device 4',
      } as DeviceType)
      .expect(200);
    expect(deviceUid).not.toBeUndefined();

    await superAgent.delete('/api/v1/devices/' + deviceUid)
      .use(authorizeTestRequest)
      .expect(200);

    await superAgent.get('/api/v1/devices/' + deviceUid).use(authorizeTestRequest).expect(404);
  });

  it('should create device log', async () => {
    const { body: { uid: deviceUid } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:90:14',
        name: 'command device 5',
      } as DeviceType)
      .expect(200);
    expect(deviceUid).not.toBeUndefined();

    const res: { body: DeviceLogType } = await superAgent.post(`/api/v1/devices/${deviceUid}/logs`)
      .use(authorizeTestRequest)
      .send({
        state: 'connected',
      } as PartialDeviceLogType)
      .expect(200);

    const errors = Array.from(TypeCompiler.Compile(DeviceLog).Errors(res.body));

    expect(errors).toHaveLength(1);
  });
});

describe('device query api tests', () => {
  const testUids: string[] = [];

  beforeAll(async () => {
    const timer = useFakeTimers();
    let lastDate = DateTime.fromMillis(0);

    for (let i = 0; i < MAX_SEARCH_LENGTH_DEVICE_INFO + 2; i++) {
      lastDate = lastDate.plus({ hour: 1 });
      timer.setSystemTime(lastDate.toJSDate());
      const macAddress = crypto.randomInt(0, 281474976710655)
        .toString(16)
        .padStart(12, '0')
        .replace(/.{2}(?=.{2})/g, '$&:');

      const res: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
        .use(authorizeTestRequest)
        .send({
          macAddress,
          name: 'query device ' + i,
        } as DeviceType)
        .expect(200);

      testUids.push(res.body.uid);
    }

    for (let i = 0; i < MAX_LENGTH_DEVICE_LOG + 2; i++) {
      lastDate = lastDate.plus({ hour: 1 });
      timer.setSystemTime(lastDate.toJSDate());
      await superAgent.post(`/api/v1/devices/${testUids[0]}/logs`)
        .use(authorizeTestRequest)
        .send({
          state: i % 2 === 0 ? 'connected' : 'disconnected',
        } as PartialDeviceLogType)
        .expect(200);
    }

    timer.restore();
  }, 100000);

  it('should get multiple device info', async () => {
    const res: { body: DeviceInfoType[] } = await superAgent.get('/api/v1/devices')
      .use(authorizeTestRequest)
      .query({
        searchOption: 'cursor',
        cursor: testUids[0],
      } as FindManyInfoOptionType)
      .expect(200);
    const errors = Array.from(TypeCompiler.Compile(Type.Array(DeviceInfo)).Errors(res.body));

    expect(errors).toHaveLength(0);
    expect(res.body).toHaveLength(1000);
    expect(testUids).toIncludeAllPartialMembers(res.body.map(info => info.uid));
  });

  it('should get singular device info', async () => {
    const res: { body: DeviceInfoType } = await superAgent.get('/api/v1/devices/' + testUids[0])
      .use(authorizeTestRequest)
      .expect(200);
    const errors = Array.from(TypeCompiler.Compile(DeviceInfo).Errors(res.body));

    expect(errors).toHaveLength(0);
    expect(res.body.uid).toStrictEqual(testUids[0]);
  });

  it('should get multiple device logs', async () => {
    const res: { body: MultipleDeviceLogType } = await superAgent.get(`/api/v1/devices/${testUids[0]}/logs`)
      .use(authorizeTestRequest)
      .send({
        state: 'connected',
      } as PartialDeviceLogType)
      .expect(200);
    const errors = Array.from(TypeCompiler.Compile(Type.Array(DeviceLog)).Errors(res.body));

    expect(errors).toHaveLength(0);
    expect(res.body).toHaveLength(1000);
  });
});
