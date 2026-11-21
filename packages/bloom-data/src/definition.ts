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

const persisted = new Map<string, EntityDefinition>();

/**
 * Records a persisted entity type, so every store's durable copy checks its
 * version. A module evaluated again (Fast Refresh) replaces its own entry.
 */
export function registerPersisted(definition: EntityDefinition): void {
  if (definition.persistVersion !== null) persisted.set(definition.type, definition);
}

/** The persisted types whose rows never age out. */
export function persistedKeep(): string[] {
  return [...persisted.values()].filter((d) => !d.expires).map((d) => d.type);
}

export function persistedVersions(): Record<string, number> {
  const versions: Record<string, number> = {};
  for (const [type, definition] of persisted) versions[type] = definition.persistVersion ?? 0;
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
