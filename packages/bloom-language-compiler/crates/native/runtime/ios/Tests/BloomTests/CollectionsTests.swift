import Foundation
import Testing
@testable import Bloom

@Suite struct OrderedCollections {
  @Test func dictionaryKeepsInsertionOrder() {
    var d: OrderedDictionary<String, Int> = ["b": 1, "a": 2]
    d["c"] = 3
    d["b"] = 9
    #expect(d.keys == ["b", "a", "c"])
    #expect(d.values == [9, 2, 3])
    d["a"] = nil
    #expect(d.keys == ["b", "c"])
    #expect(d.count == 2 && !d.isEmpty)
    #expect(d.map(\.key) == ["b", "c"])
    #expect(d.entries.map(\.0) == ["b", "c"])
  }

  @Test func stringKeysOrderAsAJSObject() {
    let d: OrderedDictionary<String, Int> = ["b": 1, "10": 2, "a": 3, "2": 4, "01": 5, "-1": 6]
    #expect(d.keys == ["2", "10", "b", "a", "01", "-1"])
  }

  @Test func membersReturnValues() {
    let d: OrderedDictionary<String, Int> = ["x": 1, "y": 2]
    #expect(d.setting("z", 3).keys == ["x", "y", "z"])
    #expect(d.setting("x", 5).values == [5, 2])
    #expect(d.removing("x").keys == ["y"])
    #expect(d.mapValues { $0 * 10 }.values == [10, 20])
    #expect(d.filter { k, _ in k == "y" }.keys == ["y"])
    #expect(d.merging(["y": 7, "w": 0]).entries.map { "\($0.0)\($0.1)" } == ["x1", "y7", "w0"])
    #expect(d.value(for: "q", default: 4) == 4)
    #expect((["b": 1, "a": 2] as OrderedDictionary<String, Int>).sortedEntries.map(\.0) == ["a", "b"])
    #expect(d == ["x": 1, "y": 2])
    #expect(d != ["y": 2, "x": 1])
  }

  @Test func dictionaryCodesInOrder() throws {
    let d: OrderedDictionary<String, Int> = ["z": 1, "a": 2]
    #expect(JSON.encode(OrderedDictionary<String, Int>.self, d) == #"{"z":1,"a":2}"#)
    let back = try JSON.decode(OrderedDictionary<String, Int>.self, from: #"{"q":1,"b":2,"5":3}"#)
    #expect(back.keys == ["5", "q", "b"])
  }

  @Test func setKeepsInsertionOrder() throws {
    var s: OrderedSet<String> = ["b", "a", "b"]
    #expect(s.values == ["b", "a"])
    s.insert("c")
    s.remove("b")
    #expect(s.elements == ["a", "c"])
    #expect(s.inserting("z").values == ["a", "c", "z"])
    #expect(s.removing("a").values == ["c"])
    #expect(s.toggling("a").values == ["c"])
    #expect(s.toggling("q").values == ["a", "c", "q"])
    #expect(s.union(["c", "d"]).values == ["a", "c", "d"])
    #expect(s.intersection(["c", "x"]).values == ["c"])
    #expect(s.subtracting(["c"]).values == ["a"])
    #expect(OrderedSet(["a"]).isSubset(of: s))
    #expect(OrderedSet.of([3, 1, 3]).values == [3, 1])
    #expect(JSON.encode(OrderedSet<String>.self, s) == #"["a","c"]"#)
    #expect(try JSON.decode(OrderedSet<Int>.self, from: "[2,1,2]").values == [2, 1])
  }

  @Test func uniqueIDs() throws {
    let a = UniqueID()
    #expect(a != UniqueID())
    #expect(a.rawValue == a.rawValue.lowercased())
    #expect(JSON.encode(UniqueID.self, UniqueID("x")) == #""x""#)
    #expect(try JSON.decode(UniqueID.self, from: #""y""#) == UniqueID("y"))
  }
}
