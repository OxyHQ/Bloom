/**
 * The durable copy, as the store sees it: asynchronous only. It is written in
 * the background after changes settle and read when a screen opens or the app
 * boots, never while React renders. `sqlitePersister` (`@oxy.so/bloom-data/sqlite`)
 * implements it over expo-sqlite; web keeps no durable copy for now.
 */
export interface Persister {
  /**
   * Opens the copy. `versions` is each persisted entity type's schema version:
   * rows of a type stored under another version are deleted. Rows not written
   * for `maxAgeMs` are deleted too (the persister may do that with its first
   * write, to keep opening short).
   */
  open(options: { versions: Readonly<Record<string, number>>; maxAgeMs: number }): Promise<void>;
  /** The stored JSON of the records that exist among `ids`. */
  readRecords(type: string, ids: readonly string[]): Promise<ReadonlyArray<StoredRecord>>;
  /**
   * A list's stored ids and page data, with the stored records of `recordType`
   * its ids name, in one read; or `null`.
   */
  readList(type: string, key: string, recordType: string): Promise<StoredList | null>;
  /** One transaction: records and lists to upsert, or (`json: null`) delete. */
  write(batch: PersistBatch): Promise<void>;
  close(): Promise<void>;
}

export interface StoredRecord {
  readonly id: string;
  readonly json: string;
}

export interface StoredList {
  readonly ids: readonly string[];
  /** The list state without its ids, as JSON. */
  readonly json: string;
  /** The records its ids name that are stored. */
  readonly records: ReadonlyArray<StoredRecord>;
}

export interface PersistBatch {
  readonly records: ReadonlyArray<{ type: string; id: string; json: string | null }>;
  readonly lists: ReadonlyArray<{
    type: string;
    key: string;
    ids: readonly string[] | null;
    json: string | null;
  }>;
}
