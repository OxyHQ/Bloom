import {
  type EntityDefinition,
  persistedVersions,
  type ListDefinition,
  type ListState,
  readPath,
  writePath,
} from './definition';
import { afterFrame, connectBrowserEnvironment } from './environment';
import type { PersistBatch, Persister } from './persist';
import { changedPaths, isPlainObject, merge, type Plain, share } from './share';

export type Listener = () => void;

/**
 * One record in memory.
 *
 * `base` is what the server (or a disk copy of it) said; `layers` are the
 * optimistic patches of actions still in flight, applied over it in order;
 * `value` is the two together, which is what everyone reads. All three hold
 * the normalised form: a ref field holds the referenced record's id.
 */
export class Slot {
  base: Plain | undefined = undefined;
  layers: Array<{ id: number; partial: Plain }> | undefined = undefined;
  value: Plain | undefined = undefined;
  /** Store clock when `value` last appeared or disappeared: every path changed then. */
  bornAt = 0;
  /** Store clock of the last change to `value`. */
  changedAt = 0;
  /** Store clock of the last change of each path that changed after birth. */
  paths: Map<string, number> | undefined = undefined;
  listeners: Set<Listener> | undefined = undefined;
  /** Wall-clock time of the last write, for garbage collection. */
  touchedAt = 0;
  /** The denormalised read (refs resolved), valid while no dependency changed since `denormAt`. */
  denorm: Plain | undefined = undefined;
  denormAt = -1;
  denormDeps: Slot[] | undefined = undefined;

  constructor(
    readonly definition: EntityDefinition,
    readonly id: string,
  ) {}

  /** Store clock of the last change of `path` (`''` is the record's existence). */
  pathAt(path: string): number {
    if (path === '') return this.bornAt;
    const at = this.paths?.get(path);
    return at !== undefined && at > this.bornAt ? at : this.bornAt;
  }
}

export class ListSlot {
  state: ListState | undefined = undefined;
  changedAt = 0;
  listeners: Set<Listener> | undefined = undefined;
  /** Set while a source observes the list, so garbage collection keeps it. */
  observed = 0;

  constructor(
    readonly definition: ListDefinition,
    readonly key: string,
  ) {}
}

export interface StoreOptions {
  /** The durable copy, or none (web, tests, a server render). */
  persister?: Persister;
  /** Rows not written for this long are dropped when the copy opens. Default 7 days. */
  persistMaxAgeMs?: number;
}

export interface PutOptions {
  /**
   * The payload was produced for no viewer (a broadcast). The entity's
   * `viewerFields` are then kept from the copy already held, when there is one.
   */
  anonymous?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

let nextLayerId = 1;

/**
 * The data of one account (or one server request): every entity record and
 * list in memory, who listens to which, the optimistic layers, the
 * write-behind queue to the durable copy, and the state of every source.
 *
 * A store is closed when its account is left. A closed store ignores every
 * write, so a response that lands after an account switch is dropped rather
 * than shown to the next account.
 */
export class Store {
  /** Logical time: every change to a record or list moves it. */
  clock = 0;
  closed = false;
  readonly persister: Persister | undefined;
  /** Source state by source and key; owned by `source.ts`. */
  readonly queries = new Map<string, unknown>();
  /** Sources that have connected this store to the environment; owned by `source.ts`. */
  readonly sources = new Set<number>();
  /** Things to undo when the store closes (environment listeners, timers). */
  readonly cleanups = new Set<() => void>();

  private readonly tables = new Map<string, Map<string, Slot>>();
  private readonly lists = new Map<string, Map<string, ListSlot>>();
  private readonly listDefinitions = new Map<string, ListDefinition>();
  private batchDepth = 0;
  private readonly pending = new Set<Listener>();
  private readonly stored = new Map<EntityDefinition, Plain[]>();
  private layerScope: { id: number; slots: Set<Slot> } | null = null;
  private readonly dirtyRecords = new Set<Slot>();
  private readonly dirtyLists = new Set<ListSlot>();
  private cancelFlush: (() => void) | undefined;
  private flushing: Promise<void> = Promise.resolve();
  private persisterFailed = false;

  constructor(options: StoreOptions = {}) {
    this.persister = options.persister;
    this.persistMaxAgeMs = options.persistMaxAgeMs ?? 7 * DAY_MS;
    connectBrowserEnvironment();
  }

  private readonly persistMaxAgeMs: number;
  private opened: Promise<void> | undefined;

  /**
   * Opens the durable copy, once, with the schema version of every persisted
   * entity defined so far. Every read and write waits for it.
   */
  ready(): Promise<void> {
    const persister = this.persister;
    if (!persister) return Promise.resolve();
    this.opened ??= persister
      .open({ versions: persistedVersions(), maxAgeMs: this.persistMaxAgeMs })
      .catch((error) => {
        this.persisterFailed = true;
        reportError(error);
      });
    return this.opened;
  }

  // ── Tables ──────────────────────────────────────────────────

  register(definition: EntityDefinition): Map<string, Slot> {
    let table = this.tables.get(definition.type);
    if (!table) {
      table = new Map();
      this.tables.set(definition.type, table);
    }
    return table;
  }

  /** The record's slot; `create` makes an empty one (to listen for its arrival). */
  slot(definition: EntityDefinition, id: string, create: true): Slot;
  slot(definition: EntityDefinition, id: string, create?: boolean): Slot | undefined;
  slot(definition: EntityDefinition, id: string, create = false): Slot | undefined {
    const table = this.register(definition);
    let slot = table.get(id);
    if (!slot && create) {
      slot = new Slot(definition, id);
      table.set(id, slot);
    }
    return slot;
  }

  /** Every id of `definition` held in memory. */
  ids(definition: EntityDefinition): string[] {
    const ids: string[] = [];
    for (const [id, slot] of this.register(definition)) if (slot.value) ids.push(id);
    return ids;
  }

  listSlot(definition: ListDefinition, key: string, create: true): ListSlot;
  listSlot(definition: ListDefinition, key: string, create?: boolean): ListSlot | undefined;
  listSlot(definition: ListDefinition, key: string, create = false): ListSlot | undefined {
    let lists = this.lists.get(definition.type);
    if (!lists) {
      lists = new Map();
      this.lists.set(definition.type, lists);
      this.listDefinitions.set(definition.type, definition);
      this.register(definition.of);
    }
    let slot = lists.get(key);
    if (!slot && create) {
      slot = new ListSlot(definition, key);
      lists.set(key, slot);
    }
    return slot;
  }

  /** Every key of `definition` with a list in memory. */
  listKeys(definition: ListDefinition): string[] {
    const keys: string[] = [];
    for (const [key, slot] of this.lists.get(definition.type) ?? []) if (slot.state) keys.push(key);
    return keys;
  }

  // ── Notification ────────────────────────────────────────────

  /** Runs `fn` with every listener notified once, after it returns. */
  batch<T>(fn: () => T): T {
    this.batchDepth += 1;
    try {
      return fn();
    } finally {
      this.batchDepth -= 1;
      if (this.batchDepth === 0) {
        this.flushStored();
        this.flushListeners();
      }
    }
  }

  private queue(listeners: Set<Listener> | undefined): void {
    if (!listeners) return;
    for (const listener of listeners) this.pending.add(listener);
    if (this.batchDepth === 0) this.flushListeners();
  }

  private flushListeners(): void {
    while (this.pending.size > 0) {
      const listeners = [...this.pending];
      this.pending.clear();
      for (const listener of listeners) listener();
    }
  }

  listen(target: Slot | ListSlot, listener: Listener): () => void {
    target.listeners ??= new Set();
    target.listeners.add(listener);
    return () => {
      target.listeners?.delete(listener);
      if (target.listeners?.size === 0) target.listeners = undefined;
    };
  }

  // ── Record writes ───────────────────────────────────────────

  /**
   * Stores a record as the server sent it. Embedded records at ref paths are
   * stored in their own entities and replaced by their ids. Returns the id,
   * or `undefined` when the record has none.
   */
  put(definition: EntityDefinition, record: Plain, options: PutOptions = {}): string | undefined {
    if (this.closed) return undefined;
    const id = definition.idOf(record);
    if (!id) return undefined;
    let normalised = this.normalise(definition, record, options);
    const slot = this.slot(definition, id, true);
    if (definition.accept && slot.value) {
      const held = this.read(definition, id);
      if (held && !definition.accept(record, held)) return id;
    }
    if (options.anonymous && slot.base) {
      for (const field of definition.viewerFields) {
        if (slot.base[field] !== undefined) {
          normalised = { ...normalised, [field]: slot.base[field] };
        }
      }
    }
    this.writeBase(slot, normalised);
    if (definition.onStore) {
      let records = this.stored.get(definition);
      if (!records) {
        records = [];
        this.stored.set(definition, records);
      }
      records.push(record);
      if (this.batchDepth === 0) this.flushStored();
    }
    return id;
  }

  private flushStored(): void {
    while (this.stored.size > 0) {
      const batches = [...this.stored];
      this.stored.clear();
      for (const [definition, records] of batches) {
        try {
          definition.onStore?.(records);
        } catch (error) {
          reportError(error);
        }
      }
    }
  }

  /**
   * Merges `partial` into the record (plain objects key by key). Inside an
   * action's `optimistic`, it becomes that action's layer instead. Returns
   * false when the record is not held.
   */
  merge(definition: EntityDefinition, id: string, partial: Plain): boolean {
    if (this.closed) return false;
    const slot = this.slot(definition, id);
    if (!slot?.value) return false;
    const normalised = this.normalise(definition, partial, {});
    if (this.layerScope) {
      slot.layers ??= [];
      const existing = slot.layers.find((layer) => layer.id === this.layerScope?.id);
      if (existing) existing.partial = merge(existing.partial, normalised);
      else slot.layers.push({ id: this.layerScope.id, partial: normalised });
      this.layerScope.slots.add(slot);
      this.recompute(slot);
      return true;
    }
    if (!slot.base) return false;
    this.writeBase(slot, merge(slot.base, normalised));
    return true;
  }

  /** Replaces the record by what `next` returns from the current one; `null` removes it. */
  replace(definition: EntityDefinition, id: string, next: Plain | null): boolean {
    if (this.closed) return false;
    if (next === null) return this.remove(definition, id);
    const slot = this.slot(definition, id);
    if (!slot?.value) return false;
    if (this.layerScope) return this.merge(definition, id, next);
    this.writeBase(slot, this.normalise(definition, next, {}));
    return true;
  }

  /** Forgets the record, in memory and on disk, and drops it from every list of its entity. */
  remove(definition: EntityDefinition, id: string): boolean {
    if (this.closed) return false;
    const slot = this.slot(definition, id);
    if (!slot?.value) return false;
    this.batch(() => {
      slot.layers = undefined;
      this.writeBase(slot, undefined);
      this.dropFromLists(definition, new Set([id]));
    });
    return true;
  }

  private dropFromLists(definition: EntityDefinition, ids: ReadonlySet<string>): void {
    for (const [type, lists] of this.lists) {
      const listDefinition = this.listDefinitions.get(type);
      if (listDefinition?.of !== definition) continue;
      for (const list of lists.values()) {
        const state = list.state;
        if (!state) continue;
        const kept = state.ids.filter((id) => !ids.has(id));
        const extra = listDefinition.dropFromExtra
          ? listDefinition.dropFromExtra(state.extra, ids)
          : state.extra;
        if (kept.length === state.ids.length && extra === state.extra) continue;
        this.setList(list, { ...state, ids: kept, extra: extra as ListState['extra'] });
      }
    }
  }

  private normalise(definition: EntityDefinition, record: Plain, options: PutOptions): Plain {
    let out = record;
    for (const ref of definition.refs()) {
      const embedded = readPath(out, ref.path);
      if (!isPlainObject(embedded)) continue;
      const id = this.put(ref.target, embedded, options);
      if (id !== undefined) out = writePath(out, ref.path, id);
    }
    return out;
  }

  private writeBase(slot: Slot, base: Plain | undefined): void {
    slot.base = base === undefined ? undefined : share(slot.base, base);
    slot.touchedAt = Date.now();
    if (slot.definition.persistVersion !== null && this.persister) {
      this.dirtyRecords.add(slot);
      this.scheduleFlush();
    }
    this.recompute(slot);
  }

  private recompute(slot: Slot): void {
    let value = slot.base;
    if (value && slot.layers) {
      for (const layer of slot.layers) value = merge(value, layer.partial);
    }
    value = share(slot.value, value);
    if (value === slot.value) return;
    const previous = slot.value;
    slot.value = value;
    this.clock += 1;
    slot.changedAt = this.clock;
    if (previous === undefined || value === undefined) {
      slot.bornAt = this.clock;
      slot.paths = undefined;
    } else {
      const changed: string[] = [];
      changedPaths(previous, value, changed);
      slot.paths ??= new Map();
      for (const path of changed) slot.paths.set(path, this.clock);
    }
    this.queue(slot.listeners);
  }

  // ── Optimistic layers ───────────────────────────────────────

  /** Runs `fn` with record writes captured as one new layer; returns its id. */
  layer(fn: () => void): { id: number; slots: Set<Slot> } {
    const scope = { id: nextLayerId++, slots: new Set<Slot>() };
    const outer = this.layerScope;
    this.layerScope = scope;
    try {
      this.batch(fn);
    } finally {
      this.layerScope = outer;
    }
    return scope;
  }

  /** Writes a layer into the server copy of every record it touched, then removes it. */
  commitLayer(scope: { id: number; slots: Set<Slot> }): void {
    if (this.closed) return;
    this.batch(() => {
      for (const slot of scope.slots) {
        const layer = slot.layers?.find((entry) => entry.id === scope.id);
        if (!layer || !slot.layers) continue;
        slot.layers = slot.layers.filter((entry) => entry.id !== scope.id);
        if (slot.layers.length === 0) slot.layers = undefined;
        if (slot.base) this.writeBase(slot, merge(slot.base, layer.partial));
        else this.recompute(slot);
      }
    });
  }

  /** Removes a layer from every record it touched. */
  dropLayer(scope: { id: number; slots: Set<Slot> }): void {
    if (this.closed) return;
    this.batch(() => {
      for (const slot of scope.slots) {
        if (!slot.layers) continue;
        slot.layers = slot.layers.filter((layer) => layer.id !== scope.id);
        if (slot.layers.length === 0) slot.layers = undefined;
        this.recompute(slot);
      }
    });
  }

  // ── Reads ───────────────────────────────────────────────────

  /** The record with its refs resolved, as a plain object. Cached until a dependency changes. */
  read(definition: EntityDefinition, id: string): Plain | undefined {
    return this.readSlot(this.slot(definition, id), new Set());
  }

  private readSlot(slot: Slot | undefined, visiting: Set<Slot>): Plain | undefined {
    if (!slot?.value) return undefined;
    const refs = slot.definition.refs();
    if (refs.length === 0) return slot.value;
    if (slot.denorm && this.denormFresh(slot)) return slot.denorm;
    visiting.add(slot);
    const deps: Slot[] = [];
    let out = slot.value;
    for (const ref of refs) {
      const refId = readPath(out, ref.path);
      if (typeof refId !== 'string') continue;
      const target = this.slot(ref.target, refId);
      if (target && visiting.has(target)) continue;
      const resolved = this.readSlot(target, visiting);
      if (target) {
        deps.push(target);
        if (target.denormDeps) deps.push(...target.denormDeps);
      }
      out = writePath(out, ref.path, resolved);
    }
    visiting.delete(slot);
    slot.denorm = out;
    slot.denormAt = this.clock;
    slot.denormDeps = deps;
    return out;
  }

  private denormFresh(slot: Slot): boolean {
    if (slot.changedAt > slot.denormAt) return false;
    for (const dep of slot.denormDeps ?? []) if (dep.changedAt > slot.denormAt) return false;
    return true;
  }

  /** The slots a denormalised read of `slot` depends on (its refs, transitively). */
  dependencies(slot: Slot): readonly Slot[] {
    this.readSlot(slot, new Set());
    return slot.denormDeps ?? [];
  }

  /** Ids of `definition`'s records whose refs point at `id` of `target`. */
  referencing(definition: EntityDefinition, target: EntityDefinition, id: string): string[] {
    const refs = definition.refs().filter((ref) => ref.target === target);
    if (refs.length === 0) return [];
    const out: string[] = [];
    for (const [recordId, slot] of this.register(definition)) {
      if (slot.value && refs.some((ref) => readPath(slot.value as Plain, ref.path) === id)) {
        out.push(recordId);
      }
    }
    return out;
  }

  // ── Lists ───────────────────────────────────────────────────

  setList(slot: ListSlot, state: ListState | undefined): void {
    if (this.closed || slot.state === state) return;
    slot.state = state;
    this.clock += 1;
    slot.changedAt = this.clock;
    if (this.persister && slot.definition.persist(slot.key)) {
      this.dirtyLists.add(slot);
      this.scheduleFlush();
    }
    this.queue(slot.listeners);
  }

  // ── Durable copy ────────────────────────────────────────────

  private scheduleFlush(): void {
    if (this.cancelFlush || this.closed) return;
    this.cancelFlush = afterFrame(() => {
      this.cancelFlush = undefined;
      void this.flush();
    });
  }

  /** Writes every change queued since the last flush, in one transaction. */
  flush(): Promise<void> {
    this.cancelFlush?.();
    this.cancelFlush = undefined;
    const persister = this.persister;
    if (!persister || (this.dirtyRecords.size === 0 && this.dirtyLists.size === 0)) {
      return this.flushing;
    }
    const records: Array<PersistBatch['records'][number]> = [];
    for (const slot of this.dirtyRecords) {
      records.push({
        type: slot.definition.type,
        id: slot.id,
        json: slot.base ? JSON.stringify(slot.base) : null,
      });
    }
    const lists: Array<PersistBatch['lists'][number]> = [];
    for (const slot of this.dirtyLists) {
      const state = slot.state;
      lists.push({
        type: slot.definition.type,
        key: slot.key,
        ids: state ? state.ids : null,
        json: state ? JSON.stringify({ ...state, ids: undefined, origin: undefined }) : null,
      });
    }
    this.dirtyRecords.clear();
    this.dirtyLists.clear();
    this.flushing = this.flushing
      .then(() => this.ready())
      .then(() => (this.persisterFailed ? undefined : persister.write({ records, lists })))
      .catch(reportError);
    return this.flushing;
  }

  /** Reads records from the durable copy into memory, with the records their refs name. */
  async hydrate(definition: EntityDefinition, ids: readonly string[]): Promise<void> {
    const persister = this.persister;
    if (!persister || definition.persistVersion === null) return;
    const missing = ids.filter((id) => !this.slot(definition, id)?.base);
    if (missing.length === 0) return;
    await this.ready();
    if (this.persisterFailed || this.closed) return;
    const stored = await persister.readRecords(definition.type, missing);
    if (this.closed) return;
    const byTarget = new Map<EntityDefinition, Set<string>>();
    this.batch(() => {
      for (const { id, json } of stored) {
        const slot = this.slot(definition, id, true);
        // Memory is never older than the disk copy: a record written since
        // the screen opened wins.
        if (slot.base) continue;
        let base: Plain;
        try {
          base = JSON.parse(json) as Plain;
        } catch {
          continue;
        }
        for (const ref of definition.refs()) {
          const refId = readPath(base, ref.path);
          if (typeof refId !== 'string') continue;
          let set = byTarget.get(ref.target);
          if (!set) {
            set = new Set();
            byTarget.set(ref.target, set);
          }
          set.add(refId);
        }
        slot.base = base;
        slot.touchedAt = Date.now();
        this.recompute(slot);
      }
    });
    await Promise.all([...byTarget].map(([target, refIds]) => this.hydrate(target, [...refIds])));
  }

  /**
   * Reads a list (and its records) from the durable copy, unless memory
   * already holds the list. Returns whether it was read.
   */
  async hydrateList(definition: ListDefinition, key: string): Promise<boolean> {
    const persister = this.persister;
    if (!persister || !definition.persist(key)) return false;
    if (this.listSlot(definition, key)?.state) return false;
    await this.ready();
    if (this.persisterFailed || this.closed) return false;
    const stored = await persister.readList(definition.type, key);
    if (!stored || this.closed) return false;
    await this.hydrate(definition.of, stored.ids);
    const slot = this.listSlot(definition, key, true);
    if (slot.state || this.closed) return false;
    let rest: Omit<ListState, 'ids' | 'origin'>;
    try {
      rest = JSON.parse(stored.json) as Omit<ListState, 'ids' | 'origin'>;
    } catch {
      return false;
    }
    const ids = stored.ids.filter((id) => this.slot(definition.of, id)?.value);
    this.batch(() => {
      slot.state = { ...rest, ids, origin: 'disk' };
      this.clock += 1;
      slot.changedAt = this.clock;
      this.queue(slot.listeners);
    });
    return true;
  }

  // ── Memory ──────────────────────────────────────────────────

  /**
   * Drops from memory (never from disk) every record nothing holds: no
   * listener, no pending layer, no list, not referenced by a kept record, and
   * not written for `idleMs`.
   */
  collect(idleMs = 60_000): void {
    const now = Date.now();
    const keep = new Set<Slot>();
    const mark = (slot: Slot | undefined) => {
      if (!slot || keep.has(slot)) return;
      keep.add(slot);
      if (!slot.value) return;
      for (const ref of slot.definition.refs()) {
        const refId = readPath(slot.value, ref.path);
        if (typeof refId === 'string') mark(this.slot(ref.target, refId));
      }
    };
    for (const [type, lists] of this.lists) {
      const definition = this.listDefinitions.get(type);
      if (!definition) continue;
      for (const list of lists.values()) {
        for (const id of list.state?.ids ?? []) mark(this.slot(definition.of, id));
      }
    }
    for (const table of this.tables.values()) {
      for (const slot of table.values()) {
        if (slot.listeners || slot.layers || now - slot.touchedAt < idleMs) mark(slot);
      }
    }
    for (const table of this.tables.values()) {
      for (const [id, slot] of table) {
        if (!keep.has(slot) && !this.dirtyRecords.has(slot)) table.delete(id);
      }
    }
  }

  /** Forgets a list in memory only (its source was not observed for its `gcTime`). */
  evictList(definition: ListDefinition, key: string): void {
    const lists = this.lists.get(definition.type);
    const slot = lists?.get(key);
    if (!slot || slot.listeners || slot.observed > 0 || this.dirtyLists.has(slot)) return;
    lists?.delete(key);
  }

  /**
   * Closes the store at once: writes already queued still reach the durable
   * copy (they were this account's), then the copy closes. Every later write
   * is ignored.
   */
  close(): Promise<void> {
    if (this.closing) return this.closing;
    // The queue is taken now, so it still reaches this account's copy; from
    // here on, every write to this store is ignored.
    const flushed = this.flush();
    this.closed = true;
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups.clear();
    this.closing = flushed.then(() => this.persister?.close().catch(reportError));
    return this.closing;
  }

  private closing: Promise<void> | undefined;
}

export function reportError(error: unknown): void {
  const report = (globalThis as { reportError?: (error: unknown) => void }).reportError;
  if (typeof report === 'function') report(error);
  else console.error(error);
}
