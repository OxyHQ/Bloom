import Foundation
import Testing
@testable import Bloom

struct Note: Codable, Equatable, Sendable {
  let id: String
  var likes: Int
  let createdAt: Date
  var pinned: Bool = false

  func liked(_ n: Int) -> Note {
    var out = self
    out.likes = n
    return out
  }
}

private struct Refused: Error {}

/// One database file for the suite (`BloomData.databaseURL` is global).
@Suite(.serialized) struct DataTests {
  init() {
    BloomData.databaseURL = temporaryDirectory("data").appendingPathComponent("bloom-data.db")
  }

  private func note(_ id: String, _ likes: Int, _ at: Double) -> Note { Note(id: id, likes: likes, createdAt: Date.fromMilliseconds(at)) }

  @Test func persistsAcrossLaunches() throws {
    #expect(SQLiteDatabase.isAvailable)
    let name = "Note\(UUID().uuidString.prefix(6))"
    let store: ModelStore<Note> = modelStore(name, key: \Note.id)
    let changes = Locked(0)
    let off = store.subscribe { changes.withLock { $0 += 1 } }
    store.insert(note("b", 1, 2000))
    store.insertAll([note("a", 5, 1000), note("c", 0, 3000)])
    #expect(store.update("a") { $0.liked(6) })
    #expect(!store.update("zz") { $0 })
    #expect(store.delete("c"))
    #expect(!store.delete("c"))
    off()
    store.insert(note("d", 0, 0))
    #expect(changes.withLock { $0 } == 4)
    #expect(store.all.map(\.id) == ["b", "a", "d"])
    BloomData.flush()

    // A new launch: the same name reads the stored records, in order.
    let again: ModelStore<Note> = modelStore(name, key: \Note.id)
    #expect(again.all.map(\.id) == ["b", "a", "d"])
    #expect(again.get("a")?.likes == 6)
    let memory: ModelStore<Note> = modelStore(name, key: \Note.id, persist: false)
    #expect(memory.all.isEmpty)
  }

  @Test func queries() {
    let store: ModelStore<Note> = modelStore("Q\(UUID().uuidString.prefix(6))", key: \Note.id)
    store.insertAll([note("a", 2, 3000), note("b", 9, 1000), Note(id: "c", likes: 2, createdAt: Date.fromMilliseconds(2000), pinned: true)])
    #expect(useQuery(store).map(\.id) == ["a", "b", "c"])
    #expect(useQuery(store, order: .reverse).map(\.id) == ["c", "b", "a"])
    #expect(useQuery(store, sort: \.createdAt).map(\.id) == ["b", "c", "a"])
    #expect(useQuery(store, sort: \.likes, order: .reverse).map(\.id) == ["b", "a", "c"])
    #expect(useQuery(store, sort: \.likes).map(\.id) == ["a", "c", "b"])
    #expect(useQuery(store, sort: \.pinned, order: .reverse).map(\.id) == ["c", "a", "b"])
    #expect(useQuery(store, filter: { $0.likes > 2 }).map(\.id) == ["b"])
    #expect(useRecordQuery(store, id: "b")?.likes == 9)
    #expect(useRecordQuery(store, id: nil) == nil)
  }

  @Test func mutationsLayerAndRollBack() async {
    let store: ModelStore<Note> = modelStore("M\(UUID().uuidString.prefix(6))", key: \Note.id)
    store.insert(note("a", 1, 0))
    let gate = TaskSignal()
    let fail = Mutation<String, Int>.make("like-fail", optimistic: { id in
      _ = store.update(id) { $0.liked(100) }
      store.insert(Note(id: "temp", likes: 0, createdAt: Date.fromMilliseconds(0)))
    }) { _ in
      while !gate.aborted { try await Task.sleep(for: .milliseconds(2)) }
      throw Refused()
    }
    let running = Task { await fail.run("a") }
    while store.get("a")?.likes != 100 || store.get("temp") == nil { await Task.yield() }
    #expect(store.all.map(\.id) == ["a", "temp"])
    // A server write meanwhile changes the record beneath the layer.
    store.insert(note("a", 7, 0))
    #expect(store.get("a")?.likes == 100)
    gate.cancel()
    #expect(await running.value == nil)
    #expect(store.get("a")?.likes == 7)
    #expect(store.get("temp") == nil)

    let ok = Mutation<String, String>.make("like", optimistic: { id in _ = store.update(id) { $0.liked(8) } }) { id in "done \(id)" }
    #expect(await ok.run("a") == "done a")
    #expect(store.get("a")?.likes == 8)
    let plain = Mutation<Int, Int>.make("double") { $0 * 2 }
    #expect(await plain.run(4) == 8)
  }

  @Test func sourcesPage() async {
    let name = "S\(UUID().uuidString.prefix(6))"
    let store: ModelStore<Note> = modelStore(name, key: \Note.id)
    let pages: [String?: SourcePage<Note>] = [
      nil: SourcePage(items: [note("1", 0, 0), note("2", 0, 0)], next: "p2"),
      "p2": SourcePage(items: [note("2", 5, 0), note("3", 0, 0)], next: nil),
    ]
    let home = Source.make(store, name: "home") { cursor, _ in pages[cursor]! }
    await home.refresh()
    #expect(home.items.map(\.id) == ["1", "2"])
    #expect(home.hasMore)
    await home.loadMore()
    #expect(home.items.map(\.id) == ["1", "2", "3"])
    #expect(home.items[1].likes == 5)
    #expect(!home.hasMore)
    await home.loadMore()
    await home.refresh()
    #expect(useSource(home).map(\.id) == ["1", "2"])
    BloomData.flush()
    let again = Source.make(modelStore(name, key: \Note.id) as ModelStore<Note>, name: "home") { _, _ in throw Refused() }
    #expect(again.items.map(\.id) == ["1", "2"])
    await again.refresh()
    #expect(again.items.map(\.id) == ["1", "2"])
  }

  @Test func realtimeWritesIntoStores() {
    final class Socket: EventSocket, @unchecked Sendable {
      let listeners = Locked([String: @Sendable (JSONValue) -> Void]())
      func on(_ event: String, _ listener: @escaping @Sendable (JSONValue) -> Void) -> @Sendable () -> Void {
        listeners.withLock { $0[event] = listener }
        return { [listeners] in _ = listeners.withLock { $0.removeValue(forKey: event) } }
      }
      func emit(_ event: String, _ payload: JSONValue) { listeners.withLock { $0[event] }?(payload) }
    }
    let store: ModelStore<Note> = modelStore("R\(UUID().uuidString.prefix(6))", key: \Note.id)
    let socket = Socket()
    let live = Realtime.listen(socket, ["note": { payload in
      if let n = try? Note.decode(payload, "note") { store.insert(n) }
    }])
    socket.emit("note", ["id": "x", "likes": 1, "createdAt": 0, "pinned": false])
    #expect(store.get("x")?.likes == 1)
    live.cancel()
    socket.emit("note", ["id": "y", "likes": 1, "createdAt": 0])
    #expect(store.get("y") == nil)
  }
}
