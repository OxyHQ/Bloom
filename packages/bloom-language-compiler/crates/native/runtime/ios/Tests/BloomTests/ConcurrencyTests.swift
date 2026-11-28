import Foundation
import Testing
@testable import Bloom

private struct Boom: Error, Equatable {}

@Suite struct Concurrency {
  @Test func runGivesTheTaskItsSignal() async throws {
    let started = TaskSignal()
    let task = Task.run { signal in
      started.cancel()
      try await sleep(for: .seconds(10), cancellation: signal)
      return 1
    }
    while !started.aborted { await Task.yield() }
    task.cancel()
    #expect(task.isCancelled)
    await #expect(throws: CancellationError.self) { try await task.value() }
  }

  @Test func valueIsTheResult() async throws {
    let task = Task.run { _ in 41 + 1 }
    #expect(try await task.value() == 42)
  }

  /// `await Task.cancellation` returns once the task is cancelled, and its `defer` runs then
  /// (React's effect cleanup); a task cancelled before it waits returns at once.
  @Test func cancellationReturnsWhenTheTaskIsCancelled() async throws {
    let stopped = Locked(false)
    let task = Task {
      defer { stopped.withLock { $0 = true } }
      await Task.cancellation
    }
    try await Task.sleep(for: .milliseconds(20))
    #expect(!stopped.withLock { $0 })
    task.cancel()
    await task.value
    #expect(stopped.withLock { $0 })
    let early = Task {
      withUnsafeCurrentTask { $0?.cancel() }
      await Task.cancellation
      return true
    }
    #expect(await early.value)
  }

  @Test func sleepStopsWhenItsSignalFires() async throws {
    let signal = TaskSignal()
    let clock = ContinuousClock.now
    Task {
      try await Task.sleep(for: .milliseconds(20))
      signal.cancel()
    }
    do {
      try await sleep(for: .seconds(5), cancellation: signal)
      Issue.record("slept through the signal")
    } catch {
      #expect(isCancelled(error))
    }
    #expect(clock.elapsed < .seconds(2))
    try await sleep(for: .milliseconds(1))
    try await sleep(for: .milliseconds(-5))
  }

  @Test func signalRunsHandlersOnce() {
    let signal = TaskSignal()
    let count = Locked(0)
    let off = signal.onCancel { count.withLock { $0 += 1 } }
    let removed = signal.onCancel { count.withLock { $0 += 100 } }
    removed()
    signal.cancel()
    signal.cancel()
    off()
    signal.onCancel { count.withLock { $0 += 10 } }
    #expect(count.withLock { $0 } == 11)
  }

  @Test func groupGathersInOrder() async throws {
    let group = BloomTaskGroup<Int>.map([30, 10, 20]) { ms in
      try await sleep(for: .milliseconds(Double(ms)))
      return ms
    }
    #expect(try await group.values() == [30, 10, 20])
    let started = BloomTaskGroup<String>.start([{ _ in "a" }, { _ in "b" }])
    #expect(try await started.values() == ["a", "b"])
  }

  @Test func groupThrowsTheFirstFailureAndCancelsTheRest() async {
    let slowCancelled = Locked(false)
    let group = BloomTaskGroup<Int>.start([
      { signal in
        do {
          try await sleep(for: .seconds(5), cancellation: signal)
        } catch {
          slowCancelled.withLock { $0 = true }
          throw error
        }
        return 1
      },
      { _ in throw Boom() },
    ])
    await #expect(throws: Boom.self) { try await group.values() }
    for _ in 0..<200 where !slowCancelled.withLock({ $0 }) { try? await Task.sleep(for: .milliseconds(5)) }
    #expect(slowCancelled.withLock { $0 })
  }

  @Test func streamBroadcasts() async {
    let stream = BloomAsyncStream<Int>.make()
    let a = Locked([Int]())
    let b = Locked([Int]())
    let finished = Locked(0)
    let offA = stream.subscribe({ v in a.withLock { $0.append(v) } }, onFinish: { finished.withLock { $0 += 1 } })
    stream.subscribe({ v in b.withLock { $0.append(v) } }, onFinish: { finished.withLock { $0 += 1 } })
    stream.yield(1)
    offA()
    stream.yield(2)
    stream.finish()
    stream.yield(3)
    stream.subscribe({ _ in }, onFinish: { finished.withLock { $0 += 1 } })
    #expect(a.withLock { $0 } == [1])
    #expect(b.withLock { $0 } == [1, 2])
    #expect(finished.withLock { $0 } == 2)

    let s2 = BloomAsyncStream<String>()
    let reader = Task { () -> [String] in
      var out: [String] = []
      for await x in s2.values { out.append(x) }
      return out
    }
    try? await Task.sleep(for: .milliseconds(20))
    s2.yield("x")
    s2.yield("y")
    s2.finish()
    #expect(await reader.value == ["x", "y"])
  }

  @Test func actorHelpersRunTheWork() async throws {
    actor Counter {
      var n = 0
      func bump() async -> Int {
        await actorIsolated(self) {
          n += 1
          return n
        }
      }
    }
    let c = Counter()
    #expect(await c.bump() == 1)
    #expect(await actorIsolatedAsync(c) { await c.bump() } == 2)
    await #expect(throws: Boom.self) { try await actorIsolatedThrowing(c) { throw Boom() } }
    #expect(try await actorIsolatedAsyncThrowing(c) { 7 } == 7)
  }

  @Test func cancellationIsRecognised() {
    #expect(isCancelled(CancellationError()))
    #expect(isCancelled(URLError(.cancelled)))
    #expect(!isCancelled(Boom()))
  }
}
