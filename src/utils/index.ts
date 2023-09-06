import { MemberOrSelf } from '@mongo/geospatial-time-series/types';
import { Static, TObject, TSchema, Type } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

export type SizedOrExpendable<T, U extends MemberOrSelf<T>> = Sized<T> | Expendable<T, U>;

// noinspection JSUnusedGlobalSymbols
export class Sized<T> {
  public readonly expendable = false;
  constructor(
    public readonly array: T[],
  ) {}
}

// noinspection JSUnusedGlobalSymbols
export class Expendable<T, U extends MemberOrSelf<T>> {
  public readonly expendable = true;

  constructor(
    public readonly array: T[],
    public readonly next: U,
  ) {}
}

export function mongoOrder<T extends string | number | symbol>(
  order: { [key in T]?: 'ASC' | 'DESC' },
) {
  const entries = Object.entries(order) as [T, string | undefined][];
  return Object.fromEntries(
    entries
      .filter(([_, value]) => value != null)
      .map(([key, value]) => {
        return [key === 'uid' ? '_id' : key, value!.toLowerCase()];
      }),
  ) as { [key in Exclude<T, 'uid'> | '_id']?: 'asc' | 'desc' };
}

export function createTypeBoxUnion<T extends string | number | boolean>(union: T[] | readonly T[]) {
  return Type.Union(union.map(value => {
    return Type.Literal(value);
  }));
}

export const coordinatesParam = Type.Tuple([
  Type.Number({
    minimum: -180,
    maximum: 180,
  }),
  Type.Number({
    minimum: -90,
    maximum: 90,
  }),
]);

export const areaParam = Type.Tuple([
  Type.Tuple([
    Type.Number({
      minimum: -180,
      maximum: 180,
    }),
    Type.Number({
      minimum: -90,
      maximum: 90,
    }),
  ]),
  Type.Tuple([
    Type.Number({
      minimum: -180,
      maximum: 180,
    }),
    Type.Number({
      minimum: -90,
      maximum: 90,
    }),
  ]),
]);

export function createAmountParam(max: number = 1000) {
  if (max <= 1) {
    throw new Error('max is more than 1');
  }

  return Type.Optional(Type.Union([
    Type.Number({
      minimum: 1,
      maximum: max,
    }),
    Type.Literal('max'),
  ]));
}

export function createOrderParam<T extends object, U extends keyof T & (string | number)>(obj: T) {
  return Type.Record(
    createTypeBoxUnion(Object.keys(obj) as U[]),
    Type.Optional(createTypeBoxUnion(['ASC', 'DESC'] as const)),
  );
}

export function createFindManyTypeBoxOptions<T extends TSchema, U extends TSchema>(cursorDef: T, amountDef: U) {
  return Type.Union([
    Type.Object({
      searchOption: Type.Literal('cursor'),
      cursor: cursorDef,
      amount: amountDef,
      order: Type.Optional(Type.String()), // JSON Object
    }),
    Type.Object({
      searchOption: Type.Optional(Type.Null()),
      amount: amountDef,
      order: Type.Optional(Type.String()), // JSON Object
    }),
  ]);
}

export function createSizedOrExpendableParam<T extends TSchema, U extends TSchema>(childDef: T, keyDef: U) {
  return Type.Union([
    Type.Object({
      array: Type.Array(childDef),
      expendable: Type.Literal(true),
      next: keyDef,
    }),
    Type.Object({
      array: Type.Array(childDef),
      expendable: Type.Literal(false),
    }),
  ]);
}

export function createFindManyOptions<
  T extends {
    searchOption?: null,
    amount?: number | 'max',
    order?: string,
  } | {
    searchOption: 'cursor',
    cursor: V,
    amount?: number | 'max',
    order?: string,
  },
  U extends TObject,
  V,
>(
  query: T,
  orderDef: U,
) {
  const order: Static<typeof orderDef> | unknown = query.order == null
    ? undefined
    : JSON.parse(query.order);
  const checker = TypeCompiler.Compile(orderDef);
  if (order !== undefined && !checker.Check(order)) {
    throw new Error('order is invalid');
  }

  if (query?.searchOption === 'cursor') {
    return {
      searchOption: query.searchOption,
      cursor: query.cursor,
      amount: query.amount,
      order,
    };
  } else {
    return {
      amount: query.amount,
      order,
    };
  }
}

export interface ToJSON<T extends Static<TSchema>> {
  toJSON(): T,
}
