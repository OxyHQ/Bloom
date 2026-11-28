// Islands: a natively compiled `.bloom` module inside today's React Native app, as one native
// view (docs/native-runtime-api.mdx, "Islands"), with the contract Android's host has
// (`bloom build`'s `:bloom-islands`) and Mention's `FeedIslandList` uses:
//
// - the `BloomIsland` view, with props `island` (the registered name), `islandKey` (its keyed
//   channel), `props` (JSON), `themePreset` and `themeScheme`;
// - the `BloomIslands` native module: `setProps(key, json)` and `setTheme(key, preset, scheme)`,
//   a keyed island's data off React's commit;
// - events as `DeviceEventEmitter`'s `BloomIslandEvent`, `{ key, name, payload }`: the event
//   prop's name (`onIntent`) and its value's JSON.
//
// The compiled module registers itself (`FeedIsland__register()`, emitted beside the view named
// after the module); the island never calls TypeScript.
#if canImport(SwiftUI)
import SwiftUI
import Bloom
import Foundation
import Observation
import BloomTheme

/// The registered islands: each one's entry, which decodes its props (JSON) and draws it, its
/// events sent as `(name, payload JSON)`. The emitted `<Island>__register()` registers one.
@MainActor
public enum BloomIslands {
  public typealias Entry = (_ props: String, _ emit: @escaping (_ name: String, _ payload: String) -> Void) -> AnyView?
  private static var entries: [String: Entry] = [:]

  /// Registers the island `name` (`FeedIsland__register()` calls it with `FeedIsland__island`).
  public static func register(_ name: String, _ entry: @escaping Entry) { entries[name] = entry }

  /// A typed island, by hand: its props' type, the view drawn for them, its one event type.
  public static func register<Props: Decodable, Event: Encodable, V: View>(
    _ name: String, event: String = "onEvent", _ make: @escaping (Props, @escaping (Event) -> Void) -> V
  ) {
    entries[name] = { json, emit in
      guard let props = try? JSONDecoder().decode(Props.self, from: Data(json.utf8)) else { return nil }
      return AnyView(make(props) { value in
        guard let bytes = try? JSONEncoder().encode(value), let text = String(data: bytes, encoding: .utf8) else { return }
        emit(event, text)
      })
    }
  }

  /// The island `name` drawn for `props`, or `nil` when it is unknown or its props do not decode.
  public static func view(_ name: String, props: String, emit: @escaping (String, String) -> Void) -> AnyView? {
    entries[name]?(props, emit)
  }

  public static var registered: [String] { entries.keys.sorted() }
}

/// The keyed channel (the `BloomIslands` native module's `setProps(key, json)` and
/// `setTheme(key, preset, scheme)`): a keyed island's data and theme, set off React's commit, so
/// a feed's posts reach the island the moment the list has them. An island with an `islandKey`
/// draws the latest of these over its own `props`.
@MainActor @Observable
public final class BloomIslandStore {
  public static let shared = BloomIslandStore()
  var props: [String: String] = [:]
  var themes: [String: (preset: String?, scheme: String?)] = [:]

  public func setProps(_ key: String, _ json: String) {
    if props[key] != json { props[key] = json }
  }

  public func setTheme(_ key: String, preset: String?, scheme: String?) {
    themes[key] = (preset, scheme)
  }
}

/// What a host draws: the island in Bloom's theme (the app's preset and scheme, as React
/// Native's theme has them), or nothing while it is unknown.
public struct BloomIslandRoot: View {
  let name: String
  let key: String?
  let props: String
  let preset: String?
  let scheme: String?
  let emit: (String, String) -> Void

  public init(name: String, key: String? = nil, props: String, preset: String? = nil, scheme: String? = nil, emit: @escaping (String, String) -> Void) {
    self.name = name
    self.key = key
    self.props = props
    self.preset = preset
    self.scheme = scheme
    self.emit = emit
  }

  public var body: some View {
    let store = BloomIslandStore.shared
    let keyed = key.flatMap { store.props[$0] }
    let theme = key.flatMap { store.themes[$0] }
    let presetName = theme?.preset ?? preset
    let schemeName = theme?.scheme ?? scheme
    BloomThemeProvider(
      preset: presetName.flatMap { AppColorName(rawValue: $0) } ?? .oxy,
      scheme: schemeName == "dark" ? .dark : schemeName == "light" ? .light : .system
    ) {
      if let island = BloomIslands.view(name, props: keyed ?? props, emit: emit) { island } else { EmptyView() }
    }
  }
}

#if canImport(UIKit)
import UIKit

/// The island's view controller, which the `BloomIsland` Fabric component adds as a child:
/// props in through `update`, events out through `onEvent(name, payload)`.
@MainActor
public final class BloomIslandController: UIHostingController<BloomIslandRoot> {
  @objc public var onEvent: ((String, String) -> Void)?
  private var state = (name: "", key: "", props: "{}", preset: "", scheme: "")

  @objc public init() {
    super.init(rootView: BloomIslandRoot(name: "", props: "{}", emit: { _, _ in }))
    view.backgroundColor = .clear
    sizingOptions = [.intrinsicContentSize]
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("BloomIslandController is created in code") }

  /// New props for the island `name` (`key` reads the keyed channel; `""` for none): only a
  /// change re-renders it.
  @objc public func update(name: String, key: String, props: String, preset: String, scheme: String) {
    let next = (name, key, props, preset, scheme)
    guard next != state else { return }
    state = next
    rootView = BloomIslandRoot(
      name: name, key: key.isEmpty ? nil : key, props: props.isEmpty ? "{}" : props,
      preset: preset.isEmpty ? nil : preset, scheme: scheme.isEmpty ? nil : scheme
    ) { [weak self] event, payload in self?.onEvent?(event, payload) }
  }
}

/// The `BloomIslands` native module's Swift side, which BloomIslandsModule.mm calls.
@MainActor @objc(BloomIslandChannel)
public final class BloomIslandChannel: NSObject {
  @objc public static func setProps(_ key: String, json: String) { BloomIslandStore.shared.setProps(key, json) }
  @objc public static func setTheme(_ key: String, preset: String?, scheme: String?) {
    BloomIslandStore.shared.setTheme(key, preset: preset, scheme: scheme)
  }
}
#endif
#endif
