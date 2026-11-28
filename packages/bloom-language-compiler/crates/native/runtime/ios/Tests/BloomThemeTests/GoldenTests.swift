// Byte-identical against the TypeScript's goldens, read from the repo. A mismatch is a failure,
// never a tolerance; rebase a golden only through its TS generator.
import Foundation
import Testing
@testable import BloomTheme

private func mode(_ js: JS?) -> ColorMode { js?.string == "dark" ? .dark : .light }
private func preset(_ js: JS?) -> AppColorName { AppColorName(rawValue: js!.string!)! }

private func accents(_ js: JS?) -> ExplicitAccents? {
  guard let js else { return nil }
  return ExplicitAccents(
    secondaryHex: js["secondaryHex"]?.string, tertiaryHex: js["tertiaryHex"]?.string,
    surfaces: js["surfaces"]?.string.flatMap(SurfaceTint.init(rawValue:)))
}

private func themeJS(_ theme: BloomTheme, tokens: TokenMap? = nil) -> JS {
  var members: [(String, JS)] = []
  if let tokens { members.append(("tokens", tokens.js)) }
  members.append(("colors", theme.colors.js))
  members.append(("chartColors", (theme.chartColors ?? []).js))
  return .object(members)
}

@Suite struct FrozenOracle {
  /// `__fixtures__/golden-resolved-tokens.json` (`generate-theme-golden.ts`), the whole file.
  @Test func reproducesGoldenResolvedTokensByteForByte() throws {
    let expected = try repoText("src/theme/__tests__/__fixtures__/golden-resolved-tokens.json")
    var members: [(String, JS)] = []
    for name in AppColorName.allCases {
      for m in [ColorMode.light, .dark] { members.append(("\(name.rawValue)/\(m.rawValue)", getResolvedTokens(name, m).js)) }
    }
    let actual = JS.object(members).pretty + "\n"
    #expect(actual == expected, "golden-resolved-tokens.json differs")
  }

  /// The generated constants (`BloomThemeTokens`) are the same palettes the engine computes.
  @Test func generatedPresetPalettesMatchTheEngine() {
    for name in AppColorName.allCases {
      for m in [ColorMode.light, .dark] {
        #expect(BloomThemeTokens.resolvedTokens(name, m) == getResolvedTokens(name, m), "\(name)/\(m) tokens")
        #expect(BloomThemeTokens.theme(name, m) == buildTheme(name, m), "\(name)/\(m) theme")
        #expect(getPrepaintPalette(name, m) == buildPresetPalette(name, m), "\(name)/\(m) prepaint")
      }
    }
  }

  /// `fixtures/color-engine-golden.json`: Material Color Utilities' roles, 5 seeds × 4 variants ×
  /// light/dark. The seeds are read from the TypeScript test that owns the fixture.
  @Test func reproducesMaterialColorUtilitiesGolden() throws {
    let source = try repoText("src/theme/__tests__/color-engine-golden.test.ts")
    var seeds: [String: String] = [:]
    let block = source.components(separatedBy: "const SEED_HEX")[1].components(separatedBy: "};")[0]
    for line in block.split(separator: "\n") {
      let parts = line.split(separator: ":")
      guard parts.count == 2, let quote = parts[1].firstIndex(of: "'") else { continue }
      let value = parts[1][parts[1].index(after: quote)...].prefix { $0 != "'" }
      seeds[parts[0].trimmingCharacters(in: .whitespaces)] = String(value)
    }
    #expect(seeds.count == 5)
    let golden = try JS.parse(repoText("src/theme/__tests__/fixtures/color-engine-golden.json"))
    var failures: [String] = []
    var count = 0
    for (combo, roles) in golden.members! {
      let parts = combo.split(separator: "|").map(String.init)
      let roleColors = generateRoleColors(GenerateOptions(
        seed: seeds[parts[0]]!, variant: SchemeVariant(rawValue: parts[1])!, isDark: parts[2] == "dark"))
      for (role, hex) in roles.members! {
        count += 1
        let rgb = roleColors[RoleName(rawValue: role)!]
        let channels = rgb.dropFirst(4).dropLast().split(separator: " ").map { Int($0)! }
        let actual = hexFromArgb(argbFromRgb(channels[0], channels[1], channels[2]))
        if actual != hex.string! { failures.append("\(combo) \(role): \(actual) != \(hex.string!)") }
      }
    }
    #expect(count > 0)
    #expect(failures.isEmpty, "\(failures.count)/\(count): \(failures.prefix(10))")
  }
}

@Suite struct NativeGoldens {
  @Test func seedPath() throws {
    var mismatches = Mismatches()
    for line in try goldenLines("native-seed-golden.jsonl") {
      let i = line.input
      let options = SeedScopeOptions(
        seed: i["seed"]!.string!, mode: mode(i["mode"]),
        variant: i["variant"]?.string.flatMap(SchemeVariant.init(rawValue:)),
        contrastLevel: i["contrastLevel"]?.number, secondarySeed: i["secondarySeed"]?.string,
        tertiarySeed: i["tertiarySeed"]?.string)
      let tokens = buildSeedScopeVars(options).filter { key, _ in !key.hasPrefix("--color-") }
      var members: [(String, JS)] = [("tokens", tokens.js)]
      if line.output.contains("\"colors\":") {
        let theme = buildThemeFromSeed(
          options.seed, options.mode, variant: options.variant, contrastLevel: options.contrastLevel,
          accents: SeedAccents(secondarySeed: options.secondarySeed, tertiarySeed: options.tertiarySeed))
        members.append(("colors", theme.colors.js))
        members.append(("chartColors", (theme.chartColors ?? []).js))
      }
      mismatches.check(line, JS.object(members).compact)
    }
    #expect(mismatches.total > 500)
    #expect(mismatches.isEmpty, "\(mismatches)")
  }

  @Test func presetPath() throws {
    var mismatches = Mismatches()
    for line in try goldenLines("native-preset-golden.jsonl") {
      let i = line.input
      let actual: JS
      switch i["kind"]!.string! {
      case "buildTheme":
        let a = accents(i["accents"])
        let theme = buildTheme(preset(i["preset"]), mode(i["mode"]), accents: a)
        actual = themeJS(theme, tokens: a == nil ? nil : getResolvedTokens(preset(i["preset"]), mode(i["mode"]), accents: a))
      case "buildScopeVars":
        actual = buildScopeVars(preset(i["preset"]), mode(i["mode"])).js
      case "getPresetBackground":
        actual = .string(getPresetBackground(preset(i["preset"]), mode(i["mode"])))
      case "applyScopeTokens":
        let overrides: BloomColorScopeTokens = i["tokens"]!.members!.map { (CanonicalToken(rawValue: $0.0)!, $0.1.string!) }
        let palette = try applyScopeTokens(buildPresetPalette(preset(i["preset"]), mode(i["mode"])), overrides)
        actual = .object([
          ("vars", palette.vars.js), ("colors", palette.theme.colors.js),
          ("chartColors", (palette.theme.chartColors ?? []).js),
        ])
      default:
        Issue.record("unknown kind in \(line.id)")
        continue
      }
      mismatches.check(line, actual.compact)
    }
    #expect(mismatches.total > 300)
    #expect(mismatches.isEmpty, "\(mismatches)")
  }

  @Test func ambientAccentFromImages() throws {
    var mismatches = Mismatches()
    for line in try goldenLines("native-ambient-golden.jsonl") {
      let i = line.input
      switch i["kind"]!.string! {
      case "ambientFromImage":
        let bytes = hexBytes(i["rgb"]!.string!)
        let seeds = seedsFromRgbBytes(bytes, channels: Int(i["channels"]!.number!)).map(hexFromArgb)
        var pixels: [ARGB] = []
        var o = 0
        while o + 3 <= bytes.count {
          pixels.append(argbFromRgb(Int(bytes[o]), Int(bytes[o + 1]), Int(bytes[o + 2])))
          o += 3
        }
        let quantized = quantizeImage(pixels).map { JS.array([.string(hexFromArgb($0.color)), .number(Double($0.population))]) }
        var members: [(String, JS)] = [("quantized", .array(quantized)), ("seeds", .array(seeds.map(JS.string)))]
        if let top = seeds.first {
          let accents = SeedAccents(secondarySeed: seeds.count > 1 ? seeds[1] : nil, tertiarySeed: seeds.count > 2 ? seeds[2] : nil)
          for m in [ColorMode.light, .dark] {
            let theme = BloomTheme.fromSeed(top, mode: m, accents: accents)
            let tokens = buildSeedScopeVars(SeedScopeOptions(
              seed: top, mode: m, secondarySeed: accents.secondarySeed, tertiarySeed: accents.tertiarySeed)
            ).filter { key, _ in !key.hasPrefix("--color-") }
            members.append((m.rawValue, themeJS(theme, tokens: tokens)))
          }
          // The facade the ambient accent calls is the same composition.
          let viaFacade = BloomTheme.fromImage(rgbBytes: bytes, mode: .dark)
          #expect(viaFacade.ambient.seed == top)
          #expect(viaFacade.theme == BloomTheme.fromSeed(top, mode: .dark, accents: accents))
        }
        mismatches.check(line, JS.object(members).compact)
      case "seedsFromRgbBytes":
        let seeds = seedsFromRgbBytes(hexBytes(i["rgb"]!.string!), channels: Int(i["channels"]!.number!))
        mismatches.check(line, JS.array(seeds.map { .string(hexFromArgb($0)) }).compact)
      case "seedsFromImagePixels":
        let text = Array(i["pixels"]!.string!)
        var pixels: [ARGB] = []
        var k = 0
        while k + 8 <= text.count {
          pixels.append(UInt32(String(text[k..<(k + 8)]), radix: 16)!)
          k += 8
        }
        func list(_ seeds: [ARGB]) -> JS { .array(seeds.map { .string(hexFromArgb($0)) }) }
        let actual = JS.object([
          ("seeds", list(seedsFromImagePixels(pixels))),
          ("desired1", list(seedsFromImagePixels(pixels, ScoreOptions(desired: 1)))),
          ("unfiltered", list(seedsFromImagePixels(pixels, ScoreOptions(desired: 6, filter: false)))),
        ])
        mismatches.check(line, actual.compact)
      default:
        Issue.record("unknown kind in \(line.id)")
      }
    }
    #expect(mismatches.total == 9)
    #expect(mismatches.isEmpty, "\(mismatches)")
  }

  /// The engine's raw doubles (HCT, accent hues, key tones, OKLCH), printed as `String(number)`,
  /// plus every colour a component derives from a theme. A last-bit difference fails here.
  @Test func engineDoublesAndDerivedColours() throws {
    var mismatches = Mismatches()
    for line in try goldenLines("native-misc-golden.jsonl") {
      let i = line.input
      let actual: JS
      switch i["kind"]!.string! {
      case "hct":
        let seed = i["seed"]!.string!
        let hct = Hct.fromInt(argbFromHex(seed))
        actual = .object([
          ("hue", .number(hct.hue)), ("chroma", .number(hct.chroma)), ("tone", .number(hct.tone)),
          ("colourless", .bool(isColourlessSeed(seed))),
        ])
      case "hctSolve":
        var out: [JS] = []
        var h = 0.0
        while h < 360 {
          for c in [0.0, 10, 40, 80, 120, 200] {
            for t in [0.0, 5, 25, 49.5, 50, 75, 95, 100] { out.append(.string(hexFromArgb(Hct.from(h, c, t).toInt()))) }
          }
          h += 7
        }
        actual = .array(out)
      case "keyColorTone":
        var out: [JS] = []
        var h = 0.0
        while h < 360 {
          for c in [4.0, 16, 36, 48, 84, 200] { out.append(.number(TonalPalette.fromHueAndChroma(h, c).keyColor.tone)) }
          h += 15
        }
        actual = .array(out)
      case "deriveAccentHues":
        let hues = deriveAccentHues(i["hue"]!.number!)
        actual = .object([("secondary", .number(hues.secondary)), ("tertiary", .number(hues.tertiary))])
      case "policyBackground":
        actual = .string(policyBackground(i["seed"]!.string!, isDark: i["isDark"]!.bool!, neutralSurfaces: i["neutral"]!.bool!))
      case "createChartColors":
        actual = createChartColors(i["hue"]!.number!, isDark: i["isDark"]!.bool!, monochrome: i["monochrome"]!.bool!).js
      case "hslToSrgb":
        actual = .string(hslToSrgb(i["triple"]!.string!))
      case "parseRgba":
        actual = parseRgba(i["color"]!.string!)?.js ?? .null
      case "withAlpha":
        actual = .string(withAlpha(i["color"]!.string!, i["alpha"]!.number!))
      case "oklch":
        let color = Oklch(l: i["l"]!.number!, c: i["c"]!.number!, h: i["h"]!.number!)
        let rgb = oklchToSrgb(color)
        let back = srgbToOklch(rgb)
        actual = .object([
          ("rgb", .object([("r", .number(rgb.r)), ("g", .number(rgb.g)), ("b", .number(rgb.b))])),
          ("back", .object([("l", .number(back.l)), ("c", .number(back.c)), ("h", .number(back.h))])),
          ("string", .string(oklchToRgbString(color))),
        ])
      case "resolveProfileColor":
        switch resolveProfileColor(i["value"]!.string!) {
        case .colorPreset(let name): actual = .object([("colorPreset", .string(name.rawValue))])
        case .seed(let seed): actual = .object([("seed", .string(seed))])
        case nil: actual = .null
        }
      case "derived":
        let theme = buildTheme(preset(i["preset"]), mode(i["mode"]))
        let colors = theme.colors
        var accentMembers: [(String, JS)] = []
        for tone in AccentTone.allCases {
          for fill in AccentFill.allCases {
            accentMembers.append(("\(tone.rawValue)/\(fill.rawValue)", theme.accentColors(tone, fill).js))
          }
        }
        let labels = theme.labelColors
        let presses = [
          theme.pressed(surface: colors.primary, layer: colors.primaryForeground),
          theme.pressed(surface: colors.card, layer: colors.text),
          theme.pressed(surface: colors.successSubtle, layer: colors.successSubtleForeground),
          theme.pressed(surface: "transparent", layer: colors.text),
          theme.pressed(surface: "rgba(10, 20, 30, 0.37)", layer: "#ffffff"),
          theme.pressed(surface: colors.primary, layer: "not-a-colour"),
        ]
        var bare = theme
        bare.chartColors = nil
        actual = .object([
          ("accents", .object(accentMembers)),
          ("labels", .object([
            ("label", .string(labels.label)), ("secondary", .string(labels.secondary)),
            ("tertiary", .string(labels.tertiary)), ("quaternary", .string(labels.quaternary)),
          ])),
          ("presses", .array(presses.map(JS.string))),
          ("chart", bare.resolvedChartColors.js),
        ])
      default:
        Issue.record("unknown kind in \(line.id)")
        continue
      }
      mismatches.check(line, actual.compact)
    }
    #expect(mismatches.total > 800)
    #expect(mismatches.isEmpty, "\(mismatches)")
  }
}
