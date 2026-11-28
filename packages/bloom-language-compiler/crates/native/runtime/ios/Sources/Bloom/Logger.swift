// Bloom: `Logger`, levelled logs for a subsystem and category. Lines go to `os.Logger` on Apple
// platforms and to standard error elsewhere, unless a sink is installed (a crash reporter, a
// test): `Logger.setSink(_:)`, the runtime's `setLogSink`. `debug` lines are dropped outside
// debug builds.
import Foundation

#if canImport(os)
import os
#endif

/// How severe a log line is.
public enum LogLevel: String, Sendable, Hashable, CaseIterable {
  case debug
  case info
  case notice
  case warning
  case error
  case fault
}

/// Logs for one part of an app. (Bloom's own type: Apple's `os.Logger` has the same
/// initializer and methods, and is where these lines go on Apple platforms.)
public struct Logger: Equatable, Hashable, Sendable {
  /// The app or library (`mention`).
  public let subsystem: String
  /// The part of it (`feed`, `auth`).
  public var category: String = ""

  public init(subsystem: String, category: String = "") {
    self.subsystem = subsystem
    self.category = category
  }

  /// Where every line goes instead of the console (`level`, `subsystem`, `category`, `message`).
  public typealias Sink = @Sendable (String, String, String, String) -> Void

  private static let sink = Locked<Sink?>(nil)

  /// Routes every line to `next` (a crash reporter, a test); `nil` restores the console.
  public static func setSink(_ next: Sink?) { sink.withLock { $0 = next } }

  /// Whether this is a development build (`debug` lines are kept).
  public static var isDevelopment: Bool {
    #if DEBUG
    return true
    #else
    return false
    #endif
  }

  /// A line at `level`.
  public func log(_ level: LogLevel, _ message: String) {
    if level == .debug && !Logger.isDevelopment { return }
    logLine(level.rawValue, subsystem, category, message)
  }

  /// Detail for development: dropped from release builds.
  public func debug(_ message: String) { log(.debug, message) }

  /// What happened, for following along.
  public func info(_ message: String) { log(.info, message) }

  /// Worth noticing, not wrong.
  public func notice(_ message: String) { log(.notice, message) }

  /// Something went wrong and was recovered from.
  public func warning(_ message: String) { log(.warning, message) }

  /// Something failed.
  public func error(_ message: String) { log(.error, message) }

  /// A bug: a state the code holds impossible.
  public func fault(_ message: String) { log(.fault, message) }

  static func emit(_ level: String, _ subsystem: String, _ category: String, _ message: String) {
    if let sink = sink.withLock({ $0 }) {
      sink(level, subsystem, category, message)
      return
    }
    #if canImport(os)
    let logger = os.Logger(subsystem: subsystem, category: category)
    switch level {
    case "debug": logger.debug("\(message, privacy: .public)")
    case "info": logger.info("\(message, privacy: .public)")
    case "notice": logger.notice("\(message, privacy: .public)")
    case "warning": logger.warning("\(message, privacy: .public)")
    case "error": logger.error("\(message, privacy: .public)")
    default: logger.fault("\(message, privacy: .public)")
    }
    #else
    let line = "[\(subsystem)\(category.isEmpty ? "" : ":\(category)")] \(message)\n"
    FileHandle.standardError.write(Data(line.utf8))
    #endif
  }
}

/// The runtime's `logLine`.
func logLine(_ level: String, _ subsystem: String, _ category: String, _ message: String) {
  Logger.emit(level, subsystem, category, message)
}

/// Writes `message` as an `info` line of the `print` subsystem (Bloom's `print`, which a sink
/// sees; Swift's `print(_:)` of other values is unchanged).
public func print(_ message: String) { logLine("info", "print", "", message) }
