import { Static, Type } from '@sinclair/typebox';
import { FastifySchema } from 'fastify';

const Pedometer = Type.Object({
  count: Type.Number({
    minimum: 0,
  }),
  createdAtRaw: Type.RegExp(
    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d{3})?([+-][0-2]\d:?[0-5]\d|Z)/,
    {
      examples: [
        '2023-08-07T05:12:46Z',
        '2023-08-07T05:12:46+0000',
        '2023-08-07T05:12:46+00:00',
        '2023-08-07T05:12:46.000Z',
        '2023-08-07T05:12:46.000+0000',
        '2023-08-07T05:12:46.000+00:00',
      ],
    },
  ),
});

export type PedometerType = Static<typeof Pedometer>;

const ParamUserUid = Type.Object({
  userUid: Type.String({
    minLength: 24,
    maxLength: 24,
  }),
});

export type ParamUserUidType = Static<typeof ParamUserUid>;

export const createPedometerLog: FastifySchema = {
  tags: ['pedometers'],
  body: Pedometer,
  params: ParamUserUid,
  response: {
    200: Type.Null(),
    404: Type.Null(),
  },
};

const PedometerTotal = Type.Object({
  userUid: Type.String(),
  count: Type.Number(),
});

export type PedometerTotalType = Static<typeof PedometerTotal>;

export const getPedometerTotalLog: FastifySchema = {
  tags: ['pedometers'],
  params: ParamUserUid,
  response: {
    200: PedometerTotal,
    404: Type.Null(),
  },
};

const PedometerDaily = Type.Object({
  userUid: Type.String(),
  count: Type.Number(),
  logUids: Type.Array(Type.String()),
  baseCreatedAtRaw: Type.String(),
});

export type PedometerDailyType = Static<typeof PedometerDaily>;

const PedometerDailyInput = Type.Object({
  createdAtRaw: Type.RegExp(
    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d{3})?([+-][0-2]\d:?[0-5]\d|Z)/,
    {
      examples: [
        '2023-08-07T05:12:46Z',
        '2023-08-07T05:12:46+0000',
        '2023-08-07T05:12:46+00:00',
        '2023-08-07T05:12:46.000Z',
        '2023-08-07T05:12:46.000+0000',
        '2023-08-07T05:12:46.000+00:00',
      ],
    },
  ),
});

export type PedometerDailyInputType = Static<typeof PedometerDailyInput>;

export const getSingularDailyLog: FastifySchema = {
  tags: ['pedometers'],
  querystring: PedometerDailyInput,
  params: ParamUserUid,
  response: {
    200: PedometerDaily,
    404: Type.Null(),
  },
};

const ParamLogUid = Type.Object({
  logUid: Type.String({
    minLength: 24,
    maxLength: 24,
  }),
});

export type ParamLogUidType = Static<typeof ParamLogUid>;

const PedometerPeriodic = Type.Object({
  userUid: Type.String(),
  dailyList: Type.Array(PedometerDaily),
  totalCount: Type.Number(),
  start: Type.String(),
  end: Type.String(),
});

export type PedometerPeriodicType = Static<typeof PedometerPeriodic>;

const PedometerPeriodicInput = Type.Object({
  start: Type.RegExp(
    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d{3})?([+-][0-2]\d:?[0-5]\d|Z)/,
    {
      examples: [
        '2023-08-07T05:12:46Z',
        '2023-08-07T05:12:46+0000',
        '2023-08-07T05:12:46+00:00',
        '2023-08-07T05:12:46.000Z',
        '2023-08-07T05:12:46.000+0000',
        '2023-08-07T05:12:46.000+00:00',
      ],
    },
  ),
  end: Type.RegExp(
    /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d{3})?([+-][0-2]\d:?[0-5]\d|Z)/,
    {
      examples: [
        '2023-08-07T05:12:46Z',
        '2023-08-07T05:12:46+0000',
        '2023-08-07T05:12:46+00:00',
        '2023-08-07T05:12:46.000Z',
        '2023-08-07T05:12:46.000+0000',
        '2023-08-07T05:12:46.000+00:00',
      ],
    },
  ),
});

export type PedometerPeriodicInputType = Static<typeof PedometerPeriodicInput>;

export const getSingularPeriodicLog: FastifySchema = {
  tags: ['pedometers'],
  querystring: PedometerPeriodicInput,
  params: ParamUserUid,
  response: {
    200: PedometerPeriodic,
    404: Type.Null(),
  },
};

const PedometerLog = Type.Object({
  count: Type.Number(),
  createdAtRaw: Type.String(),
});

export type PedometerLogType = Static<typeof PedometerLog>;
