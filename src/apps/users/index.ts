import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import {
  CreatePoint,
  CreateUser, GetMultiplePoints,
  GetMultipleUsers,
  GetSingularUser,
  RemoveUser,
  UpdateUser,
} from '@mongo/geospatial-time-series/apps/users/requests';
import { UserInfoCommandRepo } from '@mongo/geospatial-time-series/infra/repos/commands/user-info';
import { UserInfo } from '@mongo/geospatial-time-series/infra/models/user-info';
import {
  createPointLog,
  createUserInfo, getMultiplePointLogs,
  getMultipleUserInfo,
  getSingularUserInfo, orderPointParam, orderUserParam,
  removeUserInfo, updateUserInfo,
} from '@mongo/geospatial-time-series/apps/users/schema';
import { UserInfoQueryRepo } from '@mongo/geospatial-time-series/infra/repos/queries/user-info';
import { PointLog } from '@mongo/geospatial-time-series/infra/models/point-log';
import { FastifyReplyWithPayload, FindManyOptions, OmitFuncs } from '@mongo/geospatial-time-series/types';
import { UserInfo as UserInfoEntity } from '@mongo/geospatial-time-series/domains/entities/user-info';
import { createFindManyOptions } from '@mongo/geospatial-time-series/utils';
import { PointLogCommandRepo } from '@mongo/geospatial-time-series/infra/repos/commands/point-log';
import { startSession } from 'mongoose';
import { PointLogQueryRepo } from '@mongo/geospatial-time-series/infra/repos/queries/point-log';
import { PointLog as PointLogEntity } from '@mongo/geospatial-time-series/domains/entities/point-log';
import { Static } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { PointExtraOptions } from '@mongo/geospatial-time-series/domains/repos/queries/point-log';

async function createUser(request: FastifyRequest<CreateUser>, reply: FastifyReplyWithPayload<CreateUser>) {
  const repo = new UserInfoCommandRepo(UserInfo);

  const result = await repo.insert({
    nickname: request.body.nickname,
    pointBalance: 0,
  });

  reply.code(200).send(result.toJSON());
}

async function createPoint(request: FastifyRequest<CreatePoint>, reply: FastifyReply) {
  const userRepo = new UserInfoQueryRepo(UserInfo, PointLog);
  if (!(await userRepo.exists(request.params.uid))) {
    reply.code(404).send();
    return;
  }

  const session = await startSession();
  try {
    await session.withTransaction(async () => {
      const repo = new PointLogCommandRepo(PointLog, UserInfo, session);

      await repo.insert({
        ...request.body,
        userUid: request.params.uid,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'insufficient_points') {
      reply.code(422).send(e);
      return;
    }
  }

  reply.code(200).send();
}

async function updateUser(request: FastifyRequest<UpdateUser>, reply: FastifyReply) {
  const repo = new UserInfoCommandRepo(UserInfo);

  await repo.update({
    uid: request.params.uid,
    nickname: request.body.nickname,
  });

  reply.code(200).send();
}

async function removeUser(request: FastifyRequest<RemoveUser>, reply: FastifyReply) {
  const repo = new UserInfoCommandRepo(UserInfo);

  await repo.remove(request.params.uid);

  reply.code(200).send();
}

async function getMultipleUsers(request: FastifyRequest<GetMultipleUsers>, reply: FastifyReply) {
  const repo = new UserInfoQueryRepo(UserInfo, PointLog);
  const options: FindManyOptions<Omit<OmitFuncs<UserInfoEntity>, 'pointLogs'>, string> = createFindManyOptions(
    request.query,
    orderUserParam,
  );

  const results = await repo.findMany(options);

  reply.code(200).send(results.map(result => result.toJSON()));
}

async function getSingularUser(request: FastifyRequest<GetSingularUser>, reply: FastifyReply) {
  const repo = new UserInfoQueryRepo(UserInfo, PointLog);

  const result = await repo.findOne(request.params.uid);
  if (result == null) {
    reply.code(404).send();
    return;
  }

  reply.code(200).send(result.toJSON());
}

async function getMultiplePoints(request: FastifyRequest<GetMultiplePoints>, reply: FastifyReply) {
  const repo = new PointLogQueryRepo(PointLog);
  const order: Static<typeof orderPointParam> | unknown = request.query.order == null
    ? undefined
    : JSON.parse(request.query.order);
  const checker = TypeCompiler.Compile(orderPointParam);
  if (order !== undefined && !checker.Check(order)) {
    throw new Error('order is invalid');
  }

  let extraOptions: PointExtraOptions = {};
  if (request.query.pointType != null) {
    if (request.query.pointType === 'deposit') {
      extraOptions = {
        pointType: request.query.pointType,
        reason: request.query.reason,
      };
    } else {
      extraOptions = {
        pointType: request.query.pointType,
        reason: request.query.reason,
      };
    }
  }

  const options: FindManyOptions<Pick<PointLogEntity, 'createdAtRaw'>, string> & PointExtraOptions =
    {
      ...request.query.searchOption === 'cursor'
        ? {
          searchOption: request.query.searchOption,
          cursor: request.query.cursor,
          amount: request.query.amount,
          order,
        }
        : {
          searchOption: request.query.searchOption,
          amount: request.query.amount,
          order,
        },
      ...extraOptions,
    };

  const results = await repo.findMany(request.params.uid, options);

  reply.code(200).send(results.map(result => result.toJSON()));
}

export function userRoutes(instance: FastifyInstance, _: FastifyPluginOptions, done: (err?: Error) => void) {
  instance.post('/', { schema: createUserInfo }, createUser);
  instance.post('/:uid/points', { schema: createPointLog }, createPoint);
  instance.patch('/:uid', { schema: updateUserInfo }, updateUser);
  instance.delete('/:uid', { schema: removeUserInfo }, removeUser);

  instance.get('/', { schema: getMultipleUserInfo }, getMultipleUsers);
  instance.get('/:uid', { schema: getSingularUserInfo }, getSingularUser);
  instance.get('/:uid/points', { schema: getMultiplePointLogs }, getMultiplePoints);

  done();
}
