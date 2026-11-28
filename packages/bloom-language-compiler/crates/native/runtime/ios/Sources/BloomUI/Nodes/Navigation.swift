// `NavigationStack(root:tabs:sheets:) { route in … }`: the app's navigation over its typed
// `Routable` enum (stdlib/Bloom/Navigation.bloom). On iOS a stack is SwiftUI's
// `NavigationStack(path:)` (the system's header, Liquid Glass on iOS 26) with Bloom's scrim
// under it; the tab bar is Bloom's (Material/TabBar.swift: scrubbable, a haptic per tab, on the
// one material, over the progressive blur band), or the system's `TabView` with
// `.bloomTabBarStyle(.system)` (for the side-by-side recordings); `push`, `replace` and
// `dismiss` drive the stack in front, as the router does today.
#if canImport(SwiftUI)
import SwiftUI
import Observation
import Bloom

/// The navigation state of the app: each tab's stack, the selected tab, the sheet in front.
@MainActor @Observable
public final class BloomRouter {
  /// The router of the app's `NavigationStack` (the one `push(_:)` drives).
  public static var current: BloomRouter? = nil

  var paths: [Int: [AnyHashable]] = [:]
  var selected = 0
  var sheet: AnyHashable? = nil
  var sheetRoutes: Set<AnyHashable> = []

  public init() {}

  func push(_ route: AnyHashable) {
    if sheetRoutes.contains(route) {
      sheet = route
    } else {
      paths[selected, default: []].append(route)
    }
  }

  func replace(_ route: AnyHashable) {
    var path = paths[selected, default: []]
    if !path.isEmpty { path.removeLast() }
    path.append(route)
    paths[selected] = path
  }

  func back() {
    if sheet != nil {
      sheet = nil
    } else if var path = paths[selected], !path.isEmpty {
      path.removeLast()
      paths[selected] = path
    }
  }
}

/// Goes to `route`: pushed, or presented when it is one of the stack's `sheets:`.
@MainActor public func push<R: Hashable>(_ route: R) { BloomRouter.current?.push(AnyHashable(route)) }

/// Goes to `route` in place of the screen in front.
@MainActor public func replace<R: Hashable>(_ route: R) { BloomRouter.current?.replace(AnyHashable(route)) }

/// Back to the screen under this one (or closes the sheet in front).
@MainActor public func dismiss() { BloomRouter.current?.back() }

/// Whose tab bar the navigation draws.
public enum BloomTabBarStyle: Sendable { case bloom, system }

struct TabBarStyleKey: EnvironmentKey {
  static let defaultValue = BloomTabBarStyle.bloom
}

extension EnvironmentValues {
  public var bloomTabBarStyle: BloomTabBarStyle {
    get { self[TabBarStyleKey.self] }
    set { self[TabBarStyleKey.self] = newValue }
  }
}

extension View {
  /// Bloom's own tab bar (the default) or the system's.
  public func bloomTabBarStyle(_ style: BloomTabBarStyle) -> some View { environment(\.bloomTabBarStyle, style) }
}

public struct NavigationStack<R: Hashable, Destination: View>: View {
  let root: R
  let tabs: [Bloom.Tab<R>]
  let sheets: [R]
  let destination: (R) -> Destination
  @State private var router = BloomRouter()
  @Environment(\.bloomTabBarStyle) private var tabBarStyle

  public init(root: R, tabs: [Bloom.Tab<R>] = [], sheets: [R] = [], @ViewBuilder destination: @escaping (R) -> Destination) {
    self.root = root
    self.tabs = tabs
    self.sheets = sheets
    self.destination = destination
  }

  public var body: some View {
    Group {
      if tabs.isEmpty {
        stack(0, root)
      } else if tabBarStyle == .bloom {
        SwiftUI.ZStack {
          ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
            let front = router.selected == index
            stack(index, tab.route)
              // The bar claims the bottom edge at its expanded height (the content scrolls
              // under it, and ends above it).
              .safeAreaInset(edge: .bottom, spacing: 0) {
                SwiftUI.Color.clear.frame(height: CGFloat(BloomTabBarMetrics.height))
              }
              .opacity(front ? 1 : 0)
              .allowsHitTesting(front)
              .accessibilityHidden(!front)
              // Only the tab in front drives the chrome.
              .transformPreference(BloomScrollOffsetKey.self) { if !front { $0 = 0 } }
          }
        }
        .overlayPreferenceValue(BloomScrollOffsetKey.self, alignment: .bottom) { y in
          TabBarHost(
            items: tabs.map { BloomTabItem($0.title, glyph: TabGlyph.named($0.icon, selected: false), selected: TabGlyph.named($0.icon, selected: true)) },
            selection: $router.selected,
            scrollY: y)
        }
      } else {
        TabView(selection: $router.selected) {
          ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
            stack(index, tab.route)
              .tabItem {
                Icon(TabGlyph.named(tab.icon, selected: router.selected == index))
                SwiftUI.Text(verbatim: tab.title)
              }
              .tag(index)
          }
        }
      }
    }
    .onAppear {
      router.sheetRoutes = Set(sheets.map { AnyHashable($0) })
      BloomRouter.current = router
    }
  }

  private func stack(_ index: Int, _ start: R) -> some View {
    let path = Binding<[AnyHashable]>(
      get: { router.paths[index] ?? [] },
      set: { router.paths[index] = $0 })
    return SwiftUI.NavigationStack(path: path) {
      destination(start)
        .bloomHeaderScrim()
        .navigationDestination(for: AnyHashable.self) { route in
          if let r = route.base as? R { destination(r).bloomHeaderScrim() }
        }
    }
  }
}

/// The tab bar over the stacks: the progressive blur band under it, the bar 16 above the bottom
/// (or the home indicator's inset), minimized as the screen in front scrolls.
struct TabBarHost: View {
  let items: [BloomTabItem]
  @Binding var selection: Int
  let scrollY: Double
  @State private var minimizer = BloomTabBarMinimizer()
  @State private var minimized = 0.0
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  var body: some View {
    GeometryReader { proxy in
      let inset = Double(proxy.safeAreaInsets.bottom)
      let bottom = max(inset, 16)
      SwiftUI.ZStack(alignment: .bottom) {
        BloomProgressiveBlur(edge: .bottom, height: bottom + BloomTabBarMetrics.height + BloomTabBarMetrics.blurBleed)
        BloomTabBar(items, selection: $selection, minimized: minimized)
          .padding(.bottom, CGFloat(bottom - inset))
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
      .ignoresSafeArea(edges: .bottom)
      .padding(.bottom, CGFloat(inset))
    }
    .onChange(of: scrollY) { _, y in
      guard let target = minimizer.target(scrolledTo: y), target != minimized else { return }
      if reduceMotion {
        minimized = target
      } else {
        withAnimation(BloomMotion.expand) { minimized = target }
      }
    }
    .onChange(of: selection) { _, _ in withAnimation(BloomMotion.expand) { minimized = 0 } }
  }
}

/// A tab's glyph by its Bloom icon name (`"home"`), filled when selected.
enum TabGlyph {
  static func named(_ name: String, selected: Bool) -> Glyph {
    switch (name, selected) {
    case ("home", false): .home
    case ("home", true): .homeFill
    case ("settings", false): .settings3
    case ("settings", true): .settings3Fill
    case ("search", false): .search
    case ("search", true): .searchFill
    case ("notification", false), ("notifications", false): .notification
    case ("notification", true), ("notifications", true): .notificationFill
    case ("user", false), ("profile", false): .user
    case ("user", true), ("profile", true): .userFill
    default: .home
    }
  }
}
#endif
