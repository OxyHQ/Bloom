// `Text`: Bloom's text, as today's Bloom draws it on iOS (src/typography/Typography.tsx): the
// subtree's font (13 pt Inter by default), its ink (`text` by default), its line height laid
// out as React Native's iOS text does, and `lines` with a tail ellipsis.
#if canImport(SwiftUI)
import SwiftUI

/// One run of a `Text`: its characters and the ink it sets over the text's own.
public struct TextRun: Sendable, Equatable {
  var content: String
  var ink = BloomInk()
}

/// What a `Text` of runs takes: a string, or a `Text` (styled: `Text("this").weight(.bold)`).
@MainActor public protocol TextRunConvertible {
  var textRuns: [TextRun] { get }
}

extension String: TextRunConvertible {
  public var textRuns: [TextRun] { [TextRun(content: self)] }
}

public struct Text: View, TextRunConvertible {
  var runs: [TextRun]
  /// The ink set on the text itself (`Text(s).foregroundStyle(.muted)`): over the subtree's.
  var own = BloomInk()
  var maxLines: Int? = nil
  var truncation: SwiftUI.Text.TruncationMode = .tail
  @Environment(\.bloomInk) private var ink
  @Environment(\.bloomPalette) private var palette

  public init(_ content: String) { runs = [TextRun(content: content)] }

  public init(verbatim content: String) { runs = [TextRun(content: content)] }

  /// `Text("Read ", Text("this").weight(.semibold), " and ")`: runs drawn as one text, each
  /// with its own ink over the text's (one layout, one line breaker: an attributed string).
  public init(_ first: any TextRunConvertible, _ second: any TextRunConvertible, _ rest: any TextRunConvertible...) {
    runs = ([first, second] + rest).flatMap { $0.textRuns }
  }

  /// `Text(words.map { … })`: a list of runs.
  public init(_ parts: [Text]) { runs = parts.flatMap { $0.textRuns } }

  public var textRuns: [TextRun] {
    runs.map { run in
      var r = run
      r.ink = merged(run.ink, over: own)
      return r
    }
  }

  private func merged(_ top: BloomInk, over base: BloomInk) -> BloomInk {
    var m = base
    if let f = top.font { m.font = f }
    if let w = top.weight { m.weight = w }
    if let c = top.foreground { m.foreground = c }
    if let o = top.opacity { m.opacity = o }
    return m
  }

  private func style(_ ink: BloomInk) -> BloomTextStyle {
    ink.font.map { BloomTextStyle.step($0, weight: ink.weight?.number) }
      ?? {
        var s = BloomTextStyle.default
        if let w = ink.weight { s.weight = w.number }
        return s
      }()
  }

  public var body: some View {
    let whole = merged(own, over: ink)
    let base = style(whole)
    let leading = base.leading
    let drawn: SwiftUI.Text = runs.reduce(SwiftUI.Text(verbatim: "")) { text, run in
      let runInk = merged(run.ink, over: whole)
      let s = style(runInk)
      return text + SwiftUI.Text(verbatim: run.content)
        .font(s.font)
        .tracking(CGFloat(s.tracking))
        .foregroundStyle(palette.color(runInk.foreground ?? BloomColor(.foreground)))
    }
    return drawn
      .lineSpacing(CGFloat(leading.between))
      .padding(.vertical, CGFloat(leading.around))
      .lineLimit(maxLines)
      .truncationMode(truncation)
  }

  /// `.lines(2)`: at most two lines, the rest an ellipsis (`numberOfLines`).
  public func lines(_ n: Int) -> Text { var t = self; t.maxLines = n; return t }

  /// `.truncation(.middle)`.
  public func truncation(_ mode: Tokens.Truncation) -> Text {
    var t = self
    t.truncation = switch mode {
    case .head: .head
    case .middle: .middle
    default: .tail
    }
    return t
  }

  // A text's ink set on the text itself stays a `Text`, so it can be a run of another
  // (`Text("a", Text("b").foregroundStyle(.primary))`): the same as the subtree's ink otherwise.

  public func bloomForeground(_ color: BloomColor) -> Text { var t = self; t.own.foreground = color; return t }

  public func bloomWeight(_ weight: Tokens.Weight) -> Text { var t = self; t.own.weight = weight; return t }

  public func bloomFont(_ font: Tokens.Font) -> Text { var t = self; t.own.font = font; return t }
}
#endif
