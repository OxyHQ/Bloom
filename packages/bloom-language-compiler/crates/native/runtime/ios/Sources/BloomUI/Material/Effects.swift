// The material's effects that iOS has no one system view for, drawn by the one material
// (Material.swift's rule: nothing else in BloomUI blurs). Their numbers are today's Bloom on
// iOS, by source:
//
// - `BloomMotion`: src/motion/recipes.ts (`select`, `expand`), the sheet's springs
//   (src/bottom-sheet/BottomSheetBase.tsx `springSpecOf`), `SELECTION_FADE`.
// - `BloomBackdrop`: what dims and blurs behind a sheet or a menu (src/overlay/Overlay.tsx:
//   expo-blur intensity 80, tint dark, the dim black at 0.7 for SheetShell and Dialog).
// - `BloomProgressiveBlur`: the band under the tab bar (src/progressive-blur/ProgressiveBlur.tsx:
//   ten stacked blurs anchored to the edge, at 100…16% of the band, and the tail gradient in the
//   surface fill).
// - `BloomHeaderScrim`: the header's flat smoothstep scrim (src/page-header/EdgeScrim.tsx).
#if canImport(SwiftUI)
import SwiftUI

/// Bloom's motion recipes, as SwiftUI animations.
public enum BloomMotion {
  /// `select`: 420 ms, damping ratio 0.82 (a tab's highlight settling).
  public static let select = Animation.spring(response: 0.42, dampingFraction: 0.82)
  /// `expand`: 380 ms, critically damped (the tab bar minimizing and expanding).
  public static let expand = Animation.spring(response: 0.38, dampingFraction: 1)
  /// `SELECTION_FADE`: 160 ms, Reanimated's default in-out quad.
  public static let selectionFade = Animation.timingCurve(0.455, 0.03, 0.515, 0.955, duration: 0.16)
  /// A sheet's present, return and pan dismiss: mass 0.8, stiffness 300, damping 25.
  public static func sheet(velocity: Double = 0) -> Animation {
    .interpolatingSpring(mass: 0.8, stiffness: 300, damping: 25, initialVelocity: velocity)
  }
  /// A sheet's programmatic leave: stiffness 250.
  public static let sheetLeave = Animation.interpolatingSpring(mass: 0.8, stiffness: 250, damping: 25)
  /// A sheet's and its backdrop's fade: 250 ms in-out quad.
  public static let sheetFade = Animation.timingCurve(0.455, 0.03, 0.515, 0.955, duration: 0.25)
}

/// What is behind a sheet or a menu: the blur (dark, intensity 80) and the dim over it, both at
/// `progress` (the sheet's presence: 1 open, 0 gone, between while dragged).
public struct BloomBackdrop: View {
  let progress: Double
  let dim: Double
  @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

  public init(progress: Double, dim: Double = 0.7) {
    self.progress = progress
    self.dim = dim
  }

  public var body: some View {
    SwiftUI.ZStack {
      if reduceTransparency {
        // expo-blur's own reduce-transparency fill for a dark blur: rgba(25,25,25, 0.8 × 0.78).
        SwiftUI.Color(red: 25 / 255, green: 25 / 255, blue: 25 / 255).opacity(0.624 * progress)
      } else {
        Rectangle().fill(.regularMaterial).environment(\.colorScheme, .dark).opacity(progress)
      }
      SwiftUI.Color.black.opacity(dim * progress)
    }
    .ignoresSafeArea()
  }
}

/// A band of blur that fades out from an edge: ten stacked blurs, each anchored to the edge and
/// a shorter share of the band (100, 88 … 16%), so the blur is ten deep at the edge and one at
/// the far side, and the surface fill's tail over them.
public struct BloomProgressiveBlur: View {
  /// The ten layers' heights, as shares of the band.
  static let layers: [Double] = [1.0, 0.88, 0.76, 0.64, 0.54, 0.44, 0.36, 0.28, 0.22, 0.16]
  /// One layer: expo-blur's intensity 5 of 100, a light share of the system's thinnest material.
  static let layerOpacity = 0.1
  /// The tail: the surface fill at these opacities, from the edge out.
  static let tail: [(Double, Double)] = [(0.7, 0), (0.32, 0.42), (0.08, 0.68), (0, 0.88)]

  let edge: VerticalEdge
  let height: Double
  @Environment(\.bloomPalette) private var palette
  @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

  public init(edge: VerticalEdge = .bottom, height: Double) {
    self.edge = edge
    self.height = height
  }

  public var body: some View {
    let alignment: Alignment = edge == .bottom ? .bottom : .top
    let surface = palette.rgba(.background)
    SwiftUI.ZStack(alignment: alignment) {
      ForEach(Array(Self.layers.enumerated()), id: \.offset) { _, share in
        layer.frame(height: CGFloat(height * share))
      }
      LinearGradient(
        stops: Self.tail.map { Gradient.Stop(color: surface.color.opacity($0.0), location: CGFloat($0.1)) },
        startPoint: edge == .bottom ? .bottom : .top,
        endPoint: edge == .bottom ? .top : .bottom
      )
    }
    .frame(height: CGFloat(height), alignment: alignment)
    .allowsHitTesting(false)
  }

  @ViewBuilder private var layer: some View {
    if reduceTransparency {
      // expo-blur's flat tint for intensity 5.
      palette.scheme == .dark
        ? SwiftUI.Color(red: 25 / 255, green: 25 / 255, blue: 25 / 255).opacity(0.039)
        : SwiftUI.Color(red: 249 / 255, green: 249 / 255, blue: 249 / 255).opacity(0.039)
    } else {
      Rectangle().fill(.ultraThinMaterial).opacity(Self.layerOpacity).environment(\.colorScheme, palette.scheme)
    }
  }
}

/// The header's scrim: the page's fill, opaque behind the status bar, then fading by smoothstep
/// across the header row and 12 more, shown as the content scrolls under it (`progress`:
/// `clamp(scrollY / 20)`).
public struct BloomHeaderScrim: View {
  /// The header row under the status bar (Bloom's 56).
  public static let rowHeight = 56.0
  /// How far past the header the scrim runs (`OUTER_INSET`).
  public static let outerInset = 12.0
  /// How far the content scrolls before the scrim is whole (`scrollThreshold`).
  public static let threshold = 20.0

  let progress: Double
  let fill: BloomColor
  @Environment(\.bloomPalette) private var palette

  public init(progress: Double, fill: BloomColor = BloomColor(.background)) {
    self.progress = progress
    self.fill = fill
  }

  /// The scroll offset's share of the threshold, clamped (what drives `progress`).
  public static func progress(scrollY: Double, threshold: Double = threshold) -> Double {
    min(max(scrollY / max(threshold, 1), 0), 1)
  }

  /// EdgeScrim's stops: 17 smoothstep stops (`1 - t²(3 - 2t)`, rounded to 1e-4) after an opaque
  /// hold of `hold` (the status bar's share of the scrim).
  public static func stops(hold: Double) -> [(opacity: Double, location: Double)] {
    var out: [(Double, Double)] = hold > 0 ? [(1, 0)] : []
    for i in 0...16 {
      let t = Double(i) / 16
      let opacity = ((1 - t * t * (3 - 2 * t)) * 1e4).rounded() / 1e4
      out.append((opacity, hold + (1 - hold) * t))
    }
    return out
  }

  public var body: some View {
    GeometryReader { proxy in
      let top = Double(proxy.safeAreaInsets.top)
      let height = top + Self.rowHeight + Self.outerInset
      let hold = min(top, height) / height
      let color = palette.color(fill)
      LinearGradient(
        stops: Self.stops(hold: hold).map { Gradient.Stop(color: color.opacity($0.opacity), location: CGFloat($0.location)) },
        startPoint: .top,
        endPoint: .bottom
      )
      .frame(height: CGFloat(height))
      .opacity(progress)
      .ignoresSafeArea(edges: .top)
    }
    .allowsHitTesting(false)
  }
}

/// The scroll offset of the screen's scroll view, for the chrome over it (the header's scrim, the
/// tab bar's minimize): BloomUI's `ScrollView` and `VirtualList` set it.
public struct BloomScrollOffsetKey: PreferenceKey {
  public static let defaultValue = 0.0
  public static func reduce(value: inout Double, nextValue: () -> Double) {
    value = max(value, nextValue())
  }
}

extension View {
  /// Reports the scroll view's offset as `BloomScrollOffsetKey` (iOS 18's scroll geometry; on
  /// iOS 17 the content's frame in the scroll view's space).
  func bloomReportsScrollOffset(_ offset: Binding<Double>) -> some View {
    Group {
      if #available(iOS 18.0, macOS 15.0, *) {
        self.onScrollGeometryChange(for: Double.self, of: { Double($0.contentOffset.y + $0.contentInsets.top) }) { _, y in
          offset.wrappedValue = y
        }
      } else {
        self
      }
    }
    .preference(key: BloomScrollOffsetKey.self, value: offset.wrappedValue)
  }

  /// The header's scrim over the view, driven by its scroll view's offset.
  public func bloomHeaderScrim(fill: BloomColor = BloomColor(.background)) -> some View {
    overlayPreferenceValue(BloomScrollOffsetKey.self, alignment: .top) { y in
      BloomHeaderScrim(progress: BloomHeaderScrim.progress(scrollY: y), fill: fill)
    }
  }
}
#endif
