// Bloom (data): `@Model` records held by key (`ModelStore`), read by `@Query`, filled by a
// `Source`, changed optimistically by a `Mutation` and fed by `Realtime` events: bloom-data's
// model (`packages/bloom-data`), in Swift.
//
// - Records persist in SQLite in bloom-data's own schema (`bloom_records` by type and id, as
//   JSON; `bloom_lists` of ordered ids), in `BloomData.databaseURL`. Writes go to a serial
//   queue in the background; reads at a store's first use are synchronous (bloom-data's
//   `openNow`/`loadNow` boot read). Without SQLite the records stay in memory.
// - A `Mutation`'s `optimistic` writes form a layer over the stores' records: readers see it at
//   once; server writes meanwhile change the records beneath it; when `perform` succeeds the
//   layer is written into the records, when it throws the layer goes (the rollback).
// - A store tells its subscribers after every change (`subscribe`), which is what a SwiftUI
//   `@Query` reader re-reads on; `version` counts the changes.
import Foundation

// MARK: - The database

/// The data layer's durable copy.
public enum BloomData {
  private static let state = Locked<(url: Foundation.URL?, database: ModelDatabase?)>((nil, nil))

  /// The SQLite file (`<BloomStorage.root>/bloom-data.db` unless set; set it before the first
  /// store is used, or to switch accounts: the stores made after read the new file).
  public static var databaseURL: Foundation.URL {
    get { state.withLock { $0.url } ?? BloomStorage.root.appendingPathComponent("bloom-data.db") }
    set {
      let old = state.withLock { s -> ModelDatabase? in
        defer { s = (newValue, nil) }
        return s.database
      }
      old?.flush()
    }
  }

  static var database: ModelDatabase {
    state.withLock { s in
      if let db = s.database { return db }
      let db = ModelDatabase(url: s.url ?? BloomStorage.root.appendingPathComponent("bloom-data.db"))
      s.database = db
      return db
    }
  }

  /// Waits until every write so far is on disk.
  public static func flush() { database.flush() }
}

final class ModelDatabase: @unchecked Sendable {
  private let queue = DispatchQueue(label: "so.oxy.bloom.data")
  private let db: SQLiteDatabase?

  static let schema = """
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS bloom_records (type TEXT NOT NULL, id TEXT NOT NULL, json TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (type, id)) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS bloom_lists (type TEXT NOT NULL, key TEXT NOT NULL, ids TEXT NOT NULL, json TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (type, key)) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS bloom_versions (type TEXT PRIMARY KEY NOT NULL, version INTEGER NOT NULL) WITHOUT ROWID;
    """

  init(url: Foundation.URL) {
    var opened: SQLiteDatabase?
    do {
      try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
      let db = try SQLiteDatabase(path: url.path)
      try db.execute(ModelDatabase.schema)
      opened = db
    } catch {
      Logger(subsystem: "bloom", category: "data").warning("@Model records are kept in memory only (\(error))")
    }
    db = opened
  }

  var isPersistent: Bool { db != nil }

  /// A list's ids and the stored JSON of its records, read now.
  func readList(type: String, key: String, recordType: String) -> (ids: [String], json: String, records: [String: String])? {
    queue.sync {
      guard let db,
        let row = try? db.query("SELECT ids, json FROM bloom_lists WHERE type = ? AND key = ?", [.text(type), .text(key)]).first,
        let idsText = row[0].text, case .array(let items)? = try? JSON.parse(idsText)
      else { return nil }
      let ids = items.compactMap(\.stringValue)
      var records: [String: String] = [:]
      var start = 0
      while start < ids.count {
        let chunk = Array(ids[start..<Swift.min(start + 200, ids.count)])
        let marks = Array(repeating: "?", count: chunk.count).joined(separator: ", ")
        let rows = (try? db.query("SELECT id, json FROM bloom_records WHERE type = ? AND id IN (\(marks))", [.text(recordType)] + chunk.map(SQLValue.text))) ?? []
        for r in rows { if let id = r[0].text, let json = r[1].text { records[id] = json } }
        start += 200
      }
      return (ids, row[1].text ?? "{}", records)
    }
  }

  /// One transaction, in the background: records to upsert (or, `json: nil`, delete) and lists.
  func write(records: [(type: String, id: String, json: String?)], lists: [(type: String, key: String, ids: [String]?, json: String)]) {
    guard db != nil, !(records.isEmpty && lists.isEmpty) else { return }
    queue.async { [db] in
      guard let db else { return }
      let now = Int64(Date().timeIntervalSince1970 * 1000)
      try? db.transaction {
        for r in records {
          if let json = r.json {
            try db.query(
              "INSERT OR REPLACE INTO bloom_records (type, id, json, updated_at) VALUES (?, ?, ?, ?)",
              [.text(r.type), .text(r.id), .text(json), .int(now)])
          } else {
            try db.query("DELETE FROM bloom_records WHERE type = ? AND id = ?", [.text(r.type), .text(r.id)])
          }
        }
        for l in lists {
          if let ids = l.ids {
            try db.query(
              "INSERT OR REPLACE INTO bloom_lists (type, key, ids, json, updated_at) VALUES (?, ?, ?, ?, ?)",
              [.text(l.type), .text(l.key), .text(JSON.stringify(.array(ids.map(JSONValue.string)))), .text(l.json), .int(now)])
          } else {
            try db.query("DELETE FROM bloom_lists WHERE type = ? AND key = ?", [.text(l.type), .text(l.key)])
          }
        }
      }
    }
  }

  func flush() { queue.sync {} }
}

// MARK: - Mutation layers

/// The optimistic layer a `Mutation` is writing (a task-local while its `optimistic` runs).
final class MutationLayer: @unchecked Sendable {
  private static let next = Locked(0)
  let id: Int
  private let touched = Locked<[ObjectIdentifier: (commit: @Sendable () -> Void, drop: @Sendable () -> Void)]>([:])

  init() { id = MutationLayer.next.withLock { $0 += 1; return $0 } }

  @TaskLocal static var current: MutationLayer?

  func touch(_ store: AnyObject, commit: @escaping @Sendable () -> Void, drop: @escaping @Sendable () -> Void) {
    touched.withLock { $0[ObjectIdentifier(store)] = (commit, drop) }
  }

  func commit() { for t in touched.withLock({ Array($0.values) }) { t.commit() } }

  func drop() { for t in touched.withLock({ Array($0.values) }) { t.drop() } }
}

// MARK: - ModelStore

/// The records of one `@Model` type, by key: what `@Model` derives as `T.store`
/// (`static let store = modelStore("Post", key: \Post.id)`).
public final class ModelStore<T: Codable & Sendable>: @unchecked Sendable {
  /// The type's name: its records' namespace on disk.
  public let name: String
  private let key: KeyPath<T, String> & Sendable
  private let persist: Bool

  private struct Layer {
    let id: Int
    var records: [String: T?] = [:]
    var added: [String] = []
  }

  private struct State {
    var loaded = false
    var base: [String: T] = [:]
    var order: [String] = []
    var layers: [Layer] = []
    var listeners: [Int: @Sendable () -> Void] = [:]
    var nextListener = 0
    var version = 0
  }

  private let state = Locked(State())

  init(name: String, key: KeyPath<T, String> & Sendable, persist: Bool) {
    self.name = name
    self.key = key
    self.persist = persist
  }

  private var listType: String { "\(name).all" }

  // ---- reading

  /// The record with key `id`, or `none`.
  public func get(_ id: String) -> T? {
    ensureLoaded()
    return state.withLock { visible($0, id) }
  }

  /// Every record held, in the order they were first inserted.
  public var all: [T] {
    ensureLoaded()
    return state.withLock { s in visibleIds(s).compactMap { visible(s, $0) } }
  }

  /// How many changes the store has seen (a reader re-reads when it moves).
  public var version: Int { state.withLock { $0.version } }

  /// Reads the records from the device's copy (a store's first use does it already).
  public func load() async throws { ensureLoaded() }

  /// Calls `listener` after every change; returns the unsubscribe.
  @discardableResult
  public func subscribe(_ listener: @escaping @Sendable () -> Void) -> @Sendable () -> Void {
    let id = state.withLock { s -> Int in
      s.nextListener += 1
      s.listeners[s.nextListener] = listener
      return s.nextListener
    }
    return { [state] in _ = state.withLock { $0.listeners.removeValue(forKey: id) } }
  }

  /// The records, filtered and sorted (stably) by `areInIncreasingOrder`.
  public func query(filter: ((T) -> Bool)? = nil, by areInIncreasingOrder: ((T, T) -> Bool)? = nil) -> [T] {
    var out = all
    if let filter { out = out.filter(filter) }
    if let areInIncreasingOrder { out = out.sorted(areInIncreasingOrder) }
    return out
  }

  private func visible(_ s: State, _ id: String) -> T? {
    for layer in s.layers.reversed() {
      if let entry = layer.records[id] { return entry }
    }
    return s.base[id]
  }

  private func visibleIds(_ s: State) -> [String] {
    var seen = Set<String>()
    var out: [String] = []
    for id in s.order + s.layers.flatMap(\.added) where seen.insert(id).inserted && visible(s, id) != nil { out.append(id) }
    return out
  }

  // ---- writing

  /// Stores `record`, replacing the one with its key.
  public func insert(_ record: T) { insertAll([record]) }

  /// Stores every one of `records`.
  public func insertAll(_ records: [T]) {
    guard !records.isEmpty else { return }
    ensureLoaded()
    write(records.map { ($0[keyPath: key], $0) })
  }

  /// Replaces the record `id` by `change` of it (inside a `Mutation`'s `optimistic`, in its
  /// layer). Whether `id` was held.
  @discardableResult
  public func update(_ id: String, _ change: (T) -> T) -> Bool {
    guard let current = get(id) else { return false }
    write([(id, change(current))])
    return true
  }

  /// Removes the record `id`, in memory and on disk. Whether it was held.
  @discardableResult
  public func delete(_ id: String) -> Bool {
    guard get(id) != nil else { return false }
    write([(id, nil)])
    return true
  }

  private func write(_ changes: [(String, T?)]) {
    if let layer = MutationLayer.current {
      state.withLock { s in
        let at: Int
        if let found = s.layers.firstIndex(where: { $0.id == layer.id }) {
          at = found
        } else {
          s.layers.append(Layer(id: layer.id))
          at = s.layers.count - 1
        }
        for (id, value) in changes {
          s.layers[at].records[id] = .some(value)
          if value != nil && s.base[id] == nil && !s.layers[at].added.contains(id) { s.layers[at].added.append(id) }
        }
        s.version += 1
      }
      layer.touch(self, commit: { [weak self] in self?.fold(layer.id) }, drop: { [weak self] in self?.drop(layer.id) })
    } else {
      state.withLock { s in
        apply(&s, changes)
        s.version += 1
      }
      persistChanges(changes)
    }
    notify()
  }

  private func apply(_ s: inout State, _ changes: [(String, T?)]) {
    for (id, value) in changes {
      if let value {
        if s.base.updateValue(value, forKey: id) == nil { s.order.append(id) }
      } else if s.base.removeValue(forKey: id) != nil {
        s.order.removeAll { $0 == id }
      }
    }
  }

  /// The layer's writes, into the records (its mutation succeeded).
  private func fold(_ layerID: Int) {
    let changes = state.withLock { s -> [(String, T?)] in
      guard let at = s.layers.firstIndex(where: { $0.id == layerID }) else { return [] }
      let layer = s.layers.remove(at: at)
      let changes = layer.added.map { ($0, layer.records[$0] ?? nil) }
        + layer.records.filter { !layer.added.contains($0.key) }.map { ($0.key, $0.value) }
      apply(&s, changes)
      s.version += 1
      return changes
    }
    persistChanges(changes)
    notify()
  }

  /// The layer goes (its mutation failed): the records beneath show again.
  private func drop(_ layerID: Int) {
    state.withLock { s in
      s.layers.removeAll { $0.id == layerID }
      s.version += 1
    }
    notify()
  }

  private func notify() {
    for listener in state.withLock({ $0.listeners.sorted { $0.key < $1.key }.map(\.value) }) { listener() }
  }

  // ---- the durable copy

  private func ensureLoaded() {
    guard persist else { return }
    if state.withLock({ $0.loaded }) { return }
    let stored = BloomData.database.readList(type: listType, key: "all", recordType: name)
    state.withLock { s in
      if s.loaded { return }
      s.loaded = true
      guard let stored else { return }
      var order: [String] = []
      for id in stored.ids where s.base[id] == nil {
        guard let json = stored.records[id], let record = try? JSON.decode(T.self, from: json) else { continue }
        s.base[id] = record
        order.append(id)
      }
      s.order = order + s.order.filter { !order.contains($0) }
    }
  }

  private func persistChanges(_ changes: [(String, T?)]) {
    guard persist, !changes.isEmpty else { return }
    let ids = state.withLock { $0.order }
    BloomData.database.write(
      records: changes.map { (name, $0.0, $0.1.map { JSON.encode(T.self, $0) }) },
      lists: [(listType, "all", ids, "{\"next\":null,\"hasMore\":false}")])
  }
}

/// What `@Model` writes for `T.store`: the records of `name`, keyed by `key`.
public func modelStore<T: Codable & Sendable>(_ name: String, key: KeyPath<T, String> & Sendable, persist: Bool = true) -> ModelStore<T> {
  ModelStore(name: name, key: key, persist: persist)
}

// MARK: - Queries

/// What `@Query(T.self, order:filter:)` lowers onto: the records, filtered, in insertion order
/// (reversed for `.reverse`).
public func useQuery<T>(_ store: ModelStore<T>, order: SortOrder = .forward, filter: ((T) -> Bool)? = nil) -> [T] {
  let out = store.query(filter: filter)
  return order == .reverse ? out.reversed() : out
}

/// What `@Query(T.self, sort:order:filter:)` lowers onto: the records sorted by a number,
/// string or `Date` field, stably.
public func useQuery<T, V: Comparable>(_ store: ModelStore<T>, sort: KeyPath<T, V>, order: SortOrder = .forward, filter: ((T) -> Bool)? = nil) -> [T] {
  store.query(filter: filter, by: { a, b in order == .reverse ? a[keyPath: sort] > b[keyPath: sort] : a[keyPath: sort] < b[keyPath: sort] })
}

/// `useQuery` sorted by a `Bool` field (`false` first).
public func useQuery<T>(_ store: ModelStore<T>, sort: KeyPath<T, Bool>, order: SortOrder = .forward, filter: ((T) -> Bool)? = nil) -> [T] {
  store.query(filter: filter, by: { a, b in
    let (x, y) = (a[keyPath: sort] ? 1 : 0, b[keyPath: sort] ? 1 : 0)
    return order == .reverse ? x > y : x < y
  })
}

/// What `@Query(T.store, id: x)` lowers onto: one record.
public func useRecordQuery<T>(_ store: ModelStore<T>, id: String?) -> T? { id.flatMap { store.get($0) } }

// MARK: - Source

/// One page of a `Source`: its records and the next page's cursor (`none`: the last).
public struct SourcePage<T: Sendable>: Sendable {
  public let items: [T]
  public let next: String?

  public init(items: [T], next: String?) {
    self.items = items
    self.next = next
  }
}

/// A server list of a `@Model` type's records, read a page at a time and kept on the device
/// (its ids in `bloom_lists` as `<Type>.<name>`).
public final class Source<T: Codable & Sendable>: @unchecked Sendable {
  public let name: String
  public let store: ModelStore<T>
  private let loader: @Sendable (String?, TaskSignal) async throws -> SourcePage<T>

  private struct State {
    var ids: [String] = []
    var next: String?
    var loadedFromDisk = false
    var started = false
    var loading: TaskSignal?
    var listeners: [Int: @Sendable () -> Void] = [:]
    var nextListener = 0
  }

  private let state = Locked(State())

  init(store: ModelStore<T>, name: String, load: @escaping @Sendable (String?, TaskSignal) async throws -> SourcePage<T>) {
    self.store = store
    self.name = name
    loader = load
  }

  /// The list `name` of `store`'s records, whose pages `load(cursor, cancellation)` reads.
  public static func make(_ store: ModelStore<T>, name: String, _ load: @escaping @Sendable (String?, TaskSignal) async throws -> SourcePage<T>) -> Source<T> {
    Source(store: store, name: name, load: load)
  }

  private var listType: String { "\(store.name).\(name)" }

  /// The records, in the list's order.
  public var items: [T] {
    readDisk()
    return state.withLock { $0.ids }.compactMap { store.get($0) }
  }

  /// Whether there is a next page.
  public var hasMore: Bool { state.withLock { $0.next != nil } }

  /// Calls `listener` after the list changes; returns the unsubscribe.
  @discardableResult
  public func subscribe(_ listener: @escaping @Sendable () -> Void) -> @Sendable () -> Void {
    let id = state.withLock { s -> Int in
      s.nextListener += 1
      s.listeners[s.nextListener] = listener
      return s.nextListener
    }
    return { [state] in _ = state.withLock { $0.listeners.removeValue(forKey: id) } }
  }

  /// Reads the first page again (a failure keeps the list as it was).
  public func refresh() async {
    do { try await page(nil, appending: false) } catch {}
  }

  /// Reads the next page, if there is one.
  public func loadMore() async {
    guard let next = state.withLock({ $0.next }) else { return }
    do { try await page(next, appending: true) } catch {}
  }

  /// The first read of `useSource`: the stored list, then the server's first page.
  func start() {
    let first = state.withLock { s -> Bool in
      defer { s.started = true }
      return !s.started
    }
    if first { Task { await refresh() } }
  }

  private func readDisk() {
    let needed = state.withLock { s -> Bool in
      defer { s.loadedFromDisk = true }
      return !s.loadedFromDisk
    }
    guard needed, let stored = BloomData.database.readList(type: listType, key: name, recordType: store.name) else { return }
    let next = (try? JSON.parse(stored.json))?["next"].stringValue
    state.withLock { s in
      if s.ids.isEmpty {
        s.ids = stored.ids
        s.next = next
      }
    }
  }

  private func page(_ cursor: String?, appending: Bool) async throws {
    readDisk()
    let signal = TaskSignal()
    let previous = state.withLock { s -> TaskSignal? in
      defer { s.loading = signal }
      return s.loading
    }
    // A refresh supersedes the load before it; a `loadMore` waits for none.
    if !appending { previous?.cancel() }
    let result = try await loader(cursor, signal)
    try signal.checkCancellation()
    store.insertAll(result.items)
    let ids = result.items.map { $0[keyPath: idPath] }
    let (all, next) = state.withLock { s -> ([String], String?) in
      s.ids = appending ? s.ids + ids.filter { !s.ids.contains($0) } : ids
      s.next = result.next
      if s.loading === signal { s.loading = nil }
      return (s.ids, s.next)
    }
    let json = JSON.stringify(["next": next.map(JSONValue.string) ?? .null])
    BloomData.database.write(records: [], lists: [(listType, name, all, json)])
    for l in state.withLock({ $0.listeners.sorted { $0.key < $1.key }.map(\.value) }) { l() }
  }

  private var idPath: KeyPath<T, String> & Sendable { store.keyPath }
}

extension ModelStore {
  var keyPath: KeyPath<T, String> & Sendable { key }
}

/// What `@Query(source)` lowers onto: the source's records, in its order (the first read also
/// starts its first page).
public func useSource<T>(_ source: Source<T>) -> [T] {
  source.start()
  return source.items
}

// MARK: - Mutation

/// A change shown at once (`optimistic`, on `@Model` stores) and settled by `perform`: when it
/// throws, the optimistic change is rolled back.
public struct Mutation<Input: Sendable, Output: Sendable>: Sendable {
  public let name: String
  private let optimistic: (@Sendable (Input) -> Void)?
  private let perform: @Sendable (Input) async throws -> Output

  public static func make(
    _ name: String,
    optimistic: (@Sendable (Input) -> Void)? = nil,
    _ perform: @escaping @Sendable (Input) async throws -> Output
  ) -> Mutation<Input, Output> {
    Mutation(name: name, optimistic: optimistic, perform: perform)
  }

  /// Runs the mutation: its result, or `none` when it failed (and was rolled back).
  public func run(_ input: Input) async -> Output? {
    let layer = MutationLayer()
    if let optimistic { MutationLayer.$current.withValue(layer) { optimistic(input) } }
    do {
      let out = try await perform(input)
      layer.commit()
      return out
    } catch {
      layer.drop()
      return nil
    }
  }
}

// MARK: - Realtime

/// What `Realtime` listens on: a socket's events by name (socket.io's `on`), each listener
/// removed by the function `on` returns.
public protocol EventSocket: AnyObject, Sendable {
  func on(_ event: String, _ listener: @escaping @Sendable (JSONValue) -> Void) -> @Sendable () -> Void
}

/// A socket's events written into `@Model` stores. (bloom-data applies a frame's events
/// together; here each is applied as it arrives.)
public struct Realtime: Sendable {
  private let stop: @Sendable () -> Void

  /// Calls each handler with its event's payload; `cancel()` stops listening.
  public static func listen(_ socket: any EventSocket, _ handlers: OrderedDictionary<String, @Sendable (JSONValue) -> Void>) -> Realtime {
    let offs = handlers.map { socket.on($0.key, $0.value) }
    return Realtime(stop: { for off in offs { off() } })
  }

  /// Stops listening.
  public func cancel() { stop() }
}
