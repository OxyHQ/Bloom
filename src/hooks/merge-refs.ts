import type { Ref, RefObject } from 'react';

/**
 * Merges multiple React refs into a single callback ref.
 *
 * The returned callback is annotated as `(instance: T | null) => void`
 * rather than `React.RefCallback<T>`. `RefCallback<T>` permits a cleanup
 * return (`() => VoidOrUndefinedOnly`), and `VoidOrUndefinedOnly` is built on
 * a `unique symbol` that is distinct per copy of `@types/react`. When a
 * consumer resolves two copies of the React types (e.g. Bloom's pinned
 * `@types/react` and the app's own), TypeScript reports the cleanup branch as
 * "two different types with this name exist, but they are unrelated" and the
 * host element's `ref` overload fails to match. A plain `void` return carries
 * no copy-specific identity, so the callback stays assignable to `Ref<T>` from
 * any copy of the types.
 */
export function mergeRefs<T>(
  refs: Array<Ref<T> | null | undefined>,
): (instance: T | null) => void {
  return (instance: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref != null) {
        (ref as RefObject<T | null>).current = instance;
      }
    }
  };
}
