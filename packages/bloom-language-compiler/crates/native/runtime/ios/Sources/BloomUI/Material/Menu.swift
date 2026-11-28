// Menu rows on the material: today's rows (src/floating/menu-rows.tsx, shared.tsx,
// use-menu-density.ts, menu-swatch-row.tsx, menu-sub-inline.tsx) for what the system `Menu`
// cannot draw: swatches, inline sub-menus, a check gutter, the menu's own tint. On iOS a menu is
// the detached sheet (Sheet.swift), as today (DropdownMenu and ContextMenu present SheetShell):
// `.bloomMenu(isPresented:) { BloomMenuRow(…) … }`. A row's press is the material's: the
// highlight (`backgroundSecondary`) at once, no animation, and no haptic, as today.
#if canImport(SwiftUI)
import SwiftUI

/// The rows' numbers at `md` on touch.
public enum BloomMenuMetrics {
  public static let rowHeight = 44.0
  public static let paddingInline = 8.0
  public static let paddingBlock = 4.0
  public static let radius = 10.0
  public static let gap = 8.0
  public static let rowGap = 2.0
  public static let iconSlot = 20.0
  /// The check or radio gutter (`paddingLeft` 36), its indicator 20 wide at 8.
  public static let gutter = 36.0
  public static let checkSize = 16.0
  public static let radioDot = 8.0
  /// A swatch: a 44 box, its dot 28 (32 pressed), its glyph 16 (20 pressed), 4 apart.
  public static let swatchBox = 44.0
  public static let swatchDot = 28.0
  public static let swatchDotPressed = 32.0
  /// A sub-menu's rows indent.
  public static let subIndent = 16.0
}

/// A row's mark in the gutter.
public enum BloomMenuMark: Sendable, Equatable {
  case none
  case check(Bool)
  case radio(Bool)
}

/// One row: its glyph, its title, a mark, a shortcut; destructive in the error tone.
public struct BloomMenuRow: View {
  let title: String
  let glyph: Glyph?
  let mark: BloomMenuMark?
  let shortcut: String?
  let destructive: Bool
  let disabled: Bool
  let action: @MainActor () -> Void
  @Environment(\.bloomPalette) private var palette

  public init(
    _ title: String, glyph: Glyph? = nil, mark: BloomMenuMark? = nil, shortcut: String? = nil,
    destructive: Bool = false, disabled: Bool = false, action: @escaping @MainActor () -> Void
  ) {
    self.title = title
    self.glyph = glyph
    self.mark = mark
    self.shortcut = shortcut
    self.destructive = destructive
    self.disabled = disabled
    self.action = action
  }

  typealias M = BloomMenuMetrics

  public var body: some View {
    let ink = disabled ? "textGraphical" : destructive ? "errorSubtleForeground" : "text"
    let shape = RoundedRectangle(cornerRadius: CGFloat(M.radius), style: .continuous)
    SwiftUI.HStack(spacing: CGFloat(M.gap)) {
      if let glyph {
        Icon(glyph).frame(width: CGFloat(M.iconSlot), height: CGFloat(M.iconSlot))
      }
      SwiftUI.Text(verbatim: title)
        .font(BloomTextStyle.step(.body).font)
        .lineLimit(1)
        .frame(maxWidth: .infinity, alignment: .leading)
      if let shortcut {
        SwiftUI.Text(verbatim: shortcut)
          .font(BloomTextStyle.step(.caption1, weight: 500).font)
          .foregroundStyle(palette.color("textSecondary"))
      }
    }
    .foregroundStyle(palette.color(ink))
    .padding(.leading, CGFloat(mark == nil ? M.paddingInline : M.gutter))
    .padding(.trailing, CGFloat(M.paddingInline))
    .padding(.vertical, CGFloat(M.paddingBlock))
    .frame(minHeight: CGFloat(M.rowHeight))
    .overlay(alignment: .leading) { markView.padding(.leading, CGFloat(M.paddingInline)) }
    .bloomPress(.flat, in: shape, pressedFill: "backgroundSecondary", action: action)
    .disabled(disabled)
    .accessibilityAddTraits(isOn ? [.isButton, .isSelected] : .isButton)
  }

  private var isOn: Bool {
    switch mark {
    case .check(let on), .radio(let on): on
    default: false
    }
  }

  @ViewBuilder private var markView: some View {
    switch mark {
    case .check(true):
      Icon(.check).frame(width: CGFloat(M.checkSize), height: CGFloat(M.checkSize))
        .bloomForeground(BloomColor(.muted))
        .frame(width: CGFloat(M.iconSlot))
    case .radio(true):
      Circle().fill(palette.color("foreground"))
        .frame(width: CGFloat(M.radioDot), height: CGFloat(M.radioDot))
        .frame(width: CGFloat(M.iconSlot))
    default:
      EmptyView()
    }
  }
}

/// A rule between groups: 1 pt in the border colour, across the row's padding.
public struct BloomMenuSeparator: View {
  @Environment(\.bloomPalette) private var palette
  public init() {}
  public var body: some View {
    Rectangle().fill(palette.color("border")).frame(height: 1)
      .padding(.horizontal, CGFloat(-BloomMenuMetrics.paddingInline))
      .padding(.vertical, CGFloat(BloomMenuMetrics.rowGap))
  }
}

/// A group's label: caption-1 medium in the secondary text.
public struct BloomMenuLabel: View {
  let title: String
  @Environment(\.bloomPalette) private var palette
  public init(_ title: String) { self.title = title }
  public var body: some View {
    SwiftUI.Text(verbatim: title)
      .font(BloomTextStyle.step(.caption1, weight: 500).font)
      .foregroundStyle(palette.color("textSecondary"))
      .padding(.horizontal, CGFloat(BloomMenuMetrics.paddingInline))
      .padding(.vertical, CGFloat(BloomMenuMetrics.paddingBlock))
      .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// A row of colour swatches (a theme picker): each a dot in a 44 box, growing while pressed,
/// ringed in its colour mixed 22% toward white (dark) or black, its glyph in white or near black
/// by contrast.
public struct BloomMenuSwatches: View {
  let colors: [BloomRGBA]
  let selected: Int?
  let onSelect: @MainActor (Int) -> Void
  @Environment(\.bloomPalette) private var palette

  public init(_ colors: [BloomRGBA], selected: Int?, onSelect: @escaping @MainActor (Int) -> Void) {
    self.colors = colors
    self.selected = selected
    self.onSelect = onSelect
  }

  public var body: some View {
    SwiftUI.HStack(spacing: 4) {
      ForEach(Array(colors.enumerated()), id: \.offset) { index, color in
        SwatchButton(color: color, selected: index == selected, scheme: palette.scheme) { onSelect(index) }
      }
    }
    .padding(.horizontal, CGFloat(BloomMenuMetrics.paddingInline))
    .padding(.vertical, CGFloat(BloomMenuMetrics.paddingBlock))
  }
}

struct SwatchButton: View {
  let color: BloomRGBA
  let selected: Bool
  let scheme: SwiftUI.ColorScheme
  let action: @MainActor () -> Void

  var body: some View {
    let ring = color.mixed(with: scheme == .dark ? BloomRGBA(red: 1, green: 1, blue: 1) : BloomRGBA(red: 0, green: 0, blue: 0), 0.22)
    SwiftUI.Button(action: action) { SwiftUI.Color.clear }
      .buttonStyle(SwatchStyle(color: color, ring: ring, selected: selected))
      .frame(width: CGFloat(BloomMenuMetrics.swatchBox), height: CGFloat(BloomMenuMetrics.swatchBox))
  }
}

struct SwatchStyle: ButtonStyle {
  let color: BloomRGBA
  let ring: BloomRGBA
  let selected: Bool

  func makeBody(configuration: Configuration) -> some View {
    let dot = configuration.isPressed ? BloomMenuMetrics.swatchDotPressed : BloomMenuMetrics.swatchDot
    let glyph = configuration.isPressed ? 20.0 : 16.0
    // White on the swatch when it reads at 3:1, else near black (#1C1C1E).
    let light = Toggle.contrast(color, BloomRGBA(red: 1, green: 1, blue: 1)) >= 3
    return SwiftUI.ZStack {
      Circle().fill(color.color).overlay { Circle().stroke(ring.color, lineWidth: 1) }
        .frame(width: CGFloat(dot), height: CGFloat(dot))
      if selected {
        Icon(.check)
          .frame(width: CGFloat(glyph), height: CGFloat(glyph))
          .foregroundStyle(light ? SwiftUI.Color.white : SwiftUI.Color(red: 0x1C / 255, green: 0x1C / 255, blue: 0x1E / 255))
      }
    }
    .contentShape(Rectangle())
  }
}

/// A sub-menu on a phone: an inline disclosure, its rows indented 16, no animation.
public struct BloomMenuSub<Rows: View>: View {
  let title: String
  let glyph: Glyph?
  let rows: Rows
  @State private var open = false
  @Environment(\.bloomPalette) private var palette

  public init(_ title: String, glyph: Glyph? = nil, @ViewBuilder rows: () -> Rows) {
    self.title = title
    self.glyph = glyph
    self.rows = rows()
  }

  public var body: some View {
    SwiftUI.VStack(spacing: CGFloat(BloomMenuMetrics.rowGap)) {
      BloomMenuRow(title, glyph: glyph) { open.toggle() }
        .overlay(alignment: .trailing) {
          Icon(open ? .arrowUpS : .arrowDownS)
            .frame(width: 16, height: 16)
            .bloomForeground(BloomColor(.muted))
            .padding(.trailing, CGFloat(BloomMenuMetrics.paddingInline))
            .allowsHitTesting(false)
        }
      if open {
        SwiftUI.VStack(spacing: CGFloat(BloomMenuMetrics.rowGap)) { rows }
          .padding(.leading, CGFloat(BloomMenuMetrics.subIndent))
      }
    }
  }
}

extension View {
  /// A menu over the view while `isPresented`: its rows on the detached sheet (iOS's menu, as
  /// today), the sheet's material, backdrop and motion.
  public func bloomMenu<Rows: View>(isPresented: Binding<Bool>, @ViewBuilder rows: @escaping () -> Rows) -> some View {
    bloomDetachedSheet(isPresented: isPresented) {
      SwiftUI.VStack(spacing: CGFloat(BloomMenuMetrics.rowGap)) { rows() }
    }
  }
}
#endif
