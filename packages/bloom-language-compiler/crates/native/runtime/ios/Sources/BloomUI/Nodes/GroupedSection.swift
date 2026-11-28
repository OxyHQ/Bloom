// `GroupedSection` and `GroupedSectionItem`: a settings group, as src/grouped-section draws it
// today (comfortable density): an uppercase caption title (11 pt semibold, tracking 0.6,
// `textSecondary`, padding 20 × 4/6), a card of radius 28 (circular) whose rows are separated
// by 2 pt of the page; each row 52 pt tall at least, padding 16 × 12, gap 12; its title 15/20
// medium, its description 13/18 muted on two lines; 16 pt below the section.
#if canImport(SwiftUI)
import SwiftUI

public struct GroupedSection<Content: View>: View {
  let content: Content
  var heading: String? = nil
  var footnote: String? = nil
  @Environment(\.bloomPalette) private var palette

  public init(@ViewBuilder content: () -> Content) { self.content = content() }

  public var body: some View {
    BloomFlexLayout(axis: .vertical) {
      if let heading {
        SwiftUI.Text(verbatim: heading.uppercased())
          .font(.custom("Inter", size: 11).weight(.semibold))
          .tracking(0.6)
          .foregroundStyle(palette.color(.muted))
          .padding(.horizontal, 20)
          .padding(.top, 4)
          .padding(.bottom, 6)
      }
      BloomFlexLayout(axis: .vertical, gap: 2) { content }
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .circular))
      if let footnote {
        SwiftUI.Text(verbatim: footnote)
          .font(.custom("Inter", size: 12))
          .foregroundStyle(palette.color(.textTertiary))
          .padding(.horizontal, 20)
          .padding(.top, 6)
      }
    }
    .padding(.bottom, 16)
  }

  /// `.title("General")`: the section's heading (the universal `title` is the node's here).
  public func bloomTitle(_ text: String) -> Self { var s = self; s.heading = text; return s }
  public func footer(_ text: String) -> Self { var s = self; s.footnote = text; return s }
}

public struct GroupedSectionItem: View {
  let title: String
  var detail: String? = nil
  var trailingView: AnyView? = nil
  var wraps = false
  var press: (@MainActor () -> Void)? = nil
  var showsChevron: Bool? = nil
  var isDestructive = false
  @Environment(\.bloomPalette) private var palette

  public init(_ title: String) { self.title = title }

  public var body: some View {
    let row = WrapControlLayout(wraps: wraps) {
      BloomFlexLayout(axis: .vertical, gap: 2) {
        SwiftUI.Text(verbatim: title)
          .font(.custom("Inter", size: 15).weight(.medium))
          .lineSpacing(20 - 15 * BloomTextStyle.interLineRatio)
          .foregroundStyle(palette.color(isDestructive ? .error : .foreground))
          .lineLimit(1)
        if let detail {
          SwiftUI.Text(verbatim: detail)
            .font(.custom("Inter", size: 13))
            .lineSpacing(18 - 13 * BloomTextStyle.interLineRatio)
            .foregroundStyle(palette.color(.muted))
            .lineLimit(2)
        }
      }
      if let trailingView { trailingView }
      if showsChevron ?? (press != nil) {
        Icon(.arrowRightS).size(.sm).bloomForeground(.textTertiary)
      }
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 12)
    .frame(minHeight: 52)
    .background(palette.color(.card))
    return Group {
      if let press {
        row.bloomPress(.flat, in: Rectangle(), pressedOpacity: 0.6, action: press)
      } else {
        row
      }
    }
  }

  public func description(_ text: String) -> Self { var s = self; s.detail = text; return s }
  public func trailing<V: View>(_ view: V) -> Self { var s = self; s.trailingView = AnyView(view); return s }
  public func wrapControl(_ on: Bool = true) -> Self { var s = self; s.wraps = on; return s }
  public func chevron(_ on: Bool = true) -> Self { var s = self; s.showsChevron = on; return s }
  public func destructive(_ on: Bool = true) -> Self { var s = self; s.isDestructive = on; return s }
  public func bloomOnPress(_ action: @escaping @MainActor () -> Void) -> Self { var s = self; s.press = action; return s }
}

/// A row's text beside its controls, or above them when the two do not fit with the text at
/// least 140 pt wide (`wrapControl`: `flexWrap`, row gap 8). Without `wraps`, always beside.
struct WrapControlLayout: Layout {
  let wraps: Bool
  let gap: CGFloat = 12
  let rowGap: CGFloat = 8
  let minText: CGFloat = 140

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let frames = layout(proposal.width, subviews)
    let w = frames.map { $0.maxX }.max() ?? 0
    let h = frames.map { $0.maxY }.max() ?? 0
    return CGSize(width: proposal.width.flatMap { $0.isFinite ? $0 : nil } ?? w, height: h)
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    let frames = layout(bounds.width, subviews)
    let rowHeight = frames.map { $0.maxY }.max() ?? 0
    for (child, frame) in zip(subviews, frames) {
      // Beside: each centred in the row; below: from the top.
      let y = frame.minY == 0 && frames.allSatisfy({ $0.minY == 0 }) ? (rowHeight - frame.height) / 2 : frame.minY
      child.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + y), anchor: .topLeading, proposal: ProposedViewSize(frame.size))
    }
  }

  private func layout(_ width: CGFloat?, _ subviews: Subviews) -> [CGRect] {
    guard let text = subviews.first else { return [] }
    let controls = Array(subviews.dropFirst())
    let sizes = controls.map { $0.sizeThatFits(.unspecified) }
    let controlsWidth = sizes.map(\.width).reduce(0, +) + gap * CGFloat(sizes.count)
    let room = width.flatMap { $0.isFinite ? $0 : nil }
    let beside = !wraps || room.map { $0 - controlsWidth >= minText } ?? true
    var frames: [CGRect] = []
    if beside {
      let textWidth = room.map { max(0, $0 - controlsWidth) }
      let t = text.sizeThatFits(ProposedViewSize(width: textWidth, height: nil))
      frames.append(CGRect(x: 0, y: 0, width: textWidth ?? t.width, height: t.height))
      var x = (textWidth ?? t.width) + gap
      for s in sizes {
        frames.append(CGRect(x: x, y: 0, width: s.width, height: s.height))
        x += s.width + gap
      }
    } else {
      let t = text.sizeThatFits(ProposedViewSize(width: room, height: nil))
      frames.append(CGRect(x: 0, y: 0, width: room ?? t.width, height: t.height))
      var x: CGFloat = 0
      let y = t.height + rowGap
      for s in sizes {
        frames.append(CGRect(x: x, y: y, width: s.width, height: s.height))
        x += s.width + gap
      }
    }
    return frames
  }
}
#endif
