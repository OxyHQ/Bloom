// Bloom (navigation), the model without SwiftUI: `Routable` routes, their paths and deep
// links (`routing.ts`'s `routePath` / `routeOfPath`), `Tab`, and the router's stack, tabs and
// sheets (`router.ts`'s `RouterStore`) as a value, `RouterState`. BloomUI draws them and owns
// `NavigationStack`, `push`, `replace` and `dismiss`.
//
// `bloom build` reads the app's `Routable` enum; the emitter writes its conformance:
//
//     enum Route: Routable {
//       case feed, post(id: String), settings
//       static let routeTable = RouteTable(root: "feed", routes: ["feed": [], "post": ["id"], "settings": []])
//       var routeTag: String { switch self { case .feed: "feed"; case .post: "post"; case .settings: "settings" } }
//       var routeValues: [String] { if case .post(let id) = self { [id] } else { [] } }
//       static func route(tag: String, params: OrderedDictionary<String, String>) -> Route? {
//         switch tag { case "feed": .feed; case "post": params["id"].map { .post(id: $0) }; case "settings": .settings; default: nil }
//       }
//     }
import Foundation

/// An enum whose cases are the app's screens: `NavigationStack`'s routes.
public protocol Routable: Hashable, Sendable {
  /// The root case and every case's associated values' labels, in order.
  static var routeTable: RouteTable { get }
  /// The case's name.
  var routeTag: String { get }
  /// The associated values as text, in their labels' order (`String(describing:)` of each).
  var routeValues: [String] { get }
  /// The case `tag` with the parameters a path held (the case's reader types them), or `none`.
  static func route(tag: String, params: OrderedDictionary<String, String>) -> Self?
}

/// The app's route table, from its `Routable` enum.
public struct RouteTable: Equatable, Hashable, Sendable {
  /// The root case (the stack's first screen, `/`).
  public let root: String
  /// Every case, with its associated values' labels in order (its path's parameters).
  public let routes: OrderedDictionary<String, [String]>

  public init(root: String, routes: OrderedDictionary<String, [String]>) {
    self.root = root
    self.routes = routes
  }
}

/// A case's path: `/` for the root, `/post/42` for `post(id: "42")` (each value
/// percent-encoded as `encodeURIComponent`).
public func routePath(tag: String, values: [String], table: RouteTable) -> String {
  if tag == table.root { return "/" }
  return "/" + ([tag] + values.map(percentEncoded)).joined(separator: "/")
}

/// The route a path names (`/post/42`, `post/42`, a deep link's `demo://post/42` or a web URL's
/// `https://host/post/42?x=1`), the inverse of `routePath`; `none` when it names none. Each
/// parameter is the string the path holds.
public func routeOfPath(_ path: String, table: RouteTable) -> (tag: String, params: OrderedDictionary<String, String>)? {
  var rest = Substring(path)
  if let end = schemePrefixEnd(rest) {
    let scheme = rest[..<end].lowercased()
    rest = rest[end...]
    // A web URL's host is not a route; a custom scheme's "host" is the route's first segment.
    if scheme == "http://" || scheme == "https://" { rest = rest[(rest.firstIndex(of: "/") ?? rest.startIndex)...] }
  }
  if let cut = rest.firstIndex(where: { $0 == "?" || $0 == "#" }) { rest = rest[..<cut] }
  let segments = rest.split(separator: "/").map(String.init)
  guard let tag = segments.first else { return (table.root, [:]) }
  let values = segments.dropFirst()
  guard let labels = table.routes[tag], labels.count == values.count else { return nil }
  var params = OrderedDictionary<String, String>()
  for (label, value) in zip(labels, values) {
    guard let decoded = decodeURIComponent(value) else { return nil }
    params[label] = decoded
  }
  return (tag, params)
}

/// The end of a leading `scheme://` (JS's `/^[a-z][a-z0-9+.-]*:\/\//i`).
private func schemePrefixEnd(_ s: Substring) -> Substring.Index? {
  guard let first = s.first, first.isASCII, first.isLetter else { return nil }
  var i = s.index(after: s.startIndex)
  while i < s.endIndex, s[i].isASCII, s[i].isLetter || s[i].isNumber || "+.-".contains(s[i]) { i = s.index(after: i) }
  guard s[i...].hasPrefix("://") else { return nil }
  return s.index(i, offsetBy: 3)
}

extension Routable {
  /// The route's address (`"/post/42"`): what a deep link or a web URL to it reads.
  public var path: String { routePath(tag: routeTag, values: routeValues, table: Self.routeTable) }

  /// The route `path` names (a path, a deep link, a web URL), or `none`.
  public init?(path: String) {
    guard let found = routeOfPath(path, table: Self.routeTable), let route = Self.route(tag: found.tag, params: found.params) else {
      return nil
    }
    self = route
  }
}

/// The address of `route` (`"/post/42"`).
public func href<R: Routable>(_ route: R) -> String { route.path }

/// A page of the tab bar: its route (a case without associated values), its title and its icon
/// (a Bloom icon name, `"home"`). Named as Bloom names it; generated code that also imports
/// SwiftUI (whose `Tab` is a view) spells this one `Bloom.Tab` where both are visible.
public struct Tab<R> {
  public let route: R
  public let title: String
  public let icon: String

  public init(route: R, title: String, icon: String) {
    self.route = route
    self.title = title
    self.icon = icon
  }
}

extension Tab: Sendable where R: Sendable {}
extension Tab: Equatable where R: Equatable {}
extension Tab: Hashable where R: Hashable {}

/// The router's state (`router.ts`'s `RouterStore`, as a value): the stack's entries (the root
/// first) and the tab in front. `push` of a tab or the root selects it; a `sheets:` route is
/// presented as a sheet; a deep link opens its route over the root.
public struct RouterState<R: Routable>: Hashable, Sendable {
  public struct Entry: Hashable, Sendable, Identifiable {
    /// Stable per entry (`root`, `post-3`).
    public let key: String
    public let route: R
    public let sheet: Bool
    public var id: String { key }
  }

  public let root: R
  public let tabs: [Tab<R>]
  public let sheets: [R]
  public private(set) var entries: [Entry] = []
  /// The tab in front (the root's tag without tabs).
  public private(set) var tab: String
  private var next = 0

  public init(root: R, tabs: [Tab<R>] = [], sheets: [R] = []) {
    self.root = root
    self.tabs = tabs
    self.sheets = sheets
    tab = root.routeTag
    entries = [entry(root)]
  }

  private mutating func entry(_ route: R) -> Entry {
    let tag = route.routeTag
    let key = tag == root.routeTag && next == 0 ? "root" : "\(tag)-\(next)"
    next += 1
    return Entry(key: key, route: route, sheet: sheets.contains { $0.routeTag == tag })
  }

  private func isTab(_ tag: String) -> Bool { tabs.contains { $0.route.routeTag == tag } }

  /// The routes over the root, in order (`NavigationStack(path:)`'s path, sheets included).
  public var path: [R] { entries.dropFirst().map(\.route) }

  /// Shows the tab `tag`, over nothing.
  public mutating func selectTab(_ tag: String) {
    guard let first = entries.first else { return }
    if tab == tag && entries.count == 1 { return }
    entries = [first]
    tab = tag
  }

  /// Goes to `route`: pushed, presented when it is a sheet, selected when it is a tab or the root.
  public mutating func push(_ route: R) {
    let tag = route.routeTag
    if isTab(tag) || tag == root.routeTag {
      selectTab(tag)
      return
    }
    entries.append(entry(route))
  }

  /// Goes to `route` in place of the screen in front.
  public mutating func replace(_ route: R) {
    let tag = route.routeTag
    if entries.count <= 1 || isTab(tag) || tag == root.routeTag {
      push(route)
      return
    }
    entries[entries.count - 1] = entry(route)
  }

  /// Back: the route in front, then the first tab. False when there is nowhere to go back to.
  @discardableResult
  public mutating func back() -> Bool {
    if entries.count > 1 {
      entries.removeLast()
      return true
    }
    if !tabs.isEmpty && tab != root.routeTag {
      selectTab(root.routeTag)
      return true
    }
    return false
  }

  /// The platform removed `key` (a sheet swiped away): it and what was over it go.
  public mutating func dismissed(_ key: String) {
    if let at = entries.firstIndex(where: { $0.key == key }), at > 0 { entries.removeSubrange(at...) }
  }

  /// A deep link or web URL: the route its path names, over the root. Whether it named one.
  @discardableResult
  public mutating func open(_ url: String) -> Bool {
    guard let route = R(path: url), let first = entries.first else { return false }
    let tag = route.routeTag
    if isTab(tag) || tag == root.routeTag {
      entries = [first]
      tab = tag
    } else {
      entries = [first, entry(route)]
    }
    return true
  }
}

// `NavigationStack`, `push`, `replace` and `dismiss` are BloomUI's (MainActor UI state over
// `RouterState`); only the pure model is here.
