import type { Plain } from './share';

/**
 * What `entity()` and `list()` declare, as the store reads it. Definitions are
 * module constants holding no data, so one set serves every store (each
 * account's, each server request's).
 */
export interface EntityDefinition {
  readonly kind: 'entity';
  readonly type: string;
  readonly idOf: (record: Plain) => string | undefined;
  /** Ref paths, resolved on first use so an entity can refer to itself. */
  refs(): readonly RefDefinition[];
  readonly viewerFields: readonly string[];
  /** How an incoming record joins the held one (refs resolved); `held` refuses it. */
  readonly combine: ((incoming: Plain, held: Plain) => Plain) | undefined;
  /** Told, once per batch, about every record of this type a write stored. */
  readonly onStore: ((records: readonly Plain[]) => void) | undefined;
  /** The persisted schema version, or `null` when the type is memory only. */
  readonly persistVersion: number | null;
  /** Whether stored rows age out (`persistMaxAgeMs`). A model's never do. */
  readonly expires: boolean;
  /** The most rows of this type the durable copy keeps (the newest written); `undefined`: no bound. */
  readonly persistLimit: number | undefined;
  /** Secondary keys, by name: a record's value for each (`undefined`: none). */
  readonly indexes: ReadonlyArray<readonly [string, (record: Plain) => string | undefined]>;
}

export interface RefDefinition {
  /** One or two keys: `['user']`, `['boost', 'originalPost']`. */
  readonly path: readonly [string] | readonly [string, string];
  readonly target: EntityDefinition;
}

/** A list's state for one key: ordered ids into its entity, plus the source's page data. */
export interface ListState<E = unknown> {
  readonly ids: readonly string[];
  /** What the source folded from its pages beside the ids (`fold`). */
  readonly extra: E | undefined;
  /** The cursor of the next page, if the server gave one. */
  readonly next: string | undefined;
  readonly hasMore: boolean;
  /** Every cursor already read, so a server that repeats one cannot loop. */
  readonly visited: readonly string[];
  /** When the server answered, in milliseconds since the epoch; 0 for a local list. */
  readonly updatedAt: number;
  /** Where the list came from: this session's network, the disk copy, or a local write. */
  readonly origin: 'network' | 'disk' | 'local';
}

export interface ListDefinition {
  readonly kind: 'list';
  readonly type: string;
  readonly of: EntityDefinition;
  /** Whether a key's list is copied to the durable store. */
  readonly persist: (key: string) => boolean;
  /** Drops removed ids from the list's `extra` (a list of slices that embed them, say). */
  readonly dropFromExtra: ((extra: unknown, ids: ReadonlySet<string>) => unknown) | undefined;
}

/**
 * A list change an action's `optimistic` makes as its layer (or a local write
 * outside one). Plain data, so a durable call's layer can be kept in its
 * outbox entry and re-applied after a restart.
 */
export type ListOp =
  | { readonly op: 'insert'; readonly ids: readonly string[]; readonly at?: number }
  | { readonly op: 'remove'; readonly ids: readonly string[] }
  | { readonly op: 'move'; readonly id: string; readonly to: number };

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

/**
 * `state` with `op` applied, or `state` itself when nothing changes:
 * - `insert` puts the ids not already in the list at `at` (default: the end);
 * - `remove` drops the ids, and from `extra` through `dropFromExtra`;
 * - `move` takes an id out and puts it back at index `to`.
 */
export function applyListOp(definition: ListDefinition, state: ListState, op: ListOp): ListState {
  const { ids } = state;
  if (op.op === 'insert') {
    const held = new Set(ids);
    const added = op.ids.filter((id) => {
      if (held.has(id)) return false;
      held.add(id);
      return true;
    });
    if (added.length === 0) return state;
    const at = clamp(op.at ?? ids.length, ids.length);
    return { ...state, ids: [...ids.slice(0, at), ...added, ...ids.slice(at)] };
  }
  if (op.op === 'remove') {
    const removed = new Set(op.ids);
    const kept = ids.filter((id) => !removed.has(id));
    const extra = definition.dropFromExtra
      ? definition.dropFromExtra(state.extra, removed)
      : state.extra;
    if (kept.length === ids.length && extra === state.extra) return state;
    return { ...state, ids: kept, extra };
  }
  const from = ids.indexOf(op.id);
  if (from < 0) return state;
  const rest = ids.filter((id) => id !== op.id);
  const to = clamp(op.to, rest.length);
  if (to === from) return state;
  return { ...state, ids: [...rest.slice(0, to), op.id, ...rest.slice(to)] };
}

const entities = new Map<string, EntityDefinition>();
const lists = new Map<string, ListDefinition>();

/**
 * Records a definition by type: a persisted entity's version is checked by
 * every store's durable copy, and a durable call's layer finds its records
 * and lists again after a restart. A module evaluated again (Fast Refresh)
 * replaces its own entry.
 */
export function registerDefinition(definition: EntityDefinition | ListDefinition): void {
  if (definition.kind === 'entity') entities.set(definition.type, definition);
  else lists.set(definition.type, definition);
}

export function entityDefinition(type: string): EntityDefinition | undefined {
  return entities.get(type);
}

export function listDefinition(type: string): ListDefinition | undefined {
  return lists.get(type);
}

const persisted = () => [...entities.values()].filter((d) => d.persistVersion !== null);

/** The persisted types whose rows never age out. */
export function persistedKeep(): string[] {
  return persisted()
    .filter((d) => !d.expires)
    .map((d) => d.type);
}

/** The persisted types with a bound on their rows, and the bound. */
export function persistedLimits(): Record<string, number> {
  const limits: Record<string, number> = {};
  for (const definition of persisted()) {
    if (definition.persistLimit !== undefined) limits[definition.type] = definition.persistLimit;
  }
  return limits;
}

export function persistedVersions(): Record<string, number> {
  const versions: Record<string, number> = {};
  for (const definition of persisted()) versions[definition.type] = definition.persistVersion ?? 0;
  return versions;
}

export function readPath(record: Plain, path: readonly string[]): unknown {
  let value: unknown = record;
  for (const key of path) {
    if (value === null || typeof value !== 'object') return undefined;
    value = (value as Plain)[key];
  }
  return value;
}

/** `record` with `value` at `path`, copying only the objects on the path. */
export function writePath(record: Plain, path: readonly string[], value: unknown): Plain {
  const [head, ...rest] = path;
  if (head === undefined) return record;
  if (rest.length === 0) return { ...record, [head]: value };
  const inner = record[head];
  if (inner === null || typeof inner !== 'object') return record;
  return { ...record, [head]: writePath(inner as Plain, rest, value) };
}
