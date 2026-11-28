import Foundation
import Testing
@testable import Bloom

@Suite struct StringMembers {
  @Test func slicesCountCharacters() {
    #expect("hello".slice(1, 3) == "el")
    #expect("hello".slice(-3) == "llo")
    #expect("hello".slice(-3, -1) == "ll")
    #expect("hello".slice(3, 1) == "")
    #expect("hello".slice(0, 99) == "hello")
    // A grapheme cluster is one character (the TS runtime would cut the surrogate pair).
    #expect("👍🏽ok".slice(0, 1) == "👍🏽")
    #expect("👍🏽ok".count == 3)
  }

  @Test func prefixesAndTrim() {
    #expect("hello".startsWith("he"))
    #expect(!"hello".startsWith("lo"))
    #expect("hello".endsWith("lo"))
    #expect("  \u{00A0}\u{FEFF}hi\n\t ".trimmed() == "hi")
    #expect("   ".trimmed() == "")
    #expect("  hi  ".trimmingStart() == "hi  ")
    #expect("  hi  ".trimmingEnd() == "  hi")
  }

  @Test func splitsAsJS() {
    #expect("a,b,,c".split(",") == ["a", "b", "", "c"])
    #expect("".split(",") == [""])
    #expect("abc".split("") == ["a", "b", "c"])
    #expect(",a,".split(",") == ["", "a", ""])
    #expect("a--b--".split("--") == ["a", "b", ""])
  }

  @Test func replacesAsReplaceAll() {
    #expect("a.b.c".replace(".", "-") == "a-b-c")
    #expect("aaa".replace("aa", "b") == "ba")
    #expect("abc".replace("", "-") == "-a-b-c-")
    #expect("x".replace("x", "$$") == "$")
    #expect("ab".replace("b", "[$&$`$']") == "a[ba]")
    #expect("ab".replace("z", "y") == "ab")
  }

  @Test func numbersFromText() {
    #expect("42".toInt() == 42)
    #expect(" 42 ".toInt() == 42)
    #expect("0x1F".toInt() == 31)
    #expect("1e3".toInt() == 1000)
    #expect("2.0".toInt() == 2)
    #expect("2.5".toInt() == nil)
    #expect("".toInt() == nil)
    #expect("abc".toInt() == nil)
    #expect("9007199254740993".toInt() == nil)
    #expect("1_000".toInt() == nil)
    #expect("2.5".toFloat() == 2.5)
    #expect(".5".toFloat() == 0.5)
    #expect("5.".toFloat() == 5)
    #expect("-Infinity".toFloat() == -.infinity)
    #expect("nan".toFloat() == nil)
    #expect("0b101".toFloat() == 5)
    #expect("1e".toFloat() == nil)
  }

  @Test func coreStringExtensions() {
    #expect("a-b-a".firstIndex(of: "a", from: 1) == 4)
    #expect("a-b-a".lastIndex(of: "a") == 4)
    #expect("a-b-a".firstIndex(of: "z") == nil)
    #expect("😀x😀".firstIndex(of: "x") == 1)
    #expect("prefix-body".droppingPrefix("prefix-") == "body")
    #expect("body.txt".droppingSuffix(".txt") == "body")
    #expect("héllo".prefix(2) == "hé")
    #expect("héllo".suffix(3) == "llo")
    #expect("hello world".truncated(to: 5) == "hello…")
    #expect("hi".truncated(to: 5) == "hi")
    #expect("5".paddingStart(to: 3, with: "0") == "005")
    #expect("5".paddingEnd(to: 4, with: "ab") == "5aba")
    #expect("hello world".capitalizedFirst == "Hello world")
    #expect("a\r\nb\nc".lines == ["a", "b", "c"])
    #expect("👍🏽a".characters == ["👍🏽", "a"])
    #expect("  ".isBlank)
    #expect(String.repeating("ab", count: 3) == "ababab")
    #expect(String.repeating("ab", count: -1) == "")
    #expect("a".compare("b", locale: "en") == -1)
    #expect("b".compare("a", locale: "en") == 1)
  }
}

@Suite struct NumberMembers {
  @Test func roundingAsMath() {
    #expect(2.5.bloomRounded() == 3)
    #expect((-2.5).bloomRounded() == -2)
    #expect(0.49999999999999994.bloomRounded() == 0)
    #expect(2.7.floor() == 2)
    #expect((-2.1).floor() == -3)
    #expect(2.1.ceil() == 3)
    #expect((-2.7).truncated() == -2)
    #expect(Double.nan.floor() == 0)
  }

  @Test func clampsAndPicks() {
    #expect(5.clamped(0, 3) == 3)
    #expect((-1).clamp(0, 3) == 0)
    #expect(1.5.clamped(0.0, 1.0) == 1.0)
    #expect(3.min(2) == 2)
    #expect(3.max(7) == 7)
    #expect((-3).abs() == 3)
    #expect(2.toFloat() == 2.0)
    #expect(Double.nan.min(1).isNaN)
  }

  @Test func numbersWrittenAsJS() {
    for c in Fixtures.intl.numberTexts {
      #expect(stringOfNumber(c.n) == c.text, "\(c.n)")
    }
    #expect(stringOfNumber(.nan) == "NaN")
    #expect(stringOfNumber(-.infinity) == "-Infinity")
    #expect(stringOfNumber(-0.0) == "0")
  }

  @Test func mathMembers() {
    #expect(Double.e == M_E)
    #expect(16.0.squareRoot == 4)
    #expect(4.isEven)
    let r = Int.random(in: 3, to: 5)
    #expect(r >= 3 && r < 5)
    #expect(Int.random(in: 3, to: 3) == 3)
    let d = Double.random(in: 1, to: 2)
    #expect(d >= 1 && d < 2)
  }
}

@Suite struct ArrayMembers {
  @Test func jsShapedMembers() {
    let xs = [3, 1, 4, 1, 5]
    #expect(xs.find { $0 > 3 } == 4)
    #expect(xs.findIndex { $0 > 3 } == 2)
    #expect(xs.findIndex { $0 > 9 } == nil)
    #expect(xs.any { $0 == 5 })
    #expect(!xs.all { $0 > 1 })
    #expect(xs.slice(1, 3) == [1, 4])
    #expect(xs.slice(-2) == [1, 5])
    #expect(xs.indexOf(1) == 1)
    #expect(xs.indexOf(9) == nil)
    #expect(xs.at(0) == 3)
    #expect(xs.at(-1) == nil)
    #expect(xs.at(5) == nil)
    #expect(xs.prefix(2) == [3, 1])
    #expect(xs.prefix(-1) == [3, 1, 4, 1])
    #expect(xs.dropFirst(3) == [1, 5])
    #expect(xs.reversed() == [5, 1, 4, 1, 3])
    #expect(xs.appending(9) == [3, 1, 4, 1, 5, 9])
    #expect(xs.inserting(0, 1) == [3, 0, 1, 4, 1, 5])
    #expect(xs.removing(0) == [1, 4, 1, 5])
    #expect(xs.joined(", ") == "3, 1, 4, 1, 5")
    #expect([1.0, 2.5].joined("|") == "1|2.5")
    #expect([Optional<String>.none, "a"].joined("-") == "-a")
  }

  @Test func sortsStably() {
    let pairs = [(1, "a"), (0, "b"), (1, "c"), (0, "d")]
    let sorted = pairs.sorted { $0.0 < $1.0 }.map(\.1)
    #expect(sorted == ["b", "d", "a", "c"])
    #expect([3, 1, 2].sorted(by: <) == [1, 2, 3])
  }

  @Test func coreArrayExtensions() {
    let xs = [1, 2, 3, 4, 5]
    #expect(xs.chunked(into: 2) == [[1, 2], [3, 4], [5]])
    #expect(xs.windows(of: 3) == [[1, 2, 3], [2, 3, 4], [3, 4, 5]])
    #expect(xs.windows(of: 9) == [])
    #expect(xs.partitioned { $0 % 2 == 0 } == ([2, 4], [1, 3, 5]))
    #expect(xs.element(at: 9) == nil)
    #expect(xs.replacing(at: 0, with: 9) == [9, 2, 3, 4, 5])
    #expect(xs.updating(where: { $0 > 3 }) { $0 * 10 } == [1, 2, 3, 40, 50])
    #expect(xs.removingAll { $0 > 3 } == [1, 2, 3])
    #expect(xs.appendingAll([6]) == [1, 2, 3, 4, 5, 6])
    let grouped = ["apple", "avocado", "banana"].grouped { String($0.first!) }
    #expect(grouped.keys == ["a", "b"])
    #expect(grouped["a"] == ["apple", "avocado"])
    let keyed = ["x1", "y2", "x3"].keyed { String($0.first!) }
    #expect(keyed.keys == ["x", "y"])
    #expect(keyed["x"] == "x3")
    #expect(["a1", "b1", "a2"].uniqued { String($0.first!) } == ["a1", "b1"])
    #expect(uniqued(["b", "a", "b"]) == ["b", "a"])
    #expect(concat([1], [2]) == [1, 2])
    #expect(stride(from: 0, to: 10, by: 3) == [0, 3, 6, 9])
    #expect(stride(from: 5, to: 0, by: -2) == [5, 3, 1])
    #expect(stride(from: 0, to: 3) == [0, 1, 2])
    #expect(range(3) == [0, 1, 2])
    #expect(range(-1) == [])
    #expect(zip([1, 2, 3], ["a", "b"]).map { "\($0.0)\($0.1)" } == ["1a", "2b"])
  }
}

@Suite struct CoreValues {
  @Test func optionals() throws {
    let some: Int? = 3
    let none: Int? = nil
    #expect(some.isSome && none.isNone)
    #expect(none.unwrapOr(7) == 7)
    #expect(try some.orThrow(RuntimeError(message: "x")) == 3)
    #expect(throws: RuntimeError(message: "missing")) { try none.orThrow(RuntimeError(message: "missing")) }
  }

  @Test func results() throws {
    let ok: BloomResult<Int, String> = .ok(2)
    let err: BloomResult<Int, String> = .err("bad")
    #expect(ok.isOk && !err.isOk)
    #expect(ok.ok() == 2 && err.ok() == nil)
    #expect(ok.map { $0 * 2 } == .ok(4))
    #expect(err.mapErr { $0.count } == .err(3))
    #expect(err.unwrapOr(9) == 9)
    #expect(try ok.get() == 2)
    #expect(throws: RuntimeError(message: "bad")) { try err.get() }
    let caught = catching { () throws -> Int in throw RuntimeError(message: "boom") }
    #expect(!caught.isOk)
  }

  @Test func errorsDescribeThemselves() {
    let e: any Error = RuntimeError(message: "boom")
    #expect(e.localizedDescription == "boom")
    let ref = Ref(1)
    ref.value += 1
    #expect(ref.value == 2)
  }
}
