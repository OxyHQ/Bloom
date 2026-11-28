import Foundation
import Testing
@testable import Bloom

enum Route: Routable {
  case feed
  case post(id: String)
  case profile(user: String, tab: String)
  case settings

  static let routeTable = RouteTable(root: "feed", routes: ["feed": [], "post": ["id"], "profile": ["user", "tab"], "settings": []])

  var routeTag: String {
    switch self {
    case .feed: "feed"
    case .post: "post"
    case .profile: "profile"
    case .settings: "settings"
    }
  }

  var routeValues: [String] {
    switch self {
    case .post(let id): [id]
    case .profile(let user, let tab): [user, tab]
    default: []
    }
  }

  static func route(tag: String, params: OrderedDictionary<String, String>) -> Route? {
    switch tag {
    case "feed": .feed
    case "post": params["id"].map { .post(id: $0) }
    case "profile": params["user"].flatMap { u in params["tab"].map { .profile(user: u, tab: $0) } }
    case "settings": .settings
    default: nil
    }
  }
}

@Suite struct NavigationTests {
  @Test func pathsAsRoutingTS() {
    let f = Fixtures.intl.routing
    let table = RouteTable(root: f.table.root, routes: OrderedDictionary(f.table.routes))
    for c in f.routes {
      let labels = table.routes[c.route.tag] ?? []
      #expect(routePath(tag: c.route.tag, values: labels.map { c.route.values[$0] ?? "" }, table: table) == c.path)
    }
    for c in f.paths {
      let found = routeOfPath(c.path, table: table)
      #expect(found?.tag == c.route?.tag, "\(c.path)")
      #expect(found.map { $0.params.dictionary } == c.route?.params, "\(c.path)")
    }
  }

  @Test func routesAndDeepLinks() {
    #expect(href(Route.post(id: "4 2")) == "/post/4%202")
    #expect(Route.feed.path == "/")
    #expect(Route(path: "demo://post/42") == .post(id: "42"))
    #expect(Route(path: "https://mention.earth/profile/ana/likes?x=1") == .profile(user: "ana", tab: "likes"))
    #expect(Route(path: "/nope/1") == nil)
    #expect(Route(path: "/post/%E0%A4%A") == nil)
    let tab = Tab(route: Route.feed, title: "Home", icon: "home")
    #expect(tab.route == .feed)
  }

  @Test func routerState() {
    var r = RouterState(root: Route.feed, tabs: [Tab(route: .feed, title: "Home", icon: "home"), Tab(route: .settings, title: "Settings", icon: "settings")], sheets: [])
    #expect(r.entries.map(\.key) == ["root"])
    r.push(.post(id: "1"))
    r.push(.post(id: "2"))
    #expect(r.path == [.post(id: "1"), .post(id: "2")])
    r.replace(.profile(user: "a", tab: "b"))
    #expect(r.path == [.post(id: "1"), .profile(user: "a", tab: "b")])
    let moved1 = r.back()
    #expect(moved1)
    #expect(r.path == [.post(id: "1")])
    r.push(.settings)
    #expect(r.tab == "settings" && r.path.isEmpty)
    let moved2 = r.back()
    #expect(moved2)
    #expect(r.tab == "feed")
    let moved3 = r.back()
    #expect(!moved3)
    let moved4 = r.open("demo://post/9")
    #expect(moved4)
    #expect(r.path == [.post(id: "9")])
    let moved5 = r.open("demo://nope")
    #expect(!moved5)
    let key = r.entries[1].key
    r.dismissed(key)
    #expect(r.path.isEmpty)

    var s = RouterState(root: Route.feed, sheets: [.settings])
    s.push(.settings)
    #expect(s.entries.last?.sheet == true)
    s.push(.post(id: "x"))
    s.dismissed(s.entries[1].key)
    #expect(s.entries.count == 1)
  }
}
