import Foundation
import Testing
@testable import Bloom

func temporaryDirectory(_ name: String) -> URL {
  let dir = FileManager.default.temporaryDirectory.appendingPathComponent("bloom-tests-\(name)-\(UUID().uuidString)", isDirectory: true)
  try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
  return dir
}

@Suite struct StorageTests {
  struct Draft: Codable, Equatable { let text: String; let at: Date }

  @Test func keyValueFilePersists() throws {
    let dir = temporaryDirectory("kv")
    let first = JSONFileStorage(directory: dir)
    first.set("settings", "likes", "true")
    first.set("settings", "name", "Ana")
    first.set("other", "likes", "x")
    first.set("settings", "name", nil)
    let reopened = JSONFileStorage(directory: dir)
    #expect(reopened.get("settings", "likes") == "true")
    #expect(reopened.get("settings", "name") == nil)
    #expect(reopened.keys("settings") == ["likes"])
    #expect(reopened.get("other", "likes") == "x")
  }

  @Test func storesOverInstalledBackends() {
    let kv = MemoryStorage()
    BloomStorage.setBackend(kv, for: "kv")
    let prefs = KeyValueStore(name: "settings-\(UUID().uuidString)")
    prefs.setBool(true, for: "a")
    prefs.setNumber(1.5, for: "n")
    prefs.setNumber(2, for: "i")
    prefs.set("x", for: "s")
    #expect(prefs.bool("a") == true)
    #expect(prefs.double("n") == 1.5)
    #expect(prefs.string("i") == "2")
    #expect(prefs.int("i") == 2)
    #expect(prefs.int("s") == nil)
    let draft = Draft(text: "hi", at: Date.fromMilliseconds(0))
    prefs.setValue(Draft.self, draft, for: "draft")
    #expect(prefs.string("draft") == #"{"text":"hi","at":"1970-01-01T00:00:00.000Z"}"#)
    #expect(prefs.value(Draft.self, for: "draft") == draft)
    #expect(prefs.value(Draft.self, for: "s") == nil)
    #expect(prefs.keys == ["a", "n", "i", "s", "draft"])
    prefs.remove("a")
    #expect(prefs.bool("a") == nil)
    prefs.clear()
    #expect(prefs.keys.isEmpty)

    BloomStorage.setBackend(MemoryStorage(), for: "secure")
    let tokens = SecureStore(name: "session")
    tokens.set("t0k", for: "access")
    #expect(tokens.string("access") == "t0k")
    tokens.remove("access")
    #expect(tokens.string("access") == nil)
  }

  @Test func filesUnderTheirStore() {
    let backend = FileStorage(directory: temporaryDirectory("files"))
    backend.set("cache/v1", "feeds/home.json", "{}")
    backend.set("cache/v1", "a b", "x")
    #expect(backend.get("cache/v1", "feeds/home.json") == "{}")
    #expect(Set(backend.keys("cache/v1")) == ["feeds/home.json", "a b"])
    backend.set("cache/v1", "a b", nil)
    #expect(backend.keys("cache/v1") == ["feeds/home.json"])
    BloomStorage.setBackend(backend, for: "file")
    let files = FileStore(name: "docs")
    files.write("text", to: "n.txt")
    #expect(files.read("n.txt") == "text")
    #expect(files.paths == ["n.txt"])
    files.delete("n.txt")
    #expect(files.read("n.txt") == nil)
  }
}
