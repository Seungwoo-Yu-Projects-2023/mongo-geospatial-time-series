import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import {
  createDeviceInfo, createDeviceLog,
  getMultipleDeviceInfo, getMultipleDeviceLogs, getSingularDeviceInfo, orderDeviceParam, orderLogParam,
  removeDeviceInfo,
  updateDeviceInfo,
} from '@mongo/geospatial-time-series/apps/devices/schema';
import {
  CreateDevice, GetSingularDevice,
  GetMultipleDevices,
  RemoveDevice,
  UpdateDevice, GetMultipleDeviceLogs, CreateDeviceLog,
} from '@mongo/geospatial-time-series/apps/devices/requests';
import { DeviceInfoCommandRepo } from '@mongo/geospatial-time-series/infra/repos/commands/device-info';
import { DeviceInfo } from '@mongo/geospatial-time-series/infra/models/device-info';
import { DeviceInfo as DeviceInfoEntity } from '@mongo/geospatial-time-series/domains/entities/device-info';
import { DeviceInfoQueryRepo } from '@mongo/geospatial-time-series/infra/repos/queries/device-info';
import { DeviceLog } from '@mongo/geospatial-time-series/infra/models/device-log';
import { FastifyReplyWithPayload, FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import { createFindManyOptions } from '@mongo/geospatial-time-series/utils';
import { DeviceLogQueryRepo } from '@mongo/geospatial-time-series/infra/repos/queries/device-log';
import { DeviceLog as DeviceLogEntity } from '@mongo/geospatial-time-series/domains/entities/device-log';
import { DeviceLogCommandRepo } from '@mongo/geospatial-time-series/infra/repos/commands/device-log';
import { startSession } from 'mongoose';

async function createDevice(
  request: FastifyRequest<CreateDevice>,
  reply: FastifyReplyWithPayload<CreateDevice>,
) {
  const repo = new DeviceInfoCommandRepo(DeviceInfo);

  const result = await repo.insert({
    name: request.body.name,
    macAddress: request.body.macAddress,
  });

  reply.code(200).send(result.toJSON());
}

async function createLog(request: FastifyRequest<CreateDeviceLog>, reply: FastifyReply) {
  const session = await startSession();
  try {
    await session.withTransaction(async () => {
      const logRepo = new DeviceLogCommandRepo(DeviceLog, DeviceInfo, session);
      const log = await logRepo.insert({
        deviceUid: request.params.uid,
        state: request.body.state,
      });

      reply.code(200).send(log.toJSON());
    });
    await session.endSession();
  } catch (e) {
    await session.endSession();

    if (e instanceof Error) {
      if (e.message === 'uid not found in device info') {
        reply.code(404).send();
        return;
      }
    }

    throw e;
  }

}

async function updateDevice(request: FastifyRequest<UpdateDevice>, reply: FastifyReply) {
  const repo = new DeviceInfoCommandRepo(DeviceInfo);

  await repo.update({
    uid: request.params.uid,
    name: request.body.name,
  });

  reply.code(200).send();
}

async function deleteDevice(request: FastifyRequest<RemoveDevice>, reply: FastifyReply) {
  const repo = new DeviceInfoCommandRepo(DeviceInfo);

  await repo.remove(request.params.uid);

  reply.code(200).send();
}

async function getMultipleDevices(
  request: FastifyRequest<GetMultipleDevices>,
  reply: FastifyReplyWithPayload<GetMultipleDevices>,
) {
  const repo = new DeviceInfoQueryRepo(DeviceInfo, DeviceLog);
  const options: FindManyOptions<Omit<OmitFuncs<DeviceInfoEntity>, 'recentLogs'>, string> = createFindManyOptions(
    request.query,
    orderDeviceParam,
  );

  const results = await repo.findMany(options);

  reply.code(200).send(results.map(result => result.toJSON()));
}

async function getSingularDevice(
  request: FastifyRequest<GetSingularDevice>,
  reply: FastifyReplyWithPayload<GetSingularDevice>,
) {
  const repo = new DeviceInfoQueryRepo(DeviceInfo, DeviceLog);
  const result = await repo.findOne(request.params.uid);
  if (result == null) {
    reply.code(404).send();
    return;
  }

  reply.code(200).send(result.toJSON());
}

async function getMultipleLogs(
  request: FastifyRequest<GetMultipleDeviceLogs>,
  reply: FastifyReplyWithPayload<GetMultipleDeviceLogs>,
) {
  const repo = new DeviceLogQueryRepo(DeviceLog);
  const options: FindManyOptions<Omit<OmitFuncs<DeviceLogEntity>, 'uid' | 'deviceUid'>, string> = createFindManyOptions(
    request.query,
    orderLogParam,
  );

  const results = await repo.findMany(request.params.uid, options);

  reply.code(200).send(results.map(result => result.toJSON()));
}

export function deviceRoutes(instance: FastifyInstance, _: FastifyPluginOptions, done: (err?: Error) => void) {
  instance.post('/', { schema: createDeviceInfo }, createDevice);
  instance.post('/:uid/logs', { schema: createDeviceLog }, createLog);
  instance.patch('/:uid', { schema: updateDeviceInfo }, updateDevice);
  instance.delete('/:uid', { schema: removeDeviceInfo }, deleteDevice);

  instance.get('/', { schema: getMultipleDeviceInfo }, getMultipleDevices);
  instance.get('/:uid', { schema: getSingularDeviceInfo }, getSingularDevice);
  instance.get('/:uid/logs', { schema: getMultipleDeviceLogs }, getMultipleLogs);

  done();
}

