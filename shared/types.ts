/**
 * shared/types — pure cross-cutting primitives.
 * No product names, no site knowledge, no business rules.
 */

export type ISODateTime = string;
export type OpaqueId = string;
export type OpaqueToken = string;

export interface Result<T, E = string> {
  ok: true;
  value: T;
}

export interface Failure<E = string> {
  ok: false;
  error: E;
}

export type Outcome<T, E = string> = Result<T, E> | Failure<E>;

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<E = string>(error: E): Failure<E> {
  return { ok: false, error };
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}
