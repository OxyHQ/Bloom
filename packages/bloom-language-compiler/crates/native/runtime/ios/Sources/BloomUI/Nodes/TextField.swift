// `TextField($draft, "Write")`: a single-line field, body text in `text` over the input fill.
// The field's chrome (focus ring, clear button, the input group) is a follow-up.
#if canImport(SwiftUI)
import SwiftUI

public struct TextField: View {
  @Binding var text: String
  let placeholder: String
  @Environment(\.bloomPalette) private var palette

  public init(_ text: Binding<String>, _ placeholder: String = "") {
    self._text = text
    self.placeholder = placeholder
  }

  public var body: some View {
    SwiftUI.TextField(placeholder, text: $text)
      .font(BloomTextStyle.step(.body).font)
      .foregroundStyle(palette.color(.foreground))
      .padding(.horizontal, 12)
      .frame(minHeight: 36)
      .background(palette.color(.input), in: RoundedRectangle(cornerRadius: 12, style: .circular))
  }
}
#endif
