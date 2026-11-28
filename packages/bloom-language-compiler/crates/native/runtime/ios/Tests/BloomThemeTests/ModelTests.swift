// The contracts the TypeScript suites hold, held here too: preset/seed parity, the generated
// tables against the search they cache, JavaScript number semantics, persistence, the ambient
// store's timing and nested colour scopes.
import Foundation
import Testing
@testable import BloomTheme

@Suite struct Parity {
  /// seed-scope-parity.test.ts: a preset without a drawn scheme is its seed recipe.
  @Test func seedPathReproducesEveryDerivedPreset() {
    for name in AppColorName.allCases where name.preset.tokens == nil {
      let p = name.preset
      for mode in ColorMode.allCases {
        let fromSeed = buildSeedScopeVars(SeedScopeOptions(
          seed: p.hex, mode: mode, variant: p.variant, secondarySeed: p.secondaryHex, tertiarySeed: p.tertiaryHex))
        #expect(fromSeed == buildScopeVars(name, mode), "\(name)/\(mode)")
      }
    }
  }

  /// preset-accent-hues.test.ts: the generated table IS the search, to the bit.
  @Test func presetAccentHueTableEqualsTheSearch() {
    for preset in BloomThemeData.colorPresetRegistry {
      let hue = Hct.fromInt(argbFromHex(preset.hex)).hue
      let table = BloomThemeData.presetAccentHues[preset.hex.lowercased()]
      #expect(table == deriveAccentHues(hue), "\(preset.name)")
    }
  }

  @Test func registryShape() {
    #expect(AppColorName.allCases.count == BloomThemeData.colorPresetRegistry.count)
    #expect(BloomThemeData.colorPresetRegistry.map(\.name) == AppColorName.allCases)
    #expect(AppColorName.named(hex: "#1D9BF0") == .blue)
    #expect(AppColorName.named(hex: "#000001") == .teal)
    #expect(CanonicalToken.allCases.first == .background)
    #expect(BloomTokenData.colorFields.count == 43)
    #expect(Set(BloomThemeData.handleColorNames).contains(.oxy))
  }

  @Test func facadeIsThePipeline() {
    #expect(BloomTheme.resolve(preset: .teal, mode: .dark) == buildTheme(.teal, .dark))
    #expect(BloomTheme.resolve(preset: .teal, mode: .dark, contrast: .increased) == buildTheme(.teal, .dark))
    #expect(BloomTheme.fromSeed("#ff8800", mode: .light, contrastLevel: 1)
      == buildThemeFromSeed("#ff8800", .light, contrastLevel: 1))
    #expect(BloomTheme.resolve(preset: .mono, mode: .light).gradients.count == 7)
  }
}

@Suite struct JavaScriptNumbers {
  @Test func mathRound() {
    #expect(jsRound(2.5) == 3)
    #expect(jsRound(-2.5) == -2)
    #expect(jsRound(0.49999999999999994) == 0)
    #expect(jsRound(-0.4).sign == .minus)
    #expect(jsRound(1.5) == 2)
  }

  @Test func numberToString() {
    let cases: [(Double, String)] = [
      (1, "1"), (0.13, "0.13"), (-0, "0"), (0.00001, "0.00001"), (0.000001, "0.000001"), (1e-7, "1e-7"),
      (123456789012345680000, "123456789012345680000"), (1e21, "1e+21"), (1.5e300, "1.5e+300"),
      (27.408225137158738, "27.408225137158738"), (-12.5, "-12.5"), (5e-324, "5e-324"), (100, "100"),
    ]
    for (value, text) in cases { #expect(jsNumberString(value) == text, "\(value)") }
  }

  @Test func toFixedBreaksTiesUp() {
    #expect(jsToFixed(0.03125, 4) == "0.0313")
    #expect(jsToFixed(0.12345, 4) == "0.1235" || jsToFixed(0.12345, 4) == "0.1234")  // not a tie in binary
    #expect(jsToFixed(1.0005, 3) == "1.000")  // 1.0005 is below the tie in binary
    #expect(jsToFixed(0.5, 0) == "1")
    #expect(jsToFixed(2.5, 0) == "3")
  }

  @Test func parsing() {
    #expect(jsParseFloat("12.5% ") == 12.5)
    #expect(jsParseFloat(".5deg") == 0.5)
    #expect(jsParseFloat("x").isNaN)
    #expect(jsNumber(" 12 ") == 12)
    #expect(jsNumber("12px").isNaN)
    #expect(jsNumber("") == 0)
    #expect(argbFromHex("#abc") == 0xABC)
    #expect(argbFromHex("#1d9bf0") == 0xFF1D_9BF0)
  }
}

@Suite struct Persistence {
  final class MemoryStorage: BloomThemeStorage, @unchecked Sendable {
    var items: [String: String] = [:]
    func getItem(_ key: String) -> String? { items[key] }
    func setItem(_ key: String, _ value: String) { items[key] = value }
    func removeItem(_ key: String) { items[key] = nil }
  }

  /// The JSON `persistence.ts` writes and reads, member for member.
  @Test func sameJSONAsTheTypeScript() {
    #expect(PersistedThemeState(mode: .dark, colorPreset: .teal).serialized() == #"{"mode":"dark","colorPreset":"teal"}"#)
    #expect(PersistedThemeState(colorPreset: .forestFire).serialized() == #"{"colorPreset":"forest-fire"}"#)
    #expect(PersistedThemeState().serialized() == "{}")
    #expect(PersistedThemeState.parse(#"{"colorPreset":"teal","mode":"adaptive"}"#) == PersistedThemeState(mode: .adaptive, colorPreset: .teal))
    #expect(PersistedThemeState.parse(#"{"mode":"sepia","colorPreset":"blue"}"#) == PersistedThemeState(colorPreset: .blue))
    #expect(PersistedThemeState.parse(#"{"mode":"sepia"}"#) == nil)
    #expect(PersistedThemeState.parse("not json") == nil)
    #expect(PersistedThemeState.parse("[]") == nil)
    #expect(PersistedThemeState.parse("") == nil)
    #expect(PersistedThemeState.parse(nil) == nil)
  }

  @Test func storageRoundTrip() throws {
    let storage = MemoryStorage()
    let config = try #require(BloomThemeStorageConfig(persistKey: "noted.bloom.theme", storage: storage))
    config.write(PersistedThemeState(mode: .light, colorPreset: .mono))
    #expect(storage.items["noted.bloom.theme"] == #"{"mode":"light","colorPreset":"mono"}"#)
    #expect(config.read() == PersistedThemeState(mode: .light, colorPreset: .mono))
    config.remove()
    #expect(config.read() == nil)
    #expect(BloomThemeStorageConfig(persistKey: "  ", storage: storage) == nil)
  }

  @Test func userDefaultsAdapter() {
    let defaults = UserDefaults(suiteName: "so.oxy.bloom.theme.tests")!
    let storage = UserDefaultsThemeStorage(defaults)
    storage.setItem("k", "{}")
    #expect(storage.getItem("k") == "{}")
    storage.removeItem("k")
    #expect(storage.getItem("k") == nil)
  }
}

@Suite struct Ambient {
  final class Recorder: @unchecked Sendable {
    private let lock = NSLock()
    private var values: [AmbientThemeState] = []
    func record(_ s: AmbientThemeState) { lock.lock(); values.append(s); lock.unlock() }
    var all: [AmbientThemeState] { lock.lock(); defer { lock.unlock() }; return values }
  }

  @Test func debouncedLatestWinsAndNoOpCommitsAreSilent() async throws {
    let store = AmbientThemeStore()
    let recorder = Recorder()
    let subscription = store.subscribe { recorder.record($0) }
    store.set("#ff0000", debounce: 0.05)
    store.set("#00ff00", accents: AmbientAccents(secondary: "#0000ff"), debounce: 0.05)
    #expect(store.state == .empty)
    try await Task.sleep(nanoseconds: 200_000_000)
    #expect(store.state == AmbientThemeState(seed: "#00ff00", secondary: "#0000ff"))
    #expect(recorder.all.count == 1)
    store.set("#00ff00", accents: AmbientAccents(secondary: "#0000ff"), debounce: 0)
    #expect(recorder.all.count == 1)
    store.clear(debounce: 10)
    store.flush()
    #expect(store.state == .empty)
    #expect(recorder.all.count == 2)
    subscription.cancel()
    store.set("#123456", debounce: 0)
    #expect(recorder.all.count == 2)
  }

  /// The provider: an ambient seed overrides the static seed and replaces its accents.
  @Test func ambientOverridesTheSelection() {
    var selection = ThemeSelection(mode: .dark, colorPreset: .teal, seed: "#ff8800", secondaryColor: "#00ff00")
    #expect(selection.palette(.dark) == buildSeedPalette("#ff8800", .dark, accents: SeedAccents(secondarySeed: "#00ff00")))
    selection.ambient = AmbientThemeState(seed: "#1d9bf0", tertiary: "#ef4444")
    #expect(selection.effectiveSecondary == nil)
    #expect(selection.palette(.dark) == buildSeedPalette("#1d9bf0", .dark, accents: SeedAccents(tertiarySeed: "#ef4444")))
    selection.ambient = .empty
    selection.seed = nil
    #expect(selection.palette(.light) == buildPresetPalette(.teal, .light, accents: ExplicitAccents(secondaryHex: "#00ff00")))
    selection.secondaryColor = nil
    #expect(selection.palette(.light) == getPrepaintPalette(.teal, .light))
    #expect(selection.resolvedMode(system: .light) == .dark)
    selection.mode = .adaptive
    #expect(selection.resolvedMode(system: .dark) == .dark)
    selection.surfaces = .neutral
    #expect(selection.explicitAccents == ExplicitAccents(surfaces: .neutral))
  }
}

@Suite struct Scopes {
  @Test func nestedScopesResolveLikeUseScope() throws {
    let root = ThemeSelection(mode: .light, colorPreset: .teal)
    #expect(try ScopeStack(root: root, system: .dark).resolved() == getPrepaintPalette(.teal, .light))
    // A preset scope, then a mode-only scope inside it: the inner one keeps the preset.
    let stack = ScopeStack(root: root, system: .dark, scopes: [ColorScope(colorPreset: .pink), ColorScope(mode: .dark)])
    #expect(try stack.resolved() == buildPresetPalette(.pink, .dark))
    // A seed scope wins over its preset; tokens apply on top.
    let seeded = ScopeStack(root: root, system: .light, scopes: [
      ColorScope(colorPreset: .blue, seed: "#ff8800"),
      ColorScope(tokens: [(.primary, "rgb(1 2 3)")]),
    ])
    let palette = try seeded.resolved()
    #expect(palette.theme.colors.primary == "rgb(1 2 3)")
    #expect(palette.theme.colors.tint == "rgb(1 2 3)")
    #expect(palette.vars["--color-primary"] == "rgb(1 2 3)")
    #expect(palette.vars["--background"] == buildSeedPalette("#ff8800", .light).vars["--background"])
    // An inactive scope passes its parent through.
    #expect(try ScopeStack(root: root, system: .light, scopes: [ColorScope()]).resolved() == getPrepaintPalette(.teal, .light))
  }

  @Test func scopeTokensMustBeColours() {
    #expect(throws: ScopeTokenError.notAColor(.primary)) {
      try applyScopeTokens(buildPresetPalette(.teal, .light), [(.primary, "  ")])
    }
  }

  @Test func profileColors() {
    #expect(resolveProfileColor(" Amber ") == .colorPreset(.yellow))
    #expect(resolveProfileColor("#ABC") == .seed("#aabbcc"))
    #expect(resolveProfileColor(nil) == nil)
  }
}
