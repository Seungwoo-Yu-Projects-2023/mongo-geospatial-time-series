import { authorizeTestRequest, superAgent } from '@mongo/geospatial-time-series/global.mocks';
import { DeviceInfoType, DeviceType } from '@mongo/geospatial-time-series/apps/devices/schema';
import {
  FindManyOptionType,
  StoreInfoType,
  StoreType,
  StoreUpdateType,
} from '@mongo/geospatial-time-series/apps/stores/schema';

describe('store command api tests', () => {
  it('should create store info', async () => {
    const { body: { uid: deviceUid } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:90:15',
        name: 'store device 1',
      } as DeviceType)
      .expect(200);
    expect(deviceUid).not.toBeUndefined();

    const store: StoreType = {
      name: 'store name 1',
      description: 'store description 1',
      deviceUid,
      location: [0, 0],
    };

    const { body }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send(store)
      .expect(200);

    expect(body.name).toStrictEqual(store.name);
    expect(body.description).toStrictEqual(store.description);
    expect(body.deviceUid).toStrictEqual(store.deviceUid);
    expect(body.location).toEqual(store.location);
  });

  it('should update user info', async () => {
    const { body: { uid: deviceUid } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:90:16',
        name: 'store device 2',
      } as DeviceType)
      .expect(200);
    expect(deviceUid).not.toBeUndefined();

    const { body: body1 }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'store name 2',
        description: 'store description 2',
        deviceUid,
        location: [1, 1],
      } as StoreType)
      .expect(200);
    const changed: StoreUpdateType = {
      name: 'changed name 2',
      description: 'changed desc 2',
      location: [11, 11],
    };

    await superAgent.patch(`/api/v1/stores/${body1.uid}`)
      .use(authorizeTestRequest)
      .send(changed)
      .expect(200);

    const { body: body2 }: { body: StoreInfoType } = await superAgent.get(`/api/v1/stores/${body1.uid}`)
      .use(authorizeTestRequest)
      .expect(200);

    expect(body2.uid).toStrictEqual(body1.uid);
    expect(body2.name).not.toStrictEqual(body1.name);
    expect(body2.description).not.toStrictEqual(body1.description);
    expect(body2.location).not.toEqual(body1.location);
    expect(body2.name).toStrictEqual(changed.name);
    expect(body2.description).toStrictEqual(changed.description);
    expect(body2.location).toEqual(changed.location);
  });

  it('should delete user info', async () => {
    const { body: { uid: deviceUid } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:90:17',
        name: 'store device 3',
      } as DeviceType)
      .expect(200);
    expect(deviceUid).not.toBeUndefined();

    const { body: { uid } }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'store name 3',
        description: 'store description 3',
        deviceUid,
        location: [2, 2],
      } as StoreType)
      .expect(200);

    await superAgent.delete('/api/v1/stores/' + uid).use(authorizeTestRequest).expect(200);
    await superAgent.get('/api/v1/stores/' + uid).use(authorizeTestRequest).expect(404);
  });
});

describe('store query api tests', () => {
  const canadianStores: string[] = [];
  const americanStores: string[] = [];
  const koreanStores: string[] = [];

  beforeAll(async () => {
    const { body: { uid: deviceUidCAN1 } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:91:01',
        name: 'Yellowknife',
      } as DeviceType)
      .expect(200);
    expect(deviceUidCAN1).not.toBeUndefined();

    const { body: { uid: storeUidCAN1 } }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'canadian store 1',
        description: 'store in Yellowknife, Canada',
        deviceUid: deviceUidCAN1,
        location: [-114.371788, 62.453972],
      } as StoreType)
      .expect(200);
    expect(storeUidCAN1).not.toBeUndefined();
    canadianStores.push(storeUidCAN1);

    const { body: { uid: deviceUidCAN2 } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:91:02',
        name: 'Quebec',
      } as DeviceType)
      .expect(200);
    expect(deviceUidCAN2).not.toBeUndefined();

    const { body: { uid: storeUidCAN2 } }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'canadian store 2',
        description: 'store in Quebec, Canada',
        deviceUid: deviceUidCAN2,
        location: [-71.254028, 46.829853],
      } as StoreType)
      .expect(200);
    expect(storeUidCAN2).not.toBeUndefined();
    canadianStores.push(storeUidCAN2);

    const { body: { uid: deviceUidUSA1 } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:91:03',
        name: 'Alaska',
      } as DeviceType)
      .expect(200);
    expect(deviceUidUSA1).not.toBeUndefined();

    const { body: { uid: storeUidUSA1 } }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'american store 1',
        description: 'store in Alaska, USA',
        deviceUid: deviceUidUSA1,
        location: [-153.369141, 66.160507],
      } as StoreType)
      .expect(200);
    expect(storeUidUSA1).not.toBeUndefined();
    americanStores.push(storeUidUSA1);

    const { body: { uid: deviceUidUSA2 } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:91:04',
        name: 'Florida',
      } as DeviceType)
      .expect(200);
    expect(deviceUidUSA2).not.toBeUndefined();

    const { body: { uid: storeUidUSA2 } }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'american store 1',
        description: 'store in Florida, USA',
        deviceUid: deviceUidUSA2,
        location: [-81.760254, 27.994402],
      } as StoreType)
      .expect(200);
    expect(storeUidUSA2).not.toBeUndefined();
    americanStores.push(storeUidUSA2);

    const { body: { uid: deviceUidKOR1 } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:91:05',
        name: 'Seoul',
      } as DeviceType)
      .expect(200);
    expect(deviceUidKOR1).not.toBeUndefined();

    const { body: { uid: storeUidKOR1 } }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'korean store 1',
        description: 'store in Seoul, South Korea',
        deviceUid: deviceUidKOR1,
        location: [127.024612, 37.532600],
      } as StoreType)
      .expect(200);
    expect(storeUidKOR1).not.toBeUndefined();
    koreanStores.push(storeUidKOR1);

    const { body: { uid: deviceUidKOR2 } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:91:06',
        name: 'Busan',
      } as DeviceType)
      .expect(200);
    expect(deviceUidKOR2).not.toBeUndefined();

    const { body: { uid: storeUidKOR2 } }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'korean store 2',
        description: 'store in Busan, South Korea',
        deviceUid: deviceUidKOR2,
        location: [129.066666, 35.166668],
      } as StoreType)
      .expect(200);
    expect(storeUidKOR2).not.toBeUndefined();
    koreanStores.push(storeUidKOR2);

    const { body: { uid: deviceUidKOR3 } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:91:07',
        name: 'Daegu',
      } as DeviceType)
      .expect(200);
    expect(deviceUidKOR3).not.toBeUndefined();

    const { body: { uid: storeUidKOR3 } }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'korean store 3',
        description: 'store in Daegu, South Korea',
        deviceUid: deviceUidKOR3,
        location: [128.600006, 35.866669],
      } as StoreType)
      .expect(200);
    expect(storeUidKOR3).not.toBeUndefined();
    koreanStores.push(storeUidKOR3);
  });

  it('should get multiple store info in South Korea using coordinates', async () => {
    const coordinates = [128.011051, 36.659753];
    const radiusInMeters = 355 * 1000;

    const { body }: { body: StoreInfoType[] } = await superAgent.get('/api/v1/stores')
      .use(authorizeTestRequest)
      .query({
        searchOption: 'coordinates',
        coordinates: JSON.stringify(coordinates),
        minDistance: 0,
        maxDistance: radiusInMeters,
      } as FindManyOptionType)
      .expect(200);

    expect(body.map(store => store.uid)).toContainValues(koreanStores);
  });

  it('should get multiple store info across north america using area', async () => {
    const area: [number, number][] = [
      [-166.977894, 75.756411],
      [-52.708586, 15.509916],
    ];

    const { body }: { body: StoreInfoType[] } = await superAgent.get('/api/v1/stores')
      .use(authorizeTestRequest)
      .query({
        searchOption: 'area',
        area: JSON.stringify(area),
      } as FindManyOptionType)
      .expect(200);

    expect(body.map(store => store.uid))
      .toContainValues([...canadianStores, ...americanStores]);
  });

  it('should get singular store info', async () => {
    const { body: { uid: deviceUid } }: { body: DeviceInfoType } = await superAgent.post('/api/v1/devices')
      .use(authorizeTestRequest)
      .send({
        macAddress: '12:34:56:78:90:18',
        name: 'store device 4',
      } as DeviceType)
      .expect(200);
    expect(deviceUid).not.toBeUndefined();

    const { body: body1 }: { body: StoreInfoType } = await superAgent.post('/api/v1/stores')
      .use(authorizeTestRequest)
      .send({
        name: 'store name 4',
        description: 'store description 4',
        deviceUid,
        location: [3, 3],
      } as StoreType)
      .expect(200);

    const { body: body2 }: { body: StoreInfoType } = await superAgent.get(`/api/v1/stores/${body1.uid}`)
      .use(authorizeTestRequest)
      .expect(200);

    expect(body2.uid).toStrictEqual(body1.uid);
    expect(body2.name).toStrictEqual(body1.name);
    expect(body2.description).toStrictEqual(body1.description);
    expect(body2.location).toEqual(body1.location);
  });
});
