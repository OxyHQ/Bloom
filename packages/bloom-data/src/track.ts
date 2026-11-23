import { type EntityDefinition, readPath } from './definition';
import { isPlainObject, KEYS, PATH_SEPARATOR, type Plain, PRESENCE } from './share';
import type { Listener, Slot, Store } from './store';

/**
 * Field-level subscriptions, the `@Observable` way. One rule: record what a
 * reader reads, two levels deep; wake it when one of those paths changes.
 *
 * `useEntity` returns a read-only proxy over a record. Each property read is
 * recorded as `(record, path)`: `engagement.likes` for a nested field, `title`
 * for a top-level one. A ref field resolves to a proxy over the referenced
 * record, recorded the same way under that record. A top-level plain object
 * comes back as a proxy of its own, so reading `post.engagement` alone
 * records nothing more than whether it is there.
 *
 * Identity follows what was read. A proxy is replaced by a new one exactly
 * when a path read through it changed, so `memo`, the React Compiler and
 * `useMemo` see a new value precisely when what they used changed, and keep
 * the old one otherwise. Reads always see the record as it is now: a path
 * nobody read can change without a new proxy, and the first read of it sees
 * its current value.
 *
 * Values below the second level are returned as stored (shared, never to be
 * mutated). The proxies refuse writes.
 */
export class Tracker {
  /** Paths read, per record. Grows until the tracker is reset. */
  private readonly reads = new Map<Slot, Set<string>>();
  /** Proxies handed out: per record (`''`) and per top-level key of a record. */
  private readonly proxies = new Map<Slot, Map<string, { proxy: object; since: number }>>();
  private readonly unlisten = new Map<Slot, () => void>();
  private notify: Listener | null = null;
  private readonly onChange: Listener = () => this.notify?.();

  constructor(readonly store: Store) {}

  /** The proxy over `slot`'s record, or `undefined` while the record is absent. */
  record<T>(slot: Slot): T | undefined {
    this.read(slot, '');
    if (!slot.value) return undefined;
    return this.proxy(slot, '', () => this.recordProxy(slot)) as T;
  }

  /** Forgets every read (a different record is now being read). */
  reset(): void {
    this.reads.clear();
    this.proxies.clear();
    for (const stop of this.unlisten.values()) stop();
    this.unlisten.clear();
  }

  subscribe(listener: Listener): () => void {
    this.notify = listener;
    for (const slot of this.reads.keys()) this.listenTo(slot);
    return () => {
      this.notify = null;
      for (const stop of this.unlisten.values()) stop();
      this.unlisten.clear();
    };
  }

  /** Listens to `slot` too (a selector's dependency); reads nothing. */
  watch(slot: Slot): void {
    if (!this.reads.has(slot)) this.reads.set(slot, new Set(['']));
    if (this.notify) this.listenTo(slot);
  }

  private listenTo(slot: Slot): void {
    if (!this.unlisten.has(slot)) this.unlisten.set(slot, this.store.listen(slot, this.onChange));
  }

  private read(slot: Slot, path: string): void {
    let paths = this.reads.get(slot);
    if (!paths) {
      paths = new Set();
      this.reads.set(slot, paths);
      if (this.notify) this.listenTo(slot);
    }
    paths.add(path);
  }

  /** The cached proxy for (`slot`, `key`), or a new one when a path read under it changed. */
  private proxy(slot: Slot, key: string, make: () => object): object {
    let bySlot = this.proxies.get(slot);
    if (!bySlot) {
      bySlot = new Map();
      this.proxies.set(slot, bySlot);
    }
    const held = bySlot.get(key);
    if (held && !this.changedSince(slot, key, held.since, new Set())) return held.proxy;
    const proxy = make();
    bySlot.set(key, { proxy, since: this.store.clock });
    return proxy;
  }

  /**
   * Whether a path read on `slot` (under top-level `key`, or anywhere for
   * `''`) changed after `since`, following refs into the records they name.
   */
  private changedSince(slot: Slot, key: string, since: number, visited: Set<Slot>): boolean {
    if (visited.has(slot)) return false;
    visited.add(slot);
    if (slot.bornAt > since) return true;
    const paths = this.reads.get(slot);
    if (paths) {
      const prefix = key + PATH_SEPARATOR;
      for (const path of paths) {
        if (key !== '' && path !== key && path !== key + PRESENCE && !path.startsWith(prefix)) {
          continue;
        }
        if (slot.pathAt(path) > since) return true;
      }
    }
    if (!slot.value) return false;
    for (const ref of slot.definition.refs()) {
      if (key !== '' && ref.path[0] !== key) continue;
      const refId = readPath(slot.value, ref.path);
      if (typeof refId !== 'string') continue;
      const target = this.store.slot(ref.target, refId);
      if (target && this.reads.has(target) && this.changedSince(target, '', since, visited)) {
        return true;
      }
    }
    return false;
  }

  private refAt(
    definition: EntityDefinition,
    path: readonly string[],
  ): EntityDefinition | undefined {
    for (const ref of definition.refs()) {
      if (ref.path.length === path.length && ref.path.every((key, i) => key === path[i])) {
        return ref.target;
      }
    }
    return undefined;
  }

  /** A ref's value: the proxy over the record it names, or `undefined`. */
  private resolveRef(target: EntityDefinition, value: unknown): unknown {
    if (typeof value !== 'string') return value;
    return this.record(this.store.slot(target, value, true));
  }

  private recordProxy(slot: Slot): object {
    const current = () => slot.value ?? {};
    return new Proxy(
      {},
      readOnly({
        get: (_target, key) => {
          if (typeof key !== 'string') return (current() as Record<symbol, unknown>)[key];
          const value = current()[key];
          const ref = this.refAt(slot.definition, [key]);
          if (ref) {
            this.read(slot, key);
            return this.resolveRef(ref, value);
          }
          if (isPlainObject(value)) {
            this.read(slot, key + PRESENCE);
            return this.proxy(slot, key, () => this.nestedProxy(slot, key));
          }
          this.read(slot, key);
          return value;
        },
        has: (_target, key) => {
          if (typeof key === 'string') this.read(slot, key);
          return key in current();
        },
        ownKeys: () => {
          this.read(slot, KEYS);
          return Reflect.ownKeys(current());
        },
        getOwnPropertyDescriptor: (target, key) => describe(target, current(), key),
      }),
    );
  }

  private nestedProxy(slot: Slot, key: string): object {
    const current = (): Plain => {
      const value = slot.value?.[key];
      return isPlainObject(value) ? value : {};
    };
    return new Proxy(
      {},
      readOnly({
        get: (_target, innerKey) => {
          if (typeof innerKey !== 'string') return (current() as Record<symbol, unknown>)[innerKey];
          this.read(slot, key + PATH_SEPARATOR + innerKey);
          const value = current()[innerKey];
          const ref = this.refAt(slot.definition, [key, innerKey]);
          return ref ? this.resolveRef(ref, value) : value;
        },
        has: (_target, innerKey) => {
          if (typeof innerKey === 'string') this.read(slot, key + PATH_SEPARATOR + innerKey);
          return innerKey in current();
        },
        ownKeys: () => {
          this.read(slot, key + PATH_SEPARATOR + KEYS);
          return Reflect.ownKeys(current());
        },
        getOwnPropertyDescriptor: (target, innerKey) => describe(target, current(), innerKey),
      }),
    );
  }
}

/** Enumerable, configurable descriptors of the live record, so spread and JSON work. */
function describe(
  target: object,
  value: Plain,
  key: string | symbol,
): PropertyDescriptor | undefined {
  const own = Reflect.getOwnPropertyDescriptor(value, key);
  if (!own) return Reflect.getOwnPropertyDescriptor(target, key);
  return {
    value: own.value,
    writable: false,
    enumerable: true,
    configurable: true,
  };
}

function readOnly(handler: ProxyHandler<object>): ProxyHandler<object> {
  return {
    ...handler,
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  };
}
