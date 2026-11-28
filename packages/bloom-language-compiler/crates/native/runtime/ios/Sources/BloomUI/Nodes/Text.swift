// `Text`: Bloom's text, as today's Bloom draws it on iOS (src/typography/Typography.tsx): the
// subtree's font (13 pt Inter by default), its ink (`text` by default), its line height laid
// out as React Native's iOS text does, and `lines` with a tail ellipsis.
#if canImport(SwiftUI)
import SwiftUI

public struct Text: View {
  let content: String
  var maxLines: Int? = nil
  var truncation: SwiftUI.Text.TruncationMode = .tail
  @Environment(\.bloomInk) private var ink
  @Environment(\.bloomPalette) private var palette

  public init(_ content: String) { self.content = content }

  public init(verbatim content: String) { self.content = content }

  public var body: some View {
    let style = ink.font.map { BloomTextStyle.step($0, weight: ink.weight?.number) }
      ?? {
        var s = BloomTextStyle.default
        if let w = ink.weight { s.weight = w.number }
        return s
      }()
    let leading = style.leading
    return SwiftUI.Text(verbatim: content)
      .font(style.font)
      .tracking(CGFloat(style.tracking))
      .foregroundStyle(palette.color(ink.foreground ?? BloomColor(.foreground)))
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
}
#endif
