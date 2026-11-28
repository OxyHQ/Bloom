// Bloom's tab bar on iOS: the floating capsule on the one material, scrubbable as today's
// (src/tab-bar/TabBarBase.tsx, shared.ts, context.tsx). A drag along the bar moves its
// highlight with the finger 1:1, a light haptic at each tab boundary it crosses, and the release
// springs to the nearest tab (`select`) and selects it; a tap selects. Scrolling down minimizes
// the bar (62 → 44 tall, the labels fading, the sides drawn in), scrolling up or near the top
// expands it (`expand`). The capsule is glass (system Liquid Glass on iOS 26, the fallback
// before); the highlight is the shadow tone on it.
#if canImport(SwiftUI)
import SwiftUI

/// One tab: its glyph, the glyph when selected, its title.
public struct BloomTabItem: Sendable, Equatable {
  public let title: String
  public let glyph: Glyph
  public let selectedGlyph: Glyph

  public init(_ title: String, glyph: Glyph, selected: Glyph? = nil) {
    self.title = title
    self.glyph = glyph
    self.selectedGlyph = selected ?? glyph
  }
}

/// The geometry of today's bar (shared.ts), in points.
public enum BloomTabBarMetrics {
  public static let height = 62.0
  public static let minimizedHeight = 44.0
  public static let minimizedInset = 34.0
  public static let margin = 12.0
  public static let rowPadding = 4.0
  public static let maxItemWidth = 88.0
  public static let minimizedItemWidth = 44.0
  public static let iconSize = 21.0
  public static let labelSize = 9.5
  public static let labelGap = 2.0
  public static let highlightInset = 4.0
  /// The highlight: the bar's height less its inset on each side; minimized, the icon and 7 each side.
  public static let highlightHeight = height - 2 * highlightInset
  public static let minimizedHighlightHeight = iconSize + 2 * 7
  /// The extra the progressive blur band runs past the bar (`BLUR_BLEED`).
  public static let blurBleed = 44.0
  /// A drag starts past 6 along the bar and gives way past 14 across it; a tap moves less than 16.
  public static let dragStart = 6.0
  public static let dragFail = 14.0
  public static let tapSlop = 16.0
}

/// Whether the bar minimizes as its screen scrolls (context.tsx): near the top it expands, a step
/// down of more than 3 minimizes it and a step up of more than 3 expands it.
public struct BloomTabBarMinimizer: Sendable, Equatable {
  public static let topZone = 24.0
  public static let step = 3.0
  var last = 0.0
  public init() {}

  /// The bar's target (0 expanded, 1 minimized) for the scroll offset `y`, or none to keep it.
  public mutating func target(scrolledTo y: Double) -> Double? {
    defer { last = y }
    if y < Self.topZone { return 0 }
    let dy = y - last
    if dy > Self.step { return 1 }
    if dy < -Self.step { return 0 }
    return nil
  }
}

public struct BloomTabBar: View {
  let items: [BloomTabItem]
  @Binding var selection: Int
  /// 0 expanded, 1 minimized.
  let minimized: Double
  let haptics: Bool
  let maxWidth: Double

  /// The highlight's position, in tabs (fractional while dragged).
  @State private var slide: Double? = nil
  @State private var dragging = false
  @State private var failed = false
  @State private var lastTicked = 0
  @State private var ticks = 0
  @Environment(\.bloomPalette) private var palette
  @Environment(\.layoutDirection) private var direction

  public init(_ items: [BloomTabItem], selection: Binding<Int>, minimized: Double = 0, haptics: Bool = true, maxWidth: Double = .infinity) {
    self.items = items
    self._selection = selection
    self.minimized = minimized
    self.haptics = haptics
    self.maxWidth = maxWidth
  }

  typealias M = BloomTabBarMetrics

  public var body: some View {
    GeometryReader { proxy in
      let available = Double(proxy.size.width) - 2 * M.margin
      let count = Double(max(items.count, 1))
      let outer = min(available, count * M.maxItemWidth + 2 * M.rowPadding, maxWidth)
      let inset = min(M.minimizedInset, max(0, (available - count * M.minimizedItemWidth - 2 * M.rowPadding) / 2)) * minimized
      let width = outer - 2 * inset
      let height = M.height - (M.height - M.minimizedHeight) * minimized
      let itemWidth = (width - 2 * M.rowPadding) / count
      let position = slide ?? Double(selection)
      bar(width: width, height: height, itemWidth: itemWidth, position: position)
        .frame(width: CGFloat(width), height: CGFloat(height))
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
    }
    .frame(height: CGFloat(M.height))
    .padding(.horizontal, CGFloat(M.margin))
    .bloomHaptic(haptics ? .tap : nil, trigger: ticks)
    .onChange(of: selection) { _, now in
      // Selected elsewhere (a route, a reselect): the highlight springs there.
      if !dragging { withAnimation(BloomMotion.select) { slide = Double(now) } }
    }
  }

  private func bar(width: Double, height: Double, itemWidth: Double, position: Double) -> some View {
    let highlight = M.highlightHeight - (M.highlightHeight - M.minimizedHighlightHeight) * minimized
    let x = M.rowPadding + itemWidth * position
    return SwiftUI.ZStack(alignment: .topLeading) {
      // The highlight: the shadow tone, fully round, under the item it is on.
      Capsule()
        .fill(SwiftUI.Color.clear)
        .bloomMaterial(.fill(themeKey: "shadow"), in: Capsule())
        .frame(width: CGFloat(itemWidth), height: CGFloat(highlight))
        .offset(x: CGFloat(direction == .rightToLeft ? width - x - itemWidth : x), y: CGFloat((height - highlight) / 2))
      SwiftUI.HStack(spacing: 0) {
        ForEach(Array(items.enumerated()), id: \.offset) { index, item in
          cell(item, index: index, position: position, height: highlight)
            .frame(width: CGFloat(itemWidth), height: CGFloat(height))
        }
      }
      .padding(.horizontal, CGFloat(M.rowPadding))
    }
    .frame(width: CGFloat(width), height: CGFloat(height), alignment: .topLeading)
    .bloomMaterial(.glass(.regular, tint: .card, opacity: MaterialTokens.floatingTint, interactive: true), in: Capsule())
    .contentShape(Capsule())
    .gesture(scrub(itemWidth: itemWidth, width: width))
  }

  private func cell(_ item: BloomTabItem, index: Int, position: Double, height: Double) -> some View {
    // How near the highlight is (1 on it, 0 a tab or more away): the selected glyph and the
    // active tint cross-fade with it.
    let proximity = 1 - min(abs(position - Double(index)), 1)
    let active = palette.rgba(.primary)
    let inactive = palette.rgba(.foreground)
    let tint = inactive.mixed(with: active, proximity)
    let labelOpacity = max(0, 1 - minimized / 0.4)
    let top = 9 - 2 * minimized
    return SwiftUI.VStack(spacing: CGFloat(M.labelGap)) {
      SwiftUI.ZStack {
        Icon(item.glyph).opacity(1 - proximity)
        Icon(item.selectedGlyph).opacity(proximity)
      }
      .frame(width: CGFloat(M.iconSize), height: CGFloat(M.iconSize))
      .bloomForeground(BloomColor(proximity > 0.5 ? .primary : .foreground))
      SwiftUI.Text(verbatim: item.title)
        .font(.system(size: CGFloat(M.labelSize), weight: .semibold))
        .foregroundStyle(tint.color)
        .lineLimit(1)
        .opacity(labelOpacity)
    }
    .padding(.top, CGFloat(top))
    .frame(height: CGFloat(height), alignment: .top)
    .clipped()
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(item.title)
    .accessibilityAddTraits(index == selection ? [.isButton, .isSelected] : .isButton)
  }

  /// The tab under `x` (from the bar's leading edge), fractional: what the highlight tracks.
  private func index(at x: Double, itemWidth: Double, width: Double) -> Double {
    let fromStart = direction == .rightToLeft ? width - x : x
    let raw = (fromStart - M.rowPadding) / itemWidth - 0.5
    return min(max(raw, 0), Double(items.count - 1))
  }

  private func scrub(itemWidth: Double, width: Double) -> some Gesture {
    DragGesture(minimumDistance: 0)
      .onChanged { value in
        let dx = abs(Double(value.translation.width))
        let dy = abs(Double(value.translation.height))
        if failed { return }
        if !dragging {
          if dy > M.dragFail && dx < M.dragStart {
            failed = true
            return
          }
          guard dx >= M.dragStart else { return }
          dragging = true
          lastTicked = Int((slide ?? Double(selection)).rounded())
        }
        // 1:1 with the finger: no animation while dragged.
        var t = Transaction()
        t.disablesAnimations = true
        withTransaction(t) {
          slide = index(at: Double(value.location.x), itemWidth: itemWidth, width: width)
        }
        let rounded = Int((slide ?? 0).rounded())
        if rounded != lastTicked {
          lastTicked = rounded
          ticks += 1
        }
      }
      .onEnded { value in
        defer {
          dragging = false
          failed = false
        }
        if failed { return }
        let target: Int
        if dragging {
          target = Int((slide ?? Double(selection)).rounded())
        } else {
          let moved = hypot(Double(value.translation.width), Double(value.translation.height))
          guard moved < M.tapSlop else { return }
          target = Int(index(at: Double(value.location.x), itemWidth: itemWidth, width: width).rounded())
        }
        withAnimation(BloomMotion.select) {
          slide = Double(target)
        }
        selection = target
      }
  }
}
#endif
