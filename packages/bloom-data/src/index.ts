/**
 * `@oxy.so/bloom-data`: Bloom's data layer.
 *
 * - `entity` holds records by id in memory (SwiftData's `@Model`);
 * - `list` orders a key's ids into an entity;
 * - `source` fills lists and records from the server (the fetching half of `@Query`);
 * - `action` changes them optimistically and settles or rolls back;
 * - `realtime` writes a socket's events into the same records;
 * - `useEntity`, `useList` and `useRecord` read them with field-level subscriptions.
 *
 * The durable copy (`@oxy.so/bloom-data/sqlite`) is written in the background
 * and read only when a screen opens or the app boots, never during render.
 */
export type { ListState } from './definition';
export {
  type Entity,
  type EntityOptions,
  entity,
  type List,
  type ListOptions,
  list,
  type RefTarget,
} from './entity';
export { environment } from './environment';
export { type Action, type ActionOptions, action } from './action';
export { type EventSocket, type RealtimeHandlers, realtime } from './realtime';
export {
  type FetchStatus,
  type ListSource,
  type ListSourceOptions,
  type Page,
  type PageRequest,
  type RecordSource,
  type RecordSourceOptions,
  type SourceState,
  type Staleness,
  source,
} from './source';
export {
  DataProvider,
  type ListView,
  type RecordView,
  useEntity,
  useList,
  useRecord,
  useStore,
} from './hooks';
export {
  type AccountOptions,
  type Accounts,
  activeStore,
  createAccounts,
  currentStore,
  setActiveStore,
  withStore,
} from './root';
export { type PutOptions, Store, type StoreOptions } from './store';
export type { PersistBatch, Persister, StoredList, StoredRecord } from './persist';
export type { DeepPartial } from './share';
