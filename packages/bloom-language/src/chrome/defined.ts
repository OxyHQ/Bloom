/**
 * An object without its undefined entries: what a chain left out is not
 * there at all, so a Bloom component's own default (or its `in` check) holds,
 * as it does for the object an app writes by hand.
 */
export function defined<T extends object>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const entry = (value as Record<string, unknown>)[key];
    if (entry !== undefined) out[key] = entry;
  }
  return out as T;
}
