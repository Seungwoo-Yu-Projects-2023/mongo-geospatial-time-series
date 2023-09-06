import { FastifySchema } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import {
  createAmountParam,
  createFindManyTypeBoxOptions,
  createOrderParam,
  createSizedOrExpendableParam,
  createTypeBoxUnion,
} from '@mongo/geospatial-time-series/utils';
import {
  MAX_SEARCH_LENGTH_POINT_LOG,
  PointDepositReason,
  PointLogType,
  PointWithdrawReason,
} from '@mongo/geospatial-time-series/domains/entities/point-log';
import { Enum } from '@mongo/geospatial-time-series/types';
import { MAX_SEARCH_LENGTH_USER_INFO } from '@mongo/geospatial-time-series/domains/entities/user-info';

const User = Type.Object({
  nickname: Type.String({
    examples: ['user nickname'],
    minLength: 1,
    maxLength: 20,
  }),
});

export type UserType = Static<typeof User>;

const PointLog = Type.Union([
  Type.Object({
    uid: Type.String(),
    type: Type.Literal<Enum<typeof PointLogType>>('deposit'),
    amount: Type.Number(),
    reason: createTypeBoxUnion(PointDepositReason),
    createdAtRaw: Type.String(),
  }),
  Type.Object({
    uid: Type.String(),
    type: Type.Literal<Enum<typeof PointLogType>>('withdraw'),
    amount: Type.Number(),
    reason: createTypeBoxUnion(PointWithdrawReason),
    createdAtRaw: Type.String(),
  }),
]);

export type PointLogType = Static<typeof PointLog>;

const UserInfo = Type.Object({
  uid: Type.String(),
  nickname: Type.String(),
  pointLogs: createSizedOrExpendableParam(PointLog, Type.String()),
  pointBalance: Type.Number(),
  createdAtRaw: Type.String(),
});

export type UserInfoType = Static<typeof UserInfo>;

export const createUserInfo: FastifySchema = {
  tags: ['users'],
  body: User,
  response: {
    200: UserInfo,
  },
};

const ParamUid = Type.Object({
  uid: Type.String({
    minLength: 24,
    maxLength: 24,
  }),
});

export type ParamUidType = Static<typeof ParamUid>;

const Point = Type.Union([
  Type.Object({
    type: Type.Literal<Enum<typeof PointLogType>>('deposit'),
    amount: Type.Number({
      minimum: 1,
    }),
    reason: createTypeBoxUnion(PointDepositReason),
  }),
  Type.Object({
    type: Type.Literal<Enum<typeof PointLogType>>('withdraw'),
    amount: Type.Number({
      minimum: 1,
    }),
    reason: createTypeBoxUnion(PointWithdrawReason),
  }),
]);

export type PointType = Static<typeof Point>;

export const createPointLog: FastifySchema = {
  tags: ['users'],
  body: Point,
  params: ParamUid,
  response: {
    200: Type.Null(),
  },
};

const UserUpdate = User;

export type UserUpdateType = Static<typeof UserUpdate>;

export const updateUserInfo: FastifySchema = {
  tags: ['users'],
  params: ParamUid,
  body: UserUpdate,
  response: {
    200: Type.Null(),
  },
};

export const removeUserInfo: FastifySchema = {
  tags: ['users'],
  params: ParamUid,
  response: {
    200: Type.Null(),
  },
};

export const orderPointParam = createOrderParam(
  Type.Pick(PointLog.anyOf[0], ['createdAtRaw']).properties,
);

export const orderUserParam = createOrderParam(
  Type.Omit(UserInfo, ['pointLogs']).properties,
);

const FindManyOptions = createFindManyTypeBoxOptions(
  Type.String({
    minLength: 24,
    maxLength: 24,
  }),
  createAmountParam(MAX_SEARCH_LENGTH_USER_INFO),
);

export type FindManyOptionType = Static<typeof FindManyOptions>;

export const getMultipleUserInfo: FastifySchema = {
  tags: ['users'],
  querystring: FindManyOptions,
  response: {
    200: Type.Array(UserInfo),
  },
};

export const getSingularUserInfo: FastifySchema = {
  tags: ['users'],
  params: ParamUid,
  response: {
    200: UserInfo,
    404: Type.Null(),
  },
};

const findManyPointAmountParam = createAmountParam(MAX_SEARCH_LENGTH_POINT_LOG);
const FindManyPointOptions = Type.Intersect([
  Type.Union([
    Type.Object({
      searchOption: Type.Literal('cursor'),
      cursor: Type.String({
        minLength: 24,
        maxLength: 24,
      }),
      amount: findManyPointAmountParam,
      order: Type.Optional(Type.String()), // JSON Object
    }),
    Type.Object({
      searchOption: Type.Optional(Type.Null()),
      amount: findManyPointAmountParam,
      order: Type.Optional(Type.String()), // JSON Object
    }),
  ]),
  Type.Union([
    Type.Object({
      pointType: Type.Literal('deposit'),
      reason: Type.Optional(createTypeBoxUnion(PointDepositReason)),
    }),
    Type.Object({
      pointType: Type.Literal('withdraw'),
      reason: Type.Optional(createTypeBoxUnion(PointWithdrawReason)),
    }),
    Type.Object({
      pointType: Type.Optional(Type.Null()),
      reason: Type.Optional(Type.Never()),
    }),
  ]),
]);

export type FindManyPointOptionType = Static<typeof FindManyPointOptions>;

export const getMultiplePointLogs: FastifySchema = {
  tags: ['users'],
  querystring: FindManyPointOptions,
  params: ParamUid,
  response: {
    200: Type.Array(PointLog),
  },
};
