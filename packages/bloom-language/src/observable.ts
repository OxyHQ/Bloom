import { useCallback, useSyncExternalStore } from 'react';

/**
 * The store under a Bloom `@Observable final class` (ADR 0002, section 5): its fields
 * are plain properties, read directly, and written through `$set`, which tells the views
 * that read that field to draw again. No proxies: bloomc knows at compile time which
 * fields each view reads, and subscribes it to those only (`useObserved`).
 *
 * ```ts
 * class FeedModel extends Observable { posts: readonly Post[] = []; }
 * model.$set('posts', next); // only views that read `posts` draw again
 * ```
 */
export class Observable {
  /** Each field's version: it goes up on every write that changes the field. */
  private $versions: Record<string, number> = {};
  private $listeners: Map<string, Set<() => void>> = new Map();

  /** Writes `field` and notifies its readers, unless the value is the same one. */
  $set<K extends keyof this & string>(field: K, value: this[K]): void {
    if (Object.is(this[field], value)) return;
    this[field] = value;
    this.$versions[field] = (this.$versions[field] ?? 0) + 1;
    const listeners = this.$listeners.get(field);
    if (listeners) for (const listener of [...listeners]) listener();
  }

  /** Calls `listener` when one of `fields` changes; returns the unsubscribe. */
  $subscribe(fields: readonly string[], listener: () => void): () => void {
    for (const field of fields) {
      let set = this.$listeners.get(field);
      if (!set) {
        set = new Set();
        this.$listeners.set(field, set);
      }
      set.add(listener);
    }
    return () => {
      for (const field of fields) this.$listeners.get(field)?.delete(listener);
    };
  }

  /** A number that changes whenever one of `fields` does (the sum of their versions). */
  $version(fields: readonly string[]): number {
    let sum = 0;
    for (const field of fields) sum += this.$versions[field] ?? 0;
    return sum;
  }
}

/**
 * Subscribes the calling view to `fields` of `model` (bloomc emits it with the fields the
 * view reads): the view draws again when one of them changes. Returns the fields'
 * version, which the view's caches depend on where they read the model as a whole.
 */
export function useObserved(model: Observable, fields: readonly string[]): number {
  const subscribe = useCallback(
    (listener: () => void) => model.$subscribe(fields, listener),
    [model, fields],
  );
  const version = useCallback(() => model.$version(fields), [model, fields]);
  return useSyncExternalStore(subscribe, version, version);
}
