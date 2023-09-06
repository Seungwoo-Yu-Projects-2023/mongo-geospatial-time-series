import { Document, ObjectId } from 'mongoose';
import {
  FastifyReply,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  RouteGenericInterface,
} from 'fastify';

export type AppendixGetter<
  Member,
  Appendix,
  Exception extends keyof Appendix,
  IdType = unknown,
  TQueryHelpers = NonNullable<unknown>,
> = Document<IdType, TQueryHelpers, Member>
  & Member & { _id: ObjectId }
  & Omit<Appendix, Exception>;

export type MemberOrSelf<T> = T extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
  [key: string | number | symbol]: infer U extends null | undefined ? never : any,
} ? T[keyof T]
  : T;

export type FindManyOptions<T, U> = {
  searchOption?: null,
  amount?: number | 'max',
  order?: { [key in keyof T]?: 'ASC' | 'DESC' },
} | {
  searchOption: 'cursor',
  cursor: U,
  amount?: number | 'max',
  order?: { [key in keyof T]?: 'ASC' | 'DESC' },
};

export type Enum<T extends readonly unknown[]> = T extends readonly (infer U)[] ? U : never;

export type Coordinates = [number, number];
export type Area = [Coordinates, Coordinates];
export type RectPolygon = [[[number, number], [number, number], [number, number], [number, number], [number, number]]];

export type PartialExcept<T, U extends keyof T> = {
  [P in keyof Pick<T, U>]: T[P];
} & {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [P in keyof Exclude<T, U>]?: T[P];
};
export type PickType<T, U extends keyof T> = T[U];
export type FunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
export type OmitFuncs<T> = Omit<T, FunctionPropertyNames<T>>;
export type FastifyReplyWithPayload<T extends RouteGenericInterface> = FastifyReply<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  T
>;
