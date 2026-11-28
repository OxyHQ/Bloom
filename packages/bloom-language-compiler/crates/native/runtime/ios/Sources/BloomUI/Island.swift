// Islands: a natively compiled `.bloom` screen inside today's React Native app, as one native
// view (docs/native-runtime-api.mdx, "Islands"). The host passes the island's props as JSON
// (once, and again only when they change) and receives its events as JSON; the island's state
// lives in SwiftUI and it never calls TypeScript.
//
//     BloomIslands.register("Feed") { (props: FeedProps, emit: @escaping (FeedEvent) -> Void) in
//       FeedIsland(props: props, onEvent: emit)
//     }
//
// The React Native side is the `BloomIslandView` Fabric component
// (stdlib/Bloom/Native/BloomIsland/ios/), which hosts `BloomIslandController`.
#if canImport(SwiftUI)
import SwiftUI
import Bloom
import Foundation

/// An island's props, decoded; the view it draws; its events, encoded.
@MainActor
public enum BloomIslands {
  typealias Factory = (_ props: Data, _ emit: @escaping (String) -> Void) -> AnyView?

  private static var factories: [String: Factory] = [:]

  /// Registers the island `name`: its props' type, and the view drawn for them.
  public static func register<Props: Decodable, Event: Encodable, V: View>(
    _ name: String, _ make: @escaping (Props, @escaping (Event) -> Void) -> V
  ) {
    factories[name] = { data, emit in
      guard let props = try? JSONDecoder().decode(Props.self, from: data) else { return nil }
      let send: (Event) -> Void = { event in
        guard let bytes = try? JSONEncoder().encode(event), let text = String(data: bytes, encoding: .utf8) else { return }
        emit(text)
      }
      return AnyView(make(props, send))
    }
  }

  /// The island `name` drawn for `props` (JSON), or `nil` when it is unknown or its props do
  /// not decode.
  public static func view(_ name: String, props: String, emit: @escaping (String) -> Void) -> AnyView? {
    factories[name]?(Data(props.utf8), emit)
  }

  public static var registered: [String] { factories.keys.sorted() }
}

/// What a host draws: the island, in Bloom's theme, or nothing while it is unknown.
public struct BloomIslandRoot: View {
  let name: String
  let props: String
  let emit: (String) -> Void

  public init(name: String, props: String, emit: @escaping (String) -> Void) {
    self.name = name
    self.props = props
    self.emit = emit
  }

  public var body: some View {
    BloomThemeProvider {
      if let island = BloomIslands.view(name, props: props, emit: emit) { island } else { EmptyView() }
    }
  }
}

#if canImport(UIKit)
import UIKit

/// The island's view controller, which the Fabric component adds as a child: props in through
/// `update(name:props:)`, events out through `onEvent`.
@MainActor
public final class BloomIslandController: UIHostingController<BloomIslandRoot> {
  public var onEvent: ((String) -> Void)?
  private var name = ""
  private var props = "{}"

  public init() {
    super.init(rootView: BloomIslandRoot(name: "", props: "{}", emit: { _ in }))
    view.backgroundColor = .clear
    sizingOptions = [.intrinsicContentSize]
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("BloomIslandController is created in code") }

  /// New props (JSON) for the island `name`: only a change re-renders it.
  public func update(name: String, props: String) {
    guard name != self.name || props != self.props else { return }
    self.name = name
    self.props = props
    rootView = BloomIslandRoot(name: name, props: props) { [weak self] event in self?.onEvent?(event) }
  }
}
#endif
#endif
