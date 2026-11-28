// `NavigationStack(root:tabs:sheets:) { route in … }`: the app's navigation over its typed
// `Routable` enum (stdlib/Bloom/Navigation.bloom). On iOS a stack is SwiftUI's
// `NavigationStack(path:)` and the tab bar is the system's (`TabView`: Liquid Glass on iOS 26);
// `push`, `replace` and `dismiss` drive the stack in front, as the router does today.
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

public struct NavigationStack<R: Hashable, Destination: View>: View {
  let root: R
  let tabs: [Bloom.Tab<R>]
  let sheets: [R]
  let destination: (R) -> Destination
  @State private var router = BloomRouter()

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
        .navigationDestination(for: AnyHashable.self) { route in
          if let r = route.base as? R { destination(r) }
        }
    }
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
