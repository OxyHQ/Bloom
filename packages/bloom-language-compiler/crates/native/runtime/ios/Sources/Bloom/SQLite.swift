// A small SQLite connection for the data layer. Apple platforms link the system's SQLite
// (`import SQLite3`). Linux has the library (`libsqlite3.so.0`) but often not its headers or
// its unversioned `.so`, so the functions are found at run time with `dlopen`/`dlsym`, declared
// below with the C signatures they have: nothing to install, nothing to link.
import Foundation

#if canImport(SQLite3)
import SQLite3

private typealias Statement = OpaquePointer
private let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

private enum C {
  static func open(_ path: String, _ db: inout OpaquePointer?) -> Int32 {
    sqlite3_open_v2(path, &db, SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX, nil)
  }
  static func close(_ db: OpaquePointer) { sqlite3_close_v2(db) }
  static func prepare(_ db: OpaquePointer, _ sql: UnsafePointer<CChar>, _ stmt: inout OpaquePointer?, _ tail: inout UnsafePointer<CChar>?) -> Int32 {
    sqlite3_prepare_v2(db, sql, -1, &stmt, &tail)
  }
  static func step(_ s: OpaquePointer) -> Int32 { sqlite3_step(s) }
  static func finalize(_ s: OpaquePointer) { sqlite3_finalize(s) }
  static func bindText(_ s: OpaquePointer, _ i: Int32, _ text: String) -> Int32 { sqlite3_bind_text(s, i, text, -1, transient) }
  static func bindInt(_ s: OpaquePointer, _ i: Int32, _ v: Int64) -> Int32 { sqlite3_bind_int64(s, i, v) }
  static func bindNull(_ s: OpaquePointer, _ i: Int32) -> Int32 { sqlite3_bind_null(s, i) }
  static func columnCount(_ s: OpaquePointer) -> Int32 { sqlite3_column_count(s) }
  static func columnType(_ s: OpaquePointer, _ i: Int32) -> Int32 { sqlite3_column_type(s, i) }
  static func columnInt(_ s: OpaquePointer, _ i: Int32) -> Int64 { sqlite3_column_int64(s, i) }
  static func columnText(_ s: OpaquePointer, _ i: Int32) -> String? {
    guard let p = sqlite3_column_text(s, i) else { return nil }
    return String(decoding: UnsafeBufferPointer(start: p, count: Int(sqlite3_column_bytes(s, i))), as: UTF8.self)
  }
  static func message(_ db: OpaquePointer) -> String { String(cString: sqlite3_errmsg(db)) }
  static func busyTimeout(_ db: OpaquePointer, _ ms: Int32) { sqlite3_busy_timeout(db, ms) }
  static let ok: Int32 = SQLITE_OK
  static let row: Int32 = SQLITE_ROW
  static let done: Int32 = SQLITE_DONE
  static let null: Int32 = SQLITE_NULL
  static let integer: Int32 = SQLITE_INTEGER
  static var available: Bool { true }
}
#else
#if canImport(Glibc)
import Glibc
#elseif canImport(Musl)
import Musl
#endif

/// The SQLite functions, found in the system's library at run time.
private struct API: @unchecked Sendable {
  typealias Open = @convention(c) (UnsafePointer<CChar>?, UnsafeMutablePointer<OpaquePointer?>?, Int32, UnsafePointer<CChar>?) -> Int32
  typealias Close = @convention(c) (OpaquePointer?) -> Int32
  typealias Prepare = @convention(c) (OpaquePointer?, UnsafePointer<CChar>?, Int32, UnsafeMutablePointer<OpaquePointer?>?, UnsafeMutablePointer<UnsafePointer<CChar>?>?) -> Int32
  typealias Step = @convention(c) (OpaquePointer?) -> Int32
  typealias BindText = @convention(c) (OpaquePointer?, Int32, UnsafePointer<CChar>?, Int32, Int) -> Int32
  typealias BindInt = @convention(c) (OpaquePointer?, Int32, Int64) -> Int32
  typealias BindNull = @convention(c) (OpaquePointer?, Int32) -> Int32
  typealias Column = @convention(c) (OpaquePointer?, Int32) -> Int32
  typealias ColumnInt = @convention(c) (OpaquePointer?, Int32) -> Int64
  typealias ColumnText = @convention(c) (OpaquePointer?, Int32) -> UnsafePointer<UInt8>?
  typealias Message = @convention(c) (OpaquePointer?) -> UnsafePointer<CChar>?
  typealias Busy = @convention(c) (OpaquePointer?, Int32) -> Int32

  let open: Open, close: Close, prepare: Prepare, step: Step, finalize: Step
  let bindText: BindText, bindInt: BindInt, bindNull: BindNull
  let columnCount: Step, columnType: Column, columnInt: ColumnInt, columnText: ColumnText, columnBytes: Column
  let message: Message, busy: Busy

  static let shared: API? = {
    let names: [String] = ["libsqlite3.so.0", "libsqlite3.so"]
    guard let lib = names.lazy.compactMap({ (name: String) in dlopen(name, RTLD_NOW) }).first else { return nil }
    func f<F>(_ name: String, _: F.Type) -> F? { dlsym(lib, name).map { unsafeBitCast($0, to: F.self) } }
    guard let open = f("sqlite3_open_v2", Open.self), let close = f("sqlite3_close_v2", Close.self),
      let prepare = f("sqlite3_prepare_v2", Prepare.self), let step = f("sqlite3_step", Step.self),
      let finalize = f("sqlite3_finalize", Step.self), let bindText = f("sqlite3_bind_text", BindText.self),
      let bindInt = f("sqlite3_bind_int64", BindInt.self), let bindNull = f("sqlite3_bind_null", BindNull.self),
      let columnCount = f("sqlite3_column_count", Step.self), let columnType = f("sqlite3_column_type", Column.self),
      let columnInt = f("sqlite3_column_int64", ColumnInt.self), let columnText = f("sqlite3_column_text", ColumnText.self),
      let columnBytes = f("sqlite3_column_bytes", Column.self), let message = f("sqlite3_errmsg", Message.self),
      let busy = f("sqlite3_busy_timeout", Busy.self)
    else { return nil }
    return API(
      open: open, close: close, prepare: prepare, step: step, finalize: finalize, bindText: bindText, bindInt: bindInt,
      bindNull: bindNull, columnCount: columnCount, columnType: columnType, columnInt: columnInt, columnText: columnText,
      columnBytes: columnBytes, message: message, busy: busy)
  }()
}

private enum C {
  static var api: API { API.shared! }
  static var available: Bool { API.shared != nil }
  static func open(_ path: String, _ db: inout OpaquePointer?) -> Int32 { api.open(path, &db, 0x02 | 0x04 | 0x10000, nil) }
  static func close(_ db: OpaquePointer) { _ = api.close(db) }
  static func prepare(_ db: OpaquePointer, _ sql: UnsafePointer<CChar>, _ stmt: inout OpaquePointer?, _ tail: inout UnsafePointer<CChar>?) -> Int32 {
    api.prepare(db, sql, -1, &stmt, &tail)
  }
  static func step(_ s: OpaquePointer) -> Int32 { api.step(s) }
  static func finalize(_ s: OpaquePointer) { _ = api.finalize(s) }
  /// `SQLITE_TRANSIENT` (-1): SQLite copies the text.
  static func bindText(_ s: OpaquePointer, _ i: Int32, _ text: String) -> Int32 { api.bindText(s, i, text, -1, -1) }
  static func bindInt(_ s: OpaquePointer, _ i: Int32, _ v: Int64) -> Int32 { api.bindInt(s, i, v) }
  static func bindNull(_ s: OpaquePointer, _ i: Int32) -> Int32 { api.bindNull(s, i) }
  static func columnCount(_ s: OpaquePointer) -> Int32 { api.columnCount(s) }
  static func columnType(_ s: OpaquePointer, _ i: Int32) -> Int32 { api.columnType(s, i) }
  static func columnInt(_ s: OpaquePointer, _ i: Int32) -> Int64 { api.columnInt(s, i) }
  static func columnText(_ s: OpaquePointer, _ i: Int32) -> String? {
    guard let p = api.columnText(s, i) else { return nil }
    return String(decoding: UnsafeBufferPointer(start: p, count: Int(api.columnBytes(s, i))), as: UTF8.self)
  }
  static func message(_ db: OpaquePointer) -> String { api.message(db).map { String(cString: $0) } ?? "unknown error" }
  static func busyTimeout(_ db: OpaquePointer, _ ms: Int32) { _ = api.busy(db, ms) }
  static let ok: Int32 = 0
  static let row: Int32 = 100
  static let done: Int32 = 101
  static let integer: Int32 = 1
  static let null: Int32 = 5
}
#endif

/// A value bound to, or read from, a statement.
enum SQLValue: Equatable, Sendable {
  case null
  case int(Int64)
  case text(String)

  var text: String? {
    if case .text(let s) = self { return s }
    return nil
  }
}

struct SQLiteError: Error, CustomStringConvertible {
  let description: String
}

/// One SQLite database file, used from one queue at a time.
final class SQLiteDatabase: @unchecked Sendable {
  private let db: OpaquePointer

  /// Whether this platform can open SQLite at all (Linux: whether `libsqlite3.so.0` was found).
  static var isAvailable: Bool { C.available }

  init(path: String) throws {
    guard C.available else { throw SQLiteError(description: "SQLite is not available (libsqlite3 was not found)") }
    var handle: OpaquePointer?
    let rc = C.open(path, &handle)
    guard rc == C.ok, let handle else {
      if let handle { C.close(handle) }
      throw SQLiteError(description: "cannot open \(path) (\(rc))")
    }
    db = handle
    C.busyTimeout(db, 5000)
  }

  deinit { C.close(db) }

  /// Runs every statement of `script`.
  func execute(_ script: String) throws {
    try script.withCString { start in
      var sql: UnsafePointer<CChar>? = start
      while let current = sql, current.pointee != 0 {
        var stmt: OpaquePointer?
        var tail: UnsafePointer<CChar>?
        guard C.prepare(db, current, &stmt, &tail) == C.ok else { throw SQLiteError(description: C.message(db)) }
        if let stmt {
          defer { C.finalize(stmt) }
          var rc = C.step(stmt)
          while rc == C.row { rc = C.step(stmt) }
          guard rc == C.done else { throw SQLiteError(description: C.message(db)) }
        }
        sql = tail
      }
    }
  }

  /// The rows of one statement with `params` bound.
  @discardableResult
  func query(_ sql: String, _ params: [SQLValue] = []) throws -> [[SQLValue]] {
    var stmt: OpaquePointer?
    var tail: UnsafePointer<CChar>?
    let rc = sql.withCString { C.prepare(db, $0, &stmt, &tail) }
    guard rc == C.ok, let stmt else { throw SQLiteError(description: C.message(db)) }
    defer { C.finalize(stmt) }
    for (i, p) in params.enumerated() {
      let at = Int32(i + 1)
      switch p {
      case .null: _ = C.bindNull(stmt, at)
      case .int(let v): _ = C.bindInt(stmt, at, v)
      case .text(let s): _ = C.bindText(stmt, at, s)
      }
    }
    var rows: [[SQLValue]] = []
    while true {
      let step = C.step(stmt)
      if step == C.done { break }
      guard step == C.row else { throw SQLiteError(description: C.message(db)) }
      var row: [SQLValue] = []
      for c in 0..<C.columnCount(stmt) {
        switch C.columnType(stmt, c) {
        case C.null: row.append(.null)
        case C.integer: row.append(.int(C.columnInt(stmt, c)))
        default: row.append(C.columnText(stmt, c).map(SQLValue.text) ?? .null)
        }
      }
      rows.append(row)
    }
    return rows
  }

  /// `body` in one transaction (rolled back when it throws).
  func transaction(_ body: () throws -> Void) throws {
    try execute("BEGIN")
    do {
      try body()
      try execute("COMMIT")
    } catch {
      try? execute("ROLLBACK")
      throw error
    }
  }
}
