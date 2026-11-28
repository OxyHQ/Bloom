// The Foundation side of the provider (src/theme/BloomThemeProvider.tsx), persistence
// (persistence.ts), the ambient accent (ambient-store.ts) and colour scopes
// (color-scope/use-scope.ts): the selection a person makes, how it resolves to a palette, and
// how it is stored. BloomUI wraps these in SwiftUI (`BloomThemeProvider`, `ColorScope`,
// `@Observable AmbientTheme`); nothing here draws.
import Foundation

/// `ThemeMode`: the scheme selection.
public enum ThemeMode: String, CaseIterable, Codable, Sendable, Hashable {
  case light
  case dark
  case system
  /// The platform's own palette (Material You, iOS dynamic) over the preset; resolves like
  /// `system`, and BloomUI overlays the platform colours (`withFieldColors`).
  case adaptive
}

/// The provider's `increaseContrast` (and the system's setting): it reduces transparency and
/// gives every material a hairline edge. It does NOT change a preset's colours, in the
/// TypeScript either; a seed's M3 contrast level is `contrastLevel`.
public enum Contrast: String, Codable, Sendable, Hashable {
  case standard
  case increased
}

/// `DEFAULT_PRESET` and `DEFAULT_MODE` (BloomThemeProvider.tsx).
public enum BloomThemeDefaults {
  public static let preset: AppColorName = .oxy
  public static let mode: ThemeMode = .system
}

// MARK: - persistence.ts

/// `PersistedThemeState`: `{ mode?, colorPreset? }`, stored as the JSON `persistence.ts` writes,
/// so a theme saved by the React Native app is read here and the other way round.
public struct PersistedThemeState: Sendable, Hashable, Codable {
  public var mode: ThemeMode?
  public var colorPreset: AppColorName?

  public init(mode: ThemeMode? = nil, colorPreset: AppColorName? = nil) {
    self.mode = mode
    self.colorPreset = colorPreset
  }

  /// `parsePersistedTheme`: invalid members are dropped; nil when neither survives or the text
  /// is not a JSON object.
  public static func parse(_ raw: String?) -> PersistedThemeState? {
    guard let raw, let data = raw.data(using: .utf8),
      let object = try? JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed]),
      let dictionary = object as? [String: Any]
    else { return nil }
    let mode = (dictionary["mode"] as? String).flatMap(ThemeMode.init(rawValue:))
    let colorPreset = (dictionary["colorPreset"] as? String).flatMap(AppColorName.init(rawValue:))
    if mode == nil && colorPreset == nil { return nil }
    return PersistedThemeState(mode: mode, colorPreset: colorPreset)
  }

  /// `JSON.stringify(payload)` as `writePersistedTheme` builds it: `mode` first, absent members
  /// omitted.
  public func serialized() -> String {
    var members: [String] = []
    if let mode { members.append("\"mode\":\"\(mode.rawValue)\"") }
    if let colorPreset { members.append("\"colorPreset\":\"\(colorPreset.rawValue)\"") }
    return "{" + members.joined(separator: ",") + "}"
  }
}

/// `BloomThemeStorage`: where `{ mode, colorPreset }` lives (synchronous on native: UserDefaults
/// answers at once, so there is no hydration gate).
public protocol BloomThemeStorage: Sendable {
  func getItem(_ key: String) -> String?
  func setItem(_ key: String, _ value: String)
  func removeItem(_ key: String)
}

/// `BloomThemeStorage` on `UserDefaults`, under the app's own key (`<app>.bloom.theme`).
public struct UserDefaultsThemeStorage: BloomThemeStorage, @unchecked Sendable {
  private let defaults: UserDefaults

  public init(_ defaults: UserDefaults = .standard) { self.defaults = defaults }

  public func getItem(_ key: String) -> String? { defaults.string(forKey: key) }
  public func setItem(_ key: String, _ value: String) { defaults.set(value, forKey: key) }
  public func removeItem(_ key: String) { defaults.removeObject(forKey: key) }
}

/// `createBloomThemeStorage`'s pair: the app's key and its storage.
public struct BloomThemeStorageConfig: Sendable {
  public let persistKey: String
  public let storage: any BloomThemeStorage

  /// nil for an empty key, where the TypeScript throws.
  public init?(persistKey: String, storage: any BloomThemeStorage = UserDefaultsThemeStorage()) {
    guard !jsTrim(persistKey).isEmpty else { return nil }
    self.persistKey = persistKey
    self.storage = storage
  }

  /// `readPersistedTheme`.
  public func read() -> PersistedThemeState? { PersistedThemeState.parse(storage.getItem(persistKey)) }

  /// `writePersistedTheme`.
  public func write(_ state: PersistedThemeState) { storage.setItem(persistKey, state.serialized()) }

  /// `removePersistedTheme`.
  public func remove() { storage.removeItem(persistKey) }
}

// MARK: - ambient-store.ts

/// `AmbientThemeState`: the app-wide ambient override; a non-nil `seed` themes the whole app.
public struct AmbientThemeState: Sendable, Hashable, Codable {
  public var seed: String?
  public var secondary: String?
  public var tertiary: String?

  public init(seed: String? = nil, secondary: String? = nil, tertiary: String? = nil) {
    self.seed = seed
    self.secondary = secondary
    self.tertiary = tertiary
  }

  /// `EMPTY_STATE`.
  public static let empty = AmbientThemeState()
}

/// `AmbientAccents`.
public struct AmbientAccents: Sendable, Hashable {
  public var secondary: String?
  public var tertiary: String?

  public init(secondary: String? = nil, tertiary: String? = nil) {
    self.secondary = secondary
    self.tertiary = tertiary
  }
}

/// The ambient store with `ambient-store.ts`'s timing: `set`/`clear` coalesce through one
/// debounce (default 120 ms, 0 applies at once), a commit equal to the current state notifies
/// no one, and the latest call wins. BloomUI's `@Observable AmbientTheme` subscribes to it.
public final class AmbientThemeStore: @unchecked Sendable {
  /// `DEFAULT_DEBOUNCE_MS`.
  public static let defaultDebounce: TimeInterval = 0.120

  /// The one app-wide store, as the TypeScript module's.
  public static let shared = AmbientThemeStore()

  private let lock = NSLock()
  private let queue: DispatchQueue
  private var current = AmbientThemeState.empty
  /// The pending commit and its generation: a newer call supersedes an older timer.
  private var pending: (generation: Int, next: AmbientThemeState)?
  private var generation = 0
  private var listeners: [UUID: @Sendable (AmbientThemeState) -> Void] = [:]

  public init(queue: DispatchQueue = DispatchQueue(label: "so.oxy.bloom.ambient")) {
    self.queue = queue
  }

  /// `getState` / the snapshot.
  public var state: AmbientThemeState {
    lock.lock()
    defer { lock.unlock() }
    return current
  }

  /// `setAmbient(seed, accents)`.
  public func set(_ seed: String, accents: AmbientAccents? = nil, debounce: TimeInterval = defaultDebounce) {
    schedule(AmbientThemeState(seed: seed, secondary: accents?.secondary, tertiary: accents?.tertiary), debounce)
  }

  /// `clearAmbient()`.
  public func clear(debounce: TimeInterval = defaultDebounce) { schedule(.empty, debounce) }

  /// Subscribe; the returned token unsubscribes when cancelled.
  public func subscribe(_ listener: @escaping @Sendable (AmbientThemeState) -> Void) -> AmbientSubscription {
    let id = UUID()
    lock.lock()
    listeners[id] = listener
    lock.unlock()
    return AmbientSubscription { [weak self] in
      guard let self else { return }
      self.lock.lock()
      self.listeners[id] = nil
      self.lock.unlock()
    }
  }

  /// `__flushAmbientForTests`: run a pending commit now.
  public func flush() {
    lock.lock()
    let work = pending
    pending = nil
    lock.unlock()
    if let work { commit(work.next) }
  }

  private func schedule(_ next: AmbientThemeState, _ debounce: TimeInterval) {
    lock.lock()
    generation += 1
    let mine = generation
    pending = debounce <= 0 ? nil : (mine, next)
    lock.unlock()
    if debounce <= 0 {
      commit(next)
      return
    }
    queue.asyncAfter(deadline: .now() + debounce) { [weak self] in
      guard let self else { return }
      self.lock.lock()
      let work = self.pending
      let due = work?.generation == mine
      if due { self.pending = nil }
      self.lock.unlock()
      if due, let work { self.commit(work.next) }
    }
  }

  private func commit(_ next: AmbientThemeState) {
    lock.lock()
    if next == current {
      lock.unlock()
      return
    }
    current = next
    let targets = Array(listeners.values)
    lock.unlock()
    for listener in targets { listener(next) }
  }
}

/// Cancels an `AmbientThemeStore` subscription.
public final class AmbientSubscription: @unchecked Sendable {
  private let onCancel: () -> Void
  private var cancelled = false
  private let lock = NSLock()

  init(_ onCancel: @escaping () -> Void) { self.onCancel = onCancel }

  public func cancel() {
    lock.lock()
    let first = !cancelled
    cancelled = true
    lock.unlock()
    if first { onCancel() }
  }

  deinit { cancel() }
}

// MARK: - The provider's selection (BloomThemeProvider.tsx)

/// Everything the provider resolves a palette from. BloomUI fills `mode`/`colorPreset` from its
/// props, storage and the platform; `ambient` from `AmbientThemeStore`.
public struct ThemeSelection: Sendable, Hashable {
  public var mode: ThemeMode
  /// The app's preset (`livePreset`); nil draws `BloomThemeDefaults.preset`.
  public var colorPreset: AppColorName?
  /// A static dynamic seed (`seed` prop).
  public var seed: String?
  public var secondaryColor: String?
  public var tertiaryColor: String?
  /// nil: `tinted` (a desktop host passes `neutral`).
  public var surfaces: SurfaceTint?
  public var contrast: Contrast
  public var ambient: AmbientThemeState

  public init(
    mode: ThemeMode = BloomThemeDefaults.mode, colorPreset: AppColorName? = nil, seed: String? = nil,
    secondaryColor: String? = nil, tertiaryColor: String? = nil, surfaces: SurfaceTint? = nil,
    contrast: Contrast = .standard, ambient: AmbientThemeState = .empty
  ) {
    self.mode = mode
    self.colorPreset = colorPreset
    self.seed = seed
    self.secondaryColor = secondaryColor
    self.tertiaryColor = tertiaryColor
    self.surfaces = surfaces
    self.contrast = contrast
    self.ambient = ambient
  }

  /// The preset drawn.
  public var preset: AppColorName { colorPreset ?? BloomThemeDefaults.preset }

  /// The scheme drawn, given the system's (`resolved` in the provider).
  public func resolvedMode(system: ColorMode) -> ColorMode {
    switch mode {
    case .light: return .light
    case .dark: return .dark
    case .system, .adaptive: return system
    }
  }

  /// The effective dynamic seed: an ambient seed overrides the static one; an empty one is no
  /// seed (the provider tests it for truthiness).
  public var effectiveSeed: String? {
    let candidate = ambient.seed != nil ? ambient.seed : seed
    return candidate?.isEmpty == false ? candidate : nil
  }

  /// Ambient accents replace the static accent props entirely while ambient is active.
  public var effectiveSecondary: String? { ambient.seed != nil ? ambient.secondary : secondaryColor }
  public var effectiveTertiary: String? { ambient.seed != nil ? ambient.tertiary : tertiaryColor }

  /// `explicitAccents`: nil when nothing is pinned and the surfaces are tinted.
  public var explicitAccents: ExplicitAccents? {
    let tint = surfaces ?? .tinted
    if effectiveSecondary == nil && effectiveTertiary == nil && tint == .tinted { return nil }
    return ExplicitAccents(
      secondaryHex: effectiveSecondary, tertiaryHex: effectiveTertiary,
      surfaces: tint == .neutral ? .neutral : nil)
  }

  /// The provider's palette for a scheme (`palette`, or `resolveMode(nextMode)`).
  public func palette(_ resolved: ColorMode) -> ScopePalette {
    if let seed = effectiveSeed {
      return buildSeedPalette(
        seed, resolved, accents: SeedAccents(secondarySeed: effectiveSecondary, tertiarySeed: effectiveTertiary))
    }
    return buildPresetPalette(preset, resolved, accents: explicitAccents)
  }

  /// The root's `resolvePreset(nextPreset, nextMode)`: a scope that inherits asks for the
  /// document preset under the app's seed or accents.
  public func resolvePreset(_ nextPreset: AppColorName, _ resolved: ColorMode) -> ScopePalette {
    if let seed = effectiveSeed {
      return buildSeedPalette(
        seed, resolved, accents: SeedAccents(secondarySeed: effectiveSecondary, tertiarySeed: effectiveTertiary))
    }
    return explicitAccents == nil
      ? getPrepaintPalette(nextPreset, resolved) : buildPresetPalette(nextPreset, resolved, accents: explicitAccents)
  }

  /// What persistence stores of this selection.
  public var persisted: PersistedThemeState { PersistedThemeState(mode: mode, colorPreset: colorPreset) }
}

private let prepaintCache = BoundedCache<String, ScopePalette>(limit: 512)

/// `getPrepaintPalette`: a preset's palette, shared (named presets are a finite registry).
public func getPrepaintPalette(_ preset: AppColorName, _ mode: ColorMode) -> ScopePalette {
  prepaintCache.value(preset.rawValue + "/" + mode.rawValue) { BloomThemeTokens.palette(preset, mode) }
}

// MARK: - Colour scopes (color-scope/use-scope.ts)

/// One `BloomColorScope`'s props: a preset or an exact seed (the seed wins), a local scheme,
/// exact canonical colours. A scope with none of them publishes nothing of its own.
public struct ColorScope: Sendable {
  public var colorPreset: AppColorName?
  public var seed: String?
  public var mode: ColorMode?
  public var tokens: BloomColorScopeTokens?

  public init(
    colorPreset: AppColorName? = nil, seed: String? = nil, mode: ColorMode? = nil,
    tokens: BloomColorScopeTokens? = nil
  ) {
    self.colorPreset = colorPreset
    self.seed = seed
    self.mode = mode
    self.tokens = tokens
  }

  var isActive: Bool { seed != nil || colorPreset != nil || mode != nil || tokens != nil }
}

/// The provider and the scopes above a subtree, nearest last: `resolved()` is the palette that
/// subtree draws, exactly as nested `BloomColorScope`s resolve it.
public struct ScopeStack: Sendable {
  public var root: ThemeSelection
  /// The system's scheme.
  public var system: ColorMode
  public var scopes: [ColorScope]

  public init(root: ThemeSelection, system: ColorMode, scopes: [ColorScope] = []) {
    self.root = root
    self.system = system
    self.scopes = scopes
  }

  /// The palette and the scheme the innermost subtree draws.
  public func resolved() throws -> ScopePalette { try level(scopes.count).palette }

  private struct Level {
    let palette: ScopePalette
    /// The context's preset (`BloomThemeContext.colorPreset`).
    let contextPreset: AppColorName
    /// `resolvePreset`, nil at the root (which has its own).
    let resolvePreset: (AppColorName, ColorMode) throws -> ScopePalette
  }

  private func level(_ depth: Int) throws -> Level {
    let rootMode = root.resolvedMode(system: system)
    if depth == 0 {
      return Level(
        palette: root.palette(rootMode), contextPreset: root.preset,
        resolvePreset: { preset, mode in root.resolvePreset(preset, mode) })
    }
    let parent = try level(depth - 1)
    let scope = scopes[depth - 1]
    guard scope.isActive else { return parent }
    let resolvePreset: (AppColorName, ColorMode) throws -> ScopePalette = { preset, resolved in
      let base: ScopePalette
      if let seed = scope.seed {
        base = buildSeedPalette(seed, resolved)
      } else if let own = scope.colorPreset {
        base = buildPresetPalette(own, resolved)
      } else {
        base = try parent.resolvePreset(preset, resolved)
      }
      return try applyScopeTokens(base, scope.tokens)
    }
    let mode = scope.mode ?? parent.palette.theme.mode
    let contextPreset = scope.seed != nil ? parent.contextPreset : (scope.colorPreset ?? parent.contextPreset)
    return Level(
      palette: try resolvePreset(parent.contextPreset, mode), contextPreset: contextPreset,
      resolvePreset: resolvePreset)
  }
}
