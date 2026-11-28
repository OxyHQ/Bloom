import Foundation
import Testing
@testable import Bloom

/// The preferred locale and the catalogs are global: one test reads and writes them.
@Suite(.serialized) struct LocalizationTests {
  @Test func localizesAsTheRuntime() {
    registerLocalizations("en", ["feed.title": "Home", "feed.count": ["one": "{count} post", "other": "{count} posts"], "greeting": "Hello, {name}! {missing} {count}"])
    registerLocalizations("es", ["feed.title": "Inicio", "feed.count": ["one": "{count} publicación", "many": "{count} de publicaciones", "other": "{count} publicaciones"]])
    registerLocalizations("es-MX", ["feed.title": "Inicio (MX)"])
    registerLocalizations("ar", ["feed.count": ["zero": "لا منشورات", "one": "منشور", "two": "منشوران", "few": "{count} منشورات", "many": "{count} منشورًا", "other": "{count} منشور"]])
    for c in Fixtures.intl.localized {
      BloomLocale.prefer(BloomLocale(identifier: c.locale))
      #expect(String.localized(c.key, args: OrderedDictionary(c.args), count: c.count) == c.text, "\(c.locale) \(c.key) \(String(describing: c.count))")
    }
    BloomLocale.prefer(BloomLocale(identifier: "es-ES"))
    #expect(BloomLocale.current.identifier == "es-ES")
    #expect(BloomLocale.current.languageCode == "es")
    #expect(BloomLocale.current.regionCode == "ES")
    #expect(BloomLocale(identifier: "ja").regionCode == nil)
    #expect(BloomLocale(identifier: "ru").pluralCategory(22) == "few")
    BloomLocale.prefer(BloomLocale(identifier: ""))
    #expect(!BloomLocale.current.identifier.isEmpty)
  }
}

@Suite(.serialized) struct LoggerTests {
  @Test func sinkSeesLines() {
    let lines = Locked([String]())
    Logger.setSink { level, subsystem, category, message in lines.withLock { $0.append("\(level) \(subsystem):\(category) \(message)") } }
    defer { Logger.setSink(nil) }
    let log = Logger(subsystem: "mention", category: "feed")
    log.info("loaded")
    log.error("failed")
    log.debug("detail")
    Bloom.print("printed")
    let expected = ["info mention:feed loaded", "error mention:feed failed"] + (Logger.isDevelopment ? ["debug mention:feed detail"] : []) + ["info print: printed"]
    #expect(lines.withLock { $0 } == expected)
    #expect(Logger(subsystem: "a") == Logger(subsystem: "a", category: ""))
  }
}
