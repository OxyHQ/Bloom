/**
 * The three value operations every write uses: structural sharing, the paths
 * that changed, and the merge of a partial record.
 *
 * Records are plain JSON-shaped data (plain objects, arrays, primitives). A
 * record is never mutated: a write builds a new value and shares every part
 * that did not change with the old one, so an unchanged part keeps its
 * identity and `Object.is` is a complete equality test on it.
 */

export type Plain = Record<string, unknown>;

/** A partial record for `merge`: plain objects merge key by key, anything else replaces. */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export function isPlainObject(value: unknown): value is Plain {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * `next`, with every part that is deep-equal to the same part of `prev`
 * replaced by `prev`'s. Returns `prev` itself when the two are deep-equal.
 */
export function share<T>(prev: unknown, next: T): T {
  if (Object.is(prev, next)) return prev as T;
  if (Array.isArray(prev) && Array.isArray(next)) {
    let equal = prev.length === next.length;
    const out: unknown[] = new Array(next.length);
    for (let i = 0; i < next.length; i++) {
      const value = share(prev[i], next[i]);
      out[i] = value;
      if (!Object.is(value, prev[i])) equal = false;
    }
    return (equal ? prev : out) as T;
  }
  if (isPlainObject(prev) && isPlainObject(next)) {
    const keys = Object.keys(next);
    let equal = keys.length === Object.keys(prev).length;
    const out: Plain = {};
    for (const key of keys) {
      const value = share(prev[key], next[key]);
      out[key] = value;
      if (!Object.is(value, prev[key]) || !(key in prev)) equal = false;
    }
    return (equal ? prev : out) as T;
  }
  return next;
}

/** The separator of a two-level path (`engagement.likes`). */
export const PATH_SEPARATOR = '.';

/** The path of a key's presence as a plain object (read by code that only tests it). */
export const PRESENCE = '?';
/** The path of a level's key set (read by code that enumerates it). */
export const KEYS = '#keys';

/**
 * Pushes onto `out` every path, one or two levels deep, whose value differs
 * between `prev` and `next`. Both must already be shared (`share`), so
 * identity is equality. Besides the paths themselves it reports `key?` when a
 * key starts or stops holding a plain object, and `#keys` (or `key.#keys`)
 * when a level gains or loses a key. A plain object that appears or
 * disappears reports each of its second-level keys too, so a reader of
 * `engagement.likes` hears `engagement` arriving.
 */
export function changedPaths(
  prev: Plain | undefined,
  next: Plain | undefined,
  out: string[],
): void {
  if (prev === next) return;
  const before = prev ?? {};
  const after = next ?? {};
  let keysChanged = false;
  for (const key of union(before, after)) {
    const a = before[key];
    const b = after[key];
    const presence = key in before !== key in after;
    if (presence) keysChanged = true;
    if (Object.is(a, b) && !presence) continue;
    out.push(key);
    const objectA = isPlainObject(a) ? a : undefined;
    const objectB = isPlainObject(b) ? b : undefined;
    if (!objectA !== !objectB) out.push(key + PRESENCE);
    if (!objectA && !objectB) continue;
    const innerBefore = objectA ?? {};
    const innerAfter = objectB ?? {};
    let innerKeysChanged = false;
    for (const innerKey of union(innerBefore, innerAfter)) {
      const innerPresence = innerKey in innerBefore !== innerKey in innerAfter;
      if (innerPresence) innerKeysChanged = true;
      if (!Object.is(innerBefore[innerKey], innerAfter[innerKey]) || innerPresence) {
        out.push(key + PATH_SEPARATOR + innerKey);
      }
    }
    if (innerKeysChanged) out.push(key + PATH_SEPARATOR + KEYS);
  }
  if (keysChanged) out.push(KEYS);
}

function union(a: Plain, b: Plain): Set<string> {
  const keys = new Set(Object.keys(a));
  for (const key of Object.keys(b)) keys.add(key);
  return keys;
}

/**
 * `base` with `partial` merged in: plain objects merge key by key, at any
 * depth; arrays and primitives replace; an `undefined` value leaves the key
 * as it was. The result is shared with `base`.
 */
export function merge<T>(base: T, partial: DeepPartial<T> | Plain): T {
  return share(base, mergeValue(base, partial)) as T;
}

function mergeValue(base: unknown, partial: unknown): unknown {
  if (!isPlainObject(partial) || !isPlainObject(base)) return partial;
  const out: Plain = { ...base };
  for (const key of Object.keys(partial)) {
    const value = partial[key];
    if (value === undefined) continue;
    out[key] = mergeValue(base[key], value);
  }
  return out;
}
