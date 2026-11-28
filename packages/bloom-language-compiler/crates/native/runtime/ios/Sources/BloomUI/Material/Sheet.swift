// The detached sheet: today's Bloom sheet on iOS (src/bottom-sheet/BottomSheetBase.tsx,
// pan-dismiss.ts, src/dialog/SheetShell.tsx), which the system's `.sheet` cannot draw (it is
// attached to the screen's edges). It floats 16 from the sides and the bottom, rounded all round,
// on the one material, over `BloomBackdrop`; it rises with the sheet spring, follows a drag down
// (a drag up gives a third), and closes past the dismiss rule, the backdrop fading with it. Menus
// and selects present as this sheet on iOS, as today.
#if canImport(SwiftUI)
import SwiftUI

/// The sheet's numbers (today's), in points.
public enum BloomSheetMetrics {
  public static let gap = 16.0
  /// SheetShell's (menus, selects, context menus); the raw BottomSheet's is 24, a Dialog's 28.
  public static let radius = 20.0
  public static let maxWidth = 500.0
  public static let padding = 20.0
  /// The grabber: 35 × 5, radius 3, 8 from the top of a 20 tall strip, the foreground at 0.5.
  public static let grabber = (width: 35.0, height: 5.0, top: 8.0, strip: 20.0)
  /// The backdrop's dim (SheetShell and Dialog pass 0.7; the library's own default is 0.28).
  public static let dim = 0.7
  /// A drag above the rest moves the sheet a third as far.
  public static let overdrag = 0.3
  /// How far the sheet shrinks as it travels the screen's height (1 → 0.95).
  public static let travelScale = 0.05

  /// pan-dismiss.ts: close on a fling down, or past the distance unless flung back up.
  public static func closes(distance: Double, velocity: Double, screenHeight: Double) -> Bool {
    velocity > 900 || (distance > max(140, 0.25 * screenHeight) && velocity > -300)
  }
}

struct DetachedSheet<Body: View>: ViewModifier {
  @Binding var isPresented: Bool
  let radius: Double
  let maxWidth: Double
  let sheet: () -> Body
  /// How far below its rest the sheet is (its height when off screen).
  @State private var offset = 0.0
  @State private var height = 600.0
  @State private var shown = false
  @State private var opacity = 0.0
  @Environment(\.bloomPalette) private var palette

  func body(content: Content) -> some View {
    content
      .overlay {
        if shown {
          GeometryReader { proxy in
            layer(proxy)
          }
          .ignoresSafeArea()
        }
      }
      .onChange(of: isPresented, initial: true) { _, now in
        now ? present() : leave()
      }
  }

  private var progress: Double { opacity * min(max(1 - offset / max(height, 1), 0), 1) }

  private func layer(_ proxy: GeometryProxy) -> some View {
    let screen = Double(proxy.size.height)
    let width = Double(proxy.size.width)
    let side = max(BloomSheetMetrics.gap, (width - maxWidth) / 2)
    let bottom = max(Double(proxy.safeAreaInsets.bottom) + BloomSheetMetrics.gap, BloomSheetMetrics.gap)
    let shape = RoundedRectangle(cornerRadius: CGFloat(radius), style: .continuous)
    return SwiftUI.ZStack(alignment: .bottom) {
      BloomBackdrop(progress: progress, dim: BloomSheetMetrics.dim)
        .onTapGesture { isPresented = false }
      SwiftUI.VStack(spacing: 0) {
        Capsule()
          .fill(palette.color(BloomColor(.foreground, opacity: 0.5)))
          .frame(width: CGFloat(BloomSheetMetrics.grabber.width), height: CGFloat(BloomSheetMetrics.grabber.height))
          .padding(.top, CGFloat(BloomSheetMetrics.grabber.top))
          .frame(height: CGFloat(BloomSheetMetrics.grabber.strip), alignment: .top)
          .onTapGesture { isPresented = false }
          .accessibilityLabel("Close")
        sheet()
          .padding(CGFloat(BloomSheetMetrics.padding))
      }
      .frame(maxWidth: .infinity)
      .bloomMaterial(.glass(.regular, tint: .background, opacity: MaterialTokens.floatingTint), in: shape)
      .clipShape(shape)
      .background {
        GeometryReader { sheet in
          SwiftUI.Color.clear.onAppear { height = Double(sheet.size.height) + bottom }
        }
      }
      .padding(.horizontal, CGFloat(side))
      .padding(.bottom, CGFloat(bottom))
      .scaleEffect(CGFloat(1 - BloomSheetMetrics.travelScale * min(max(offset, 0) / max(screen, 1), 1)), anchor: .bottom)
      .offset(y: CGFloat(offset))
      .opacity(opacity)
      .gesture(drag(screen: screen))
    }
  }

  private func drag(screen: Double) -> some Gesture {
    DragGesture(minimumDistance: 8)
      .onChanged { value in
        let dy = Double(value.translation.height)
        var t = Transaction()
        t.disablesAnimations = true
        withTransaction(t) { offset = dy >= 0 ? dy : dy * BloomSheetMetrics.overdrag }
      }
      .onEnded { value in
        let distance = Double(value.translation.height)
        let velocity = Double(value.velocity.height)
        if BloomSheetMetrics.closes(distance: distance, velocity: velocity, screenHeight: screen) {
          isPresented = false
        } else {
          withAnimation(BloomMotion.sheet(velocity: velocity / max(height, 1))) { offset = 0 }
        }
      }
  }

  private func present() {
    guard !shown else { return }
    offset = height
    shown = true
    withAnimation(BloomMotion.sheet()) { offset = 0 }
    withAnimation(BloomMotion.sheetFade) { opacity = 1 }
  }

  private func leave() {
    guard shown else { return }
    withAnimation(BloomMotion.sheetFade) { opacity = 0 }
    withAnimation(BloomMotion.sheetLeave, completionCriteria: .logicallyComplete) {
      offset = height
    } completion: {
      if !isPresented { shown = false }
    }
  }
}

extension View {
  /// Presents `content` as Bloom's detached sheet while `isPresented` (a menu, a select, a
  /// sheet route). Applied at the root of what it covers (the navigation does).
  public func bloomDetachedSheet<Content: View>(
    isPresented: Binding<Bool>, radius: Double = BloomSheetMetrics.radius, maxWidth: Double = BloomSheetMetrics.maxWidth,
    @ViewBuilder content: @escaping () -> Content
  ) -> some View {
    modifier(DetachedSheet(isPresented: isPresented, radius: radius, maxWidth: maxWidth, sheet: content))
  }
}
#endif
