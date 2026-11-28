// Bloom (concurrency): `Task.run`, `TaskSignal`, `sleep(for:cancellation:)`, task groups,
// broadcast streams and the actor helpers, on Swift's own structured concurrency.
//
// Bloom's `Task<T>` is Swift's `Task<T, any Error>`; `cancel()` and `isCancelled` are
// Swift's own. A `TaskSignal` is Bloom's cancellation token (JS's `AbortSignal`): `Task.run`
// gives its work one that fires when the task is cancelled, and `HTTPClient` and
// `sleep(for:cancellation:)` stop when the one they are given fires. Inside a task, Swift's
// own cancellation already reaches them, so `cancellation:` may be left out.
import Foundation

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// A cancellation signal: what `Task.run` gives its work, and `Task.signal` in `.task { }`.
public final class TaskSignal: @unchecked Sendable {
  private struct State {
    var aborted = false
    var next = 0
    var handlers: [Int: @Sendable () -> Void] = [:]
  }

  private let state = Locked(State())
  /// Also aborted when the task reading it is cancelled (`Task.signal`).
  private let followsCurrentTask: Bool

  public init() { followsCurrentTask = false }

  init(followingCurrentTask: Bool) { followsCurrentTask = followingCurrentTask }

  /// Whether the signal fired (JS's `aborted`).
  public var aborted: Bool {
    state.withLock { $0.aborted } || (followsCurrentTask && Task.isCancelled)
  }

  /// Whether the signal fired.
  public var isCancelled: Bool { aborted }

  /// Fires the signal: every `onCancel` handler runs once.
  public func cancel() {
    let handlers = state.withLock { s -> [@Sendable () -> Void] in
      if s.aborted { return [] }
      s.aborted = true
      defer { s.handlers = [:] }
      return s.handlers.sorted { $0.key < $1.key }.map(\.value)
    }
    for handler in handlers { handler() }
  }

  /// Runs `handler` when the signal fires (at once when it has); returns the unsubscribe.
  @discardableResult
  public func onCancel(_ handler: @escaping @Sendable () -> Void) -> @Sendable () -> Void {
    let id = state.withLock { s -> Int? in
      if s.aborted { return nil }
      s.next += 1
      s.handlers[s.next] = handler
      return s.next
    }
    guard let id else {
      handler()
      return {}
    }
    return { [state] in _ = state.withLock { $0.handlers.removeValue(forKey: id) } }
  }

  /// Throws a `CancellationError` when the signal fired.
  public func checkCancellation() throws {
    if aborted { throw CancellationError() }
  }
}

extension Task where Success == Never, Failure == Never {
  /// The running task's cancellation as a `TaskSignal` (what `.task { }` passes as
  /// `Task.signal`): aborted once the task reading it is cancelled.
  public static var signal: TaskSignal { TaskSignal(followingCurrentTask: true) }
}

extension Task where Failure == any Error {
  /// Starts `work` now; it receives the task's cancellation signal, which fires when the task
  /// is cancelled (`cancel()`).
  @discardableResult
  public static func run(_ work: sending @escaping @isolated(any) (TaskSignal) async throws -> Success) -> Task<Success, any Error> {
    Task {
      let signal = TaskSignal()
      return try await withTaskCancellationHandler {
        try await work(signal)
      } onCancel: {
        signal.cancel()
      }
    }
  }

  /// The task's result, or what it threw (Swift's `value`, as Bloom calls it).
  public func value() async throws -> Success { try await self.value }
}

/// Waits `duration`; throws a `CancellationError` when `cancellation` fires (or the task is
/// cancelled) first. A negative duration waits for nothing.
public func sleep(for duration: Duration, cancellation: TaskSignal? = nil) async throws {
  let wait = duration < .zero ? .zero : duration
  guard let signal = cancellation else {
    try await Task.sleep(for: wait)
    return
  }
  try signal.checkCancellation()
  let sleeper = Task { try await Task.sleep(for: wait) }
  let off = signal.onCancel { sleeper.cancel() }
  defer { off() }
  try await withTaskCancellationHandler {
    try await sleeper.value
  } onCancel: {
    sleeper.cancel()
  }
}

/// Whether `error` is a task's cancellation (not a failure to report): Swift's
/// `CancellationError`, or a cancelled URL request.
public func isCancelled(_ error: any Error) -> Bool {
  if error is CancellationError { return true }
  if let url = error as? URLError, url.code == .cancelled { return true }
  let ns = error as NSError
  return ns.domain == NSURLErrorDomain && ns.code == NSURLErrorCancelled
}

// MARK: - TaskGroup

/// Bloom's `TaskGroup`: tasks started now, their results gathered in order. (Swift's own
/// `TaskGroup` only lives inside `withTaskGroup`; this one is a value, as Bloom's is.)
public struct BloomTaskGroup<Element: Sendable>: Sendable {
  public let tasks: [Task<Element, any Error>]

  public init(tasks: [Task<Element, any Error>]) { self.tasks = tasks }

  /// Starts every one of `works` now.
  public static func start(_ works: [@Sendable (TaskSignal) async throws -> Element]) -> BloomTaskGroup<Element> {
    BloomTaskGroup(tasks: works.map { work in Task.run { signal in try await work(signal) } })
  }

  /// `transform` of each of `items`, run concurrently; the results in `items`' order.
  public static func map<T: Sendable>(_ items: [T], _ transform: @escaping @Sendable (T) async throws -> Element) -> BloomTaskGroup<Element> {
    BloomTaskGroup(tasks: items.map { item in Task.run { _ in try await transform(item) } })
  }

  /// Every result, in order; the first failure (the first to happen, as `Promise.all`)
  /// cancels the others and is thrown.
  public func values() async throws -> [Element] {
    let tasks = self.tasks
    do {
      return try await withThrowingTaskGroup(of: (Int, Element).self) { group in
        for (i, task) in tasks.enumerated() {
          // The group's cancellation (a sibling's failure) reaches the task itself.
          group.addTask { (i, try await withTaskCancellationHandler { try await task.value } onCancel: { task.cancel() }) }
        }
        var out = [Element?](repeating: nil, count: tasks.count)
        for try await (i, value) in group { out[i] = value }
        return out.map { $0! }
      }
    } catch {
      cancelAll()
      throw error
    }
  }

  /// Cancels every task.
  public func cancelAll() {
    for task in tasks { task.cancel() }
  }
}

// MARK: - AsyncStream

/// Bloom's `AsyncStream`: values over time, to every subscriber (a broadcast channel: what a
/// socket or a sensor sends). Swift's `AsyncStream` has one consumer and no `subscribe`;
/// `values` gives one as a Swift `AsyncStream` for `for await`.
public final class BloomAsyncStream<Element: Sendable>: @unchecked Sendable {
  private struct Listener {
    let each: @Sendable (Element) -> Void
    let done: @Sendable () -> Void
  }

  private struct State {
    var finished = false
    var next = 0
    var listeners: [Int: Listener] = [:]
  }

  private let state = Locked(State())

  public init() {}

  /// A stream nothing has been sent on yet.
  public static func make() -> BloomAsyncStream<Element> { BloomAsyncStream() }

  /// Sends `value` to every subscriber (nothing once finished).
  public func yield(_ value: Element) {
    let listeners = state.withLock { s in s.finished ? [] : s.listeners.sorted { $0.key < $1.key }.map(\.value) }
    for l in listeners { l.each(value) }
  }

  /// Ends the stream: subscribers get `onFinish`, and later ones get it at once.
  public func finish() {
    let listeners = state.withLock { s -> [Listener] in
      if s.finished { return [] }
      s.finished = true
      defer { s.listeners = [:] }
      return s.listeners.sorted { $0.key < $1.key }.map(\.value)
    }
    for l in listeners { l.done() }
  }

  /// Calls `each` with every value sent from now on; returns the unsubscribe.
  @discardableResult
  public func subscribe(_ each: @escaping @Sendable (Element) -> Void, onFinish: @escaping @Sendable () -> Void = {}) -> @Sendable () -> Void {
    let id = state.withLock { s -> Int? in
      if s.finished { return nil }
      s.next += 1
      s.listeners[s.next] = Listener(each: each, done: onFinish)
      return s.next
    }
    guard let id else {
      onFinish()
      return {}
    }
    return { [state] in _ = state.withLock { $0.listeners.removeValue(forKey: id) } }
  }

  /// The values sent from now on, as a Swift `AsyncStream` (`for await x in stream.values`).
  public var values: AsyncStream<Element> {
    AsyncStream { continuation in
      let off = subscribe({ continuation.yield($0) }, onFinish: { continuation.finish() })
      continuation.onTermination = { _ in off() }
    }
  }
}

// MARK: - Actors

// Bloom's `actor` is Swift's `actor`, so an actor's methods are isolated by Swift itself and
// the emitter needs none of these. They exist so code written against the TS lowering
// compiles: each runs `work` where the caller is isolated, at once.

/// Runs `work` (an actor method's body).
public func actorIsolated<A, T>(_ actor: A, _ work: () -> T, isolation: isolated (any Actor)? = #isolation) async -> T {
  work()
}

/// `actorIsolated` for a method that throws.
public func actorIsolatedThrowing<A, T>(_ actor: A, _ work: () throws -> T, isolation: isolated (any Actor)? = #isolation) async throws -> T {
  try work()
}

/// `actorIsolated` for an `async` method.
public func actorIsolatedAsync<A, T>(_ actor: A, _ work: () async -> T, isolation: isolated (any Actor)? = #isolation) async -> T {
  await work()
}

/// `actorIsolatedAsync` for a method that throws.
public func actorIsolatedAsyncThrowing<A, T>(_ actor: A, _ work: () async throws -> T, isolation: isolated (any Actor)? = #isolation) async throws -> T {
  try await work()
}
