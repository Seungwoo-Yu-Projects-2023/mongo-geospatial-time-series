import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import {
  createPedometerLog,
  getSingularDailyLog,
  getPedometerTotalLog, getSingularPeriodicLog,
} from '@mongo/geospatial-time-series/apps/pedometers/schema';
import {
  CreatePedometer,
  GetDaily,
  GetPeriodic,
  GetTotal,
} from '@mongo/geospatial-time-series/apps/pedometers/requests';
import { PedometerLogCommandRepo } from '@mongo/geospatial-time-series/infra/repos/commands/pedometer-log';
import { PedometerLog } from '@mongo/geospatial-time-series/infra/models/pedometer-log';
import { PedometerPeriodic } from '@mongo/geospatial-time-series/infra/models/pedometer-periodic';
import { PedometerDaily } from '@mongo/geospatial-time-series/infra/models/pedometer-daily';
import { PedometerTotal } from '@mongo/geospatial-time-series/infra/models/pedometer-total';
import { startSession } from 'mongoose';
import { UserInfoQueryRepo } from '@mongo/geospatial-time-series/infra/repos/queries/user-info';
import { UserInfo } from '@mongo/geospatial-time-series/infra/models/user-info';
import { PointLog } from '@mongo/geospatial-time-series/infra/models/point-log';
import { PedometerLogQueryRepo } from '@mongo/geospatial-time-series/infra/repos/queries/pedometer-log';
import { DateTime } from 'luxon';

async function createLog(request: FastifyRequest<CreatePedometer>, reply: FastifyReply) {
  const userRepo = new UserInfoQueryRepo(UserInfo, PointLog);
  if (!(await userRepo.exists(request.params.userUid))) {
    reply.code(404).send();
    return;
  }

  const session = await startSession();
  try {
    await session.withTransaction(async () => {
      const repo = new PedometerLogCommandRepo(
        PedometerLog,
        PedometerDaily,
        PedometerPeriodic,
        PedometerTotal,
        session,
      );
      const log = await repo.insert({
        ...request.body,
        createdAtRaw: DateTime.fromISO(request.body.createdAtRaw, { zone: 'UTC' }).toJSDate(),
        userUid: request.params.userUid,
      });

      reply.code(200).send(log.toJSON());
    });
    await session.endSession();
  } catch (e) {
    await session.endSession();

    throw e;
  }
}

async function getTotalLog(request: FastifyRequest<GetTotal>, reply: FastifyReply) {
  const repo = new PedometerLogQueryRepo(
    PedometerDaily,
    PedometerPeriodic,
    PedometerTotal,
  );

  reply.code(200).send((await repo.findTotal(request.params.userUid)).toJSON());
}

async function getDailyLog(request: FastifyRequest<GetDaily>, reply: FastifyReply) {
  const repo = new PedometerLogQueryRepo(
    PedometerDaily,
    PedometerPeriodic,
    PedometerTotal,
  );

  const result = await repo.findInDay(
    DateTime.fromISO(request.query.createdAtRaw, { zone: 'UTC' }),
    request.params.userUid,
  );
  if (result == null) {
    reply.code(404).send();
    return;
  }

  reply.code(200).send(result.toJSON());
}

async function getPeriodicLog(request: FastifyRequest<GetPeriodic>, reply: FastifyReply) {
  const repo = new PedometerLogQueryRepo(
    PedometerDaily,
    PedometerPeriodic,
    PedometerTotal,
  );

  const result = await repo.findBetween(
    DateTime.fromISO(request.query.start, { zone: 'UTC' }),
    DateTime.fromISO(request.query.end, { zone: 'UTC' }),
    request.params.userUid,
  );

  if (result == null) {
    reply.code(404).send();
    return;
  }

  reply.code(200).send(result.toJSON());
}

export function pedometerRoutes(instance: FastifyInstance, _: FastifyPluginOptions, done: (err?: Error) => void) {
  instance.post('/:userUid', { schema: createPedometerLog }, createLog);

  instance.get('/:userUid/total', { schema: getPedometerTotalLog }, getTotalLog);
  instance.get('/:userUid/daily', { schema: getSingularDailyLog }, getDailyLog);
  instance.get('/:userUid/periodic', { schema: getSingularPeriodicLog }, getPeriodicLog);

  done();
}
