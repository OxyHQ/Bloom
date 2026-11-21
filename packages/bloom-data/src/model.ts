import { type Entity, entity } from './entity';

/**
 * One value per store: an account's settings, a device's chosen language, the
 * profile a cold start paints. A model is an entity with a single record, so
 * it is read with the same hooks, changed inside an action's `optimistic` as
 * a layer, and copied to the durable store like any record, except that its
 * row never ages out.
 */
export interface ModelRecord<T> {
  readonly id: string;
  readonly value: T;
}

export interface ModelOptions {
  /** Copy the value to the durable store. A changed `version` drops it when the store opens. */
  persist?: boolean | { version: number };
}

export interface Model<T> {
  readonly entity: Entity<ModelRecord<T>>;
  /** The value in the store in scope, or `undefined` when none is held. */
  get(): T | undefined;
  /** Replaces the value (a function receives the current one). Inside `optimistic`, it is the action's layer. */
  set(next: T | ((current: T | undefined) => T)): void;
  /** Forgets the value, in memory and on disk. */
  clear(): void;
  /** Reads the value from the durable copy into memory, unless memory holds one. */
  load(): Promise<void>;
}

/** The id of a model's one record. */
export const MODEL_ID = 'value';

export function model<T>(type: string, options: ModelOptions = {}): Model<T> {
  const record = entity<ModelRecord<T>>(type, {
    id: (held) => held.id,
    persist: options.persist,
    expires: false,
  });
  return {
    entity: record,
    get: () => record.get(MODEL_ID)?.value,
    set(next) {
      const current = record.get(MODEL_ID)?.value;
      const value =
        typeof next === 'function' ? (next as (current: T | undefined) => T)(current) : next;
      // A held value is replaced through `update`, which an action's layer captures.
      if (!record.update(MODEL_ID, () => ({ id: MODEL_ID, value }))) {
        record.put({ id: MODEL_ID, value });
      }
    },
    clear: () => {
      record.remove(MODEL_ID);
    },
    load: () => record.load([MODEL_ID]),
  };
}
