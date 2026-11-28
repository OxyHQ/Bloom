import Foundation
import Testing
@testable import Bloom

@Suite struct URLTests {
  @Test func parsesAsJSURL() {
    for c in Fixtures.intl.urls.parsed {
      #expect(BloomURL.parse(c.text).map(\.parts) == c.parts.map(toParts), "\(c.text)")
    }
    for c in Fixtures.intl.urls.resolved {
      let base = BloomURL.parse(c.base!)!
      #expect(BloomURL.resolve(c.text, against: base).map(\.parts) == c.parts.map(toParts), "\(c.text)")
    }
  }

  @Test func componentsAsEncodeURIComponent() {
    for c in Fixtures.intl.urls.components {
      #expect(percentEncoded(c.text) == c.encoded, "\(c.text)")
      #expect(percentDecoded(c.text) == c.decoded, "\(c.text)")
    }
  }

  @Test func bloomMembers() throws {
    let api = try #require(BloomURL.parse("https://api.mention.earth/v1?z=0#top"))
    let feed = api.appending(path: "feeds/home page").appendingQuery(["cursor": "a b&c", "limit": "20"])
    #expect(feed.absoluteString == "https://api.mention.earth/v1/feeds/home%20page?z=0&cursor=a%20b%26c&limit=20#top")
    #expect(feed.queryItems == [
      BloomURLQueryItem(name: "z", value: "0"), BloomURLQueryItem(name: "cursor", value: "a b&c"), BloomURLQueryItem(name: "limit", value: "20"),
    ])
    #expect(feed.queryValue("cursor") == "a b&c")
    #expect(feed.queryValue("nope") == nil)
    #expect(feed.pathComponents == ["v1", "feeds", "home page"])
    #expect(feed.lastPathComponent == "home page")
    #expect(feed.port == nil && feed.scheme == "https" && feed.host == "api.mention.earth" && feed.fragment == "top")
    #expect(BloomURL.parse("http://a.b:8080/")?.port == 8080)
    #expect(api.foundationURL?.host == "api.mention.earth")
    #expect(BloomURL(Foundation.URL(string: "HTTPS://X.Y")!)?.absoluteString == "https://x.y/")
    #expect(JSON.encode(BloomURL.self, api) == #""https://api.mention.earth/v1?z=0#top""#)
    #expect(punycode("mañana") == "maana-pta")
  }

  private func toParts(_ p: IntlFixtures.Parts) -> URLParts {
    URLParts(href: p.href, scheme: p.scheme, host: p.host, port: p.port, path: p.path, query: p.query, fragment: p.fragment)
  }
}
