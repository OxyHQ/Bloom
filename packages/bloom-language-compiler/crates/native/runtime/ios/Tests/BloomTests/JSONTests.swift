import Foundation
import Testing
@testable import Bloom

enum Kind: BloomCaseCodable, Equatable {
  case post, reply
}

struct Author: Codable, Equatable, Sendable {
  let id: String
  let name: String
}

struct Post: Codable, Equatable, Sendable {
  let id: String
  let createdAt: Date
  var likes: Int = 0
  let replyTo: String?
  let kind: Kind
  let author: Author
  let tags: [String]
  let link: BloomURL?
  let extra: OrderedDictionary<String, Double>

  enum CodingKeys: String, CodingKey {
    case id
    case createdAt = "created_at"
    case likes, replyTo, kind, author, tags, link, extra
  }

  init(id: String, createdAt: Date, likes: Int, replyTo: String?, kind: Kind, author: Author, tags: [String], link: BloomURL?, extra: OrderedDictionary<String, Double>) {
    self.id = id
    self.createdAt = createdAt
    self.likes = likes
    self.replyTo = replyTo
    self.kind = kind
    self.author = author
    self.tags = tags
    self.link = link
    self.extra = extra
  }

  // What the emitter writes for a field with a default: absent (or null) takes it.
  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    id = try c.decode(String.self, forKey: .id)
    createdAt = try c.decode(Date.self, forKey: .createdAt)
    likes = try c.decodeIfPresent(Int.self, forKey: .likes) ?? 0
    replyTo = try c.decodeIfPresent(String.self, forKey: .replyTo)
    kind = try c.decode(Kind.self, forKey: .kind)
    author = try c.decode(Author.self, forKey: .author)
    tags = try c.decode([String].self, forKey: .tags)
    link = try c.decodeIfPresent(BloomURL.self, forKey: .link)
    extra = try c.decode(OrderedDictionary<String, Double>.self, forKey: .extra)
  }
}

@Suite struct JSONTests {
  @Test func stringifyAsJS() throws {
    for c in Fixtures.intl.json {
      #expect(JSON.stringify(try JSON.parse(c.value), indent: c.indent) == c.text)
    }
    #expect(JSON.stringify(.absent) == "null")
    #expect(JSON.stringify(.number(.nan)) == "null")
    #expect(JSON.stringify(["a": .absent, "b": [.absent]]) == #"{"b":[null]}"#)
  }

  @Test func parseIsStrict() throws {
    for bad in ["", "{", "[1,]", "{\"a\":1,}", "01", "1.", "'a'", "nul", "[1] x", "\"\u{01}\"", "NaN", "{a:1}"] {
      #expect(throws: JSONSyntaxError.self, "\(bad)") { try JSON.parse(bad) }
    }
    #expect(try JSON.parse(#"{"a":1,"b":2,"a":3}"#) == ["a": 3, "b": 2])
    #expect(try JSON.parse(#"{"a":1,"b":2,"a":3}"#).objectValue?.keys == ["a", "b"])
    #expect(try JSON.parse(#""é😀\n""#) == .string("é😀\n"))
    #expect(try JSON.parse(" [ 1e3 , -0.5 , true , null ] ") == [1000, -0.5, true, nil])
  }

  @Test func codableWireFormat() throws {
    let post = Post(
      id: "p1", createdAt: Date.fromMilliseconds(1_795_717_800_000), likes: 3, replyTo: nil, kind: .reply,
      author: Author(id: "u1", name: "Ana"), tags: ["a"], link: BloomURL.parse("HTTPS://Oxy.so"), extra: ["z": 1, "a": 2.5])
    let text = JSON.encode(Post.self, post)
    #expect(text == #"{"id":"p1","created_at":"2026-11-26T18:30:00.000Z","likes":3,"kind":"reply","author":{"id":"u1","name":"Ana"},"tags":["a"],"link":"https://oxy.so/","extra":{"z":1,"a":2.5}}"#)
    #expect(try JSON.decode(Post.self, from: text) == post)
    let bare = try JSON.decode(Post.self, from: #"{"id":"p","created_at":1795717800000,"replyTo":null,"kind":"post","author":{"id":"u","name":"n"},"tags":[],"extra":{}}"#)
    #expect(bare.likes == 0 && bare.replyTo == nil && bare.createdAt.millisecondsSince1970 == 1_795_717_800_000)
    #expect(try JSON.decode(Int.self, from: "2.0") == 2)
  }

  @Test func errorsNameTheField() {
    func message(_ text: String) -> String {
      do {
        _ = try JSON.decode(Post.self, from: text)
        return "decoded"
      } catch let e as BloomDecodingError {
        return e.message
      } catch {
        return "other: \(error)"
      }
    }
    let base = #""id":"p","created_at":"2026-11-26T18:30:00Z","kind":"post","author":{"id":"u","name":"n"},"tags":[],"extra":{}"#
    #expect(message("[]") == "JSON: expected an object, found an array")
    #expect(message("{\(base),\"likes\":\"3\"}") == "Post.likes: expected an integer, found a string")
    #expect(message("{\(base),\"likes\":2.5}") == "Post.likes: expected an integer, found a number")
    #expect(message(#"{"id":"p","created_at":"soon","kind":"post","author":{"id":"u","name":"n"},"tags":[],"extra":{}}"#) == "Post.created_at: expected an ISO 8601 date, found a string")
    #expect(message(#"{"id":"p","created_at":true,"kind":"post","author":{"id":"u","name":"n"},"tags":[],"extra":{}}"#) == "Post.created_at: expected a date, found a boolean")
    #expect(message(#"{"id":"p","created_at":1,"kind":"story","author":{"id":"u","name":"n"},"tags":[],"extra":{}}"#) == #"Post.kind: expected one of "post", "reply", found a string"#)
    #expect(message(#"{"id":"p","created_at":1,"kind":"post","author":{"id":"u"},"tags":[],"extra":{}}"#) == "Author.name: expected a string, found nothing")
    #expect(message(#"{"id":"p","created_at":1,"kind":"post","author":"u","tags":[],"extra":{}}"#) == "Post.author: expected an object, found a string")
    #expect(message(#"{"id":"p","created_at":1,"kind":"post","author":{"id":"u","name":"n"},"tags":[1],"extra":{}}"#) == "Post.tags: expected a string, found a number")
    #expect(message(#"{"id":"p","created_at":1,"kind":"post","author":{"id":"u","name":"n"},"tags":[],"extra":{"a":"x"}}"#) == "Post.extra: expected a number, found a string")
    #expect(message(#"{"id":null,"created_at":1,"kind":"post","author":{"id":"u","name":"n"},"tags":[],"extra":{}}"#) == "Post.id: expected a string, found null")
  }

  @Test func derivedCodeEntryPoints() throws {
    #expect(try String.decode(.string("x"), "at") == "x")
    #expect(Int.encode(3) == .number(3))
    #expect(Array.codec(Author.self) == [Author].self)
    #expect(try Array<Int>.decode([1, 2], "xs") { v, at in try Int.decode(v, at) } == [1, 2])
    #expect(Optional<Int>.encode(nil) { .number(Double($0)) } == .absent)
    #expect(try jsonField(["a": 1], "b", "T") == .absent)
    #expect(throws: BloomDecodingError(at: "T", expected: "an object", found: "a number")) { try jsonField(1, "b", "T") }
    #expect(jsonObject(["a": 1, "b": .absent]) == ["a": 1])
    #expect(try decodeCase(.string("post"), "k", Kind.allCases, "one of") == .post)
    #expect(encodeCase(Kind.reply) == "reply")
    let data = try BloomJSON.encoder.encode(Author(id: "a/b", name: "é"))
    #expect(String(decoding: data, as: UTF8.self) == #"{"id":"a/b","name":"é"}"#)
    #expect(try BloomJSON.decoder.decode(Author.self, from: data) == Author(id: "a/b", name: "é"))
    struct Stamp: Codable { let at: Date }
    let viaFoundation = try BloomJSON.foundationDecoder.decode(Stamp.self, from: Data(#"{"at":"2026-11-26T18:30:00.000Z"}"#.utf8))
    #expect(viaFoundation.at.millisecondsSince1970 == 1_795_717_800_000)
    let swiftDictionary = JSON.encode([String: Int].self, ["b": 1, "a": 2])
    #expect(swiftDictionary == #"{"a":2,"b":1}"#)
    #expect(JSON.encode(JSONValue.self, ["x": [1, "y", nil]], indent: 2) == "{\n  \"x\": [\n    1,\n    \"y\",\n    null\n  ]\n}")
  }
}
