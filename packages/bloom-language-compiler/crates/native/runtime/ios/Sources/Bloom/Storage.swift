// Bloom (I/O): `KeyValueStore`, `SecureStore` and `FileStore`: synchronous string stores that
// persist across launches. `KeyValueStore` is `UserDefaults` on Apple platforms (a JSON file
// per store under the app's support directory elsewhere), `SecureStore` the Keychain (memory
// elsewhere: a stand-in for tests, never for secrets), and `FileStore` files under the app's
// support directory (`bloom/files/<name>/<path>`, each name percent-encoded as the TS runtime's).
// A test installs its own backend with `BloomStorage.setBackend(_:for:)`.
import Foundation

#if canImport(Security)
import Security
#endif

/// Where a store's strings live: `kv` (`KeyValueStore`), `secure` (`SecureStore`), `file` (`FileStore`).
public protocol StorageBackend: Sendable {
  func get(_ name: String, _ key: String) -> String?
  func set(_ name: String, _ key: String, _ value: String?)
  func keys(_ name: String) -> [String]
}

/// The stores' backends and the directory they write under.
public enum BloomStorage {
  private static let state = Locked<(root: Foundation.URL?, backends: [String: any StorageBackend])>((nil, [:]))

  /// The directory the file-backed stores write under: the app's support directory unless set
  /// (a test's temporary directory). Setting it drops the backends made so far.
  public static var root: Foundation.URL {
    get {
      state.withLock { s in
        s.root ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
          .appendingPathComponent("bloom", isDirectory: true)
      }
    }
    set { state.withLock { $0 = (newValue, [:]) } }
  }

  /// Installs `backend` for `kind` (`kv`, `secure`, `file`).
  public static func setBackend(_ backend: any StorageBackend, for kind: String) { state.withLock { $0.backends[kind] = backend } }

  static func backend(_ kind: String) -> any StorageBackend {
    if let found = state.withLock({ $0.backends[kind] }) { return found }
    let dir = root
    let made: any StorageBackend
    switch kind {
    case "kv":
      #if canImport(Darwin)
      made = DefaultsStorage()
      #else
      made = JSONFileStorage(directory: dir.appendingPathComponent("kv", isDirectory: true))
      #endif
    case "secure":
      #if canImport(Security)
      made = KeychainStorage()
      #else
      made = MemoryStorage()
      #endif
    default:
      made = FileStorage(directory: dir.appendingPathComponent("files", isDirectory: true))
    }
    return state.withLock { s in
      if let raced = s.backends[kind] { return raced }
      s.backends[kind] = made
      return made
    }
  }
}

/// Small values that persist across launches: preferences, drafts, caches.
public struct KeyValueStore: Equatable, Hashable, Sendable {
  /// The store's namespace: stores with different names never see each other's keys.
  public let name: String

  public init(name: String) { self.name = name }

  /// The string at `key`, or `none`.
  public func string(_ key: String) -> String? { BloomStorage.backend("kv").get(name, key) }

  /// The boolean at `key`, or `none`.
  public func bool(_ key: String) -> Bool? { string(key).map { $0 == "true" } }

  /// The integer at `key`, or `none`.
  public func int(_ key: String) -> Int? { string(key).flatMap { $0.toInt() } }

  /// The number at `key`, or `none`.
  public func double(_ key: String) -> Double? { string(key).flatMap { $0.toFloat() } }

  /// Stores `value` at `key`.
  public func set(_ value: String, for key: String) { BloomStorage.backend("kv").set(name, key, value) }

  /// Stores a boolean at `key`.
  public func setBool(_ value: Bool, for key: String) { set(value ? "true" : "false", for: key) }

  /// Stores a number at `key` (as JS writes it: `1`, `1.5`).
  public func setNumber(_ value: Double, for key: String) { set(stringOfNumber(value), for: key) }

  /// The `T` stored at `key` (as JSON), or `none` when absent or no longer decodable.
  public func value<T: Decodable>(_ type: T.Type, for key: String) -> T? {
    guard let text = string(key) else { return nil }
    return try? JSON.decode(type, from: text)
  }

  /// Stores `value` at `key` as JSON.
  public func setValue<T: Encodable>(_ type: T.Type, _ value: T, for key: String) { set(JSON.encode(type, value), for: key) }

  /// Removes `key`.
  public func remove(_ key: String) { BloomStorage.backend("kv").set(name, key, nil) }

  /// Every key of the store.
  public var keys: [String] { BloomStorage.backend("kv").keys(name) }

  /// Removes every key of the store.
  public func clear() {
    for key in keys { remove(key) }
  }
}

/// Secrets (tokens, keys): the Keychain on Apple platforms.
public struct SecureStore: Equatable, Hashable, Sendable {
  public let name: String

  public init(name: String) { self.name = name }

  /// The secret at `key`, or `none`.
  public func string(_ key: String) -> String? { BloomStorage.backend("secure").get(name, key) }

  /// Stores the secret `value` at `key`.
  public func set(_ value: String, for key: String) { BloomStorage.backend("secure").set(name, key, value) }

  /// Removes `key`.
  public func remove(_ key: String) { BloomStorage.backend("secure").set(name, key, nil) }
}

/// Larger values (documents, caches of responses), by path within the app's storage.
public struct FileStore: Equatable, Hashable, Sendable {
  public let name: String

  public init(name: String) { self.name = name }

  /// The text of the file at `path`, or `none`.
  public func read(_ path: String) -> String? { BloomStorage.backend("file").get(name, path) }

  /// Writes `text` to the file at `path`.
  public func write(_ text: String, to path: String) { BloomStorage.backend("file").set(name, path, text) }

  /// Deletes the file at `path`.
  public func delete(_ path: String) { BloomStorage.backend("file").set(name, path, nil) }

  /// The paths of every file, in no order.
  public var paths: [String] { BloomStorage.backend("file").keys(name) }
}

// MARK: - Backends

/// Values in memory (tests; `SecureStore` off Apple platforms).
public final class MemoryStorage: StorageBackend, @unchecked Sendable {
  private let data = Locked([String: OrderedDictionary<String, String>]())

  public init() {}

  public func get(_ name: String, _ key: String) -> String? { data.withLock { $0[name]?[key] } }

  public func set(_ name: String, _ key: String, _ value: String?) { data.withLock { $0[name, default: [:]][key] = value } }

  public func keys(_ name: String) -> [String] { data.withLock { $0[name]?.keys ?? [] } }
}

/// Each store one JSON object in a file (`<directory>/<name>.json`), written atomically on
/// every change.
public final class JSONFileStorage: StorageBackend, @unchecked Sendable {
  private let directory: Foundation.URL
  private let cache = Locked([String: OrderedDictionary<String, String>]())

  public init(directory: Foundation.URL) { self.directory = directory }

  private func file(_ name: String) -> Foundation.URL { directory.appendingPathComponent(percentEncoded(name) + ".json") }

  private func load(_ name: String, _ cache: inout [String: OrderedDictionary<String, String>]) -> OrderedDictionary<String, String> {
    if let found = cache[name] { return found }
    var values = OrderedDictionary<String, String>()
    if let text = try? String(contentsOf: file(name), encoding: .utf8), case .object(let members)? = try? JSON.parse(text) {
      for (k, v) in members { if let s = v.stringValue { values[k] = s } }
    }
    cache[name] = values
    return values
  }

  public func get(_ name: String, _ key: String) -> String? { cache.withLock { load(name, &$0)[key] } }

  public func set(_ name: String, _ key: String, _ value: String?) {
    cache.withLock { c in
      var values = load(name, &c)
      values[key] = value
      c[name] = values
      try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
      let text = JSON.stringify(.object(values.mapValues { .string($0) }))
      try? Data(text.utf8).write(to: file(name), options: .atomic)
    }
  }

  public func keys(_ name: String) -> [String] { cache.withLock { load(name, &$0).keys } }
}

/// Each store a directory, each path a file (names percent-encoded, as the TS runtime's).
public final class FileStorage: StorageBackend, @unchecked Sendable {
  private let directory: Foundation.URL
  private let lock = NSLock()

  public init(directory: Foundation.URL) { self.directory = directory }

  private func dir(_ name: String) -> Foundation.URL { directory.appendingPathComponent(percentEncoded(name), isDirectory: true) }

  public func get(_ name: String, _ path: String) -> String? {
    lock.lock()
    defer { lock.unlock() }
    return try? String(contentsOf: dir(name).appendingPathComponent(percentEncoded(path)), encoding: .utf8)
  }

  public func set(_ name: String, _ path: String, _ value: String?) {
    lock.lock()
    defer { lock.unlock() }
    let file = dir(name).appendingPathComponent(percentEncoded(path))
    guard let value else {
      try? FileManager.default.removeItem(at: file)
      return
    }
    try? FileManager.default.createDirectory(at: dir(name), withIntermediateDirectories: true)
    try? Data(value.utf8).write(to: file, options: .atomic)
  }

  public func keys(_ name: String) -> [String] {
    lock.lock()
    defer { lock.unlock() }
    let names = (try? FileManager.default.contentsOfDirectory(atPath: dir(name).path)) ?? []
    return names.filter { !$0.hasPrefix(".") }.map(percentDecoded)
  }
}

#if canImport(Darwin)
/// `UserDefaults.standard`, each key under `bloom.kv.<name length>:<name>.<key>`.
final class DefaultsStorage: StorageBackend, @unchecked Sendable {
  private func prefix(_ name: String) -> String { "bloom.kv.\(name.utf8.count):\(name)." }

  func get(_ name: String, _ key: String) -> String? { UserDefaults.standard.string(forKey: prefix(name) + key) }

  func set(_ name: String, _ key: String, _ value: String?) {
    if let value {
      UserDefaults.standard.set(value, forKey: prefix(name) + key)
    } else {
      UserDefaults.standard.removeObject(forKey: prefix(name) + key)
    }
  }

  func keys(_ name: String) -> [String] {
    let p = prefix(name)
    return UserDefaults.standard.dictionaryRepresentation().keys.filter { $0.hasPrefix(p) }.map { String($0.dropFirst(p.count)) }.sorted()
  }
}
#endif

#if canImport(Security)
/// The Keychain: each secret a generic password, service `bloom.<name>`, account the key.
final class KeychainStorage: StorageBackend, @unchecked Sendable {
  private func query(_ name: String, _ key: String?) -> [String: Any] {
    var q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "bloom.\(name)"]
    if let key { q[kSecAttrAccount as String] = key }
    return q
  }

  func get(_ name: String, _ key: String) -> String? {
    var q = query(name, key)
    q[kSecReturnData as String] = true
    q[kSecMatchLimit as String] = kSecMatchLimitOne
    var out: CFTypeRef?
    guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let data = out as? Data else { return nil }
    return String(decoding: data, as: UTF8.self)
  }

  func set(_ name: String, _ key: String, _ value: String?) {
    let q = query(name, key)
    guard let value else {
      SecItemDelete(q as CFDictionary)
      return
    }
    let data = Data(value.utf8)
    let update: [String: Any] = [kSecValueData as String: data]
    if SecItemUpdate(q as CFDictionary, update as CFDictionary) == errSecItemNotFound {
      var add = q
      add[kSecValueData as String] = data
      add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
      SecItemAdd(add as CFDictionary, nil)
    }
  }

  func keys(_ name: String) -> [String] {
    var q = query(name, nil)
    q[kSecReturnAttributes as String] = true
    q[kSecMatchLimit as String] = kSecMatchLimitAll
    var out: CFTypeRef?
    guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let items = out as? [[String: Any]] else { return [] }
    return items.compactMap { $0[kSecAttrAccount as String] as? String }.sorted()
  }
}
#endif
