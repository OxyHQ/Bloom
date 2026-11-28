// Ports of src/theme/color-utils.ts, color-space.ts, token-registry.ts's `hslToSrgb`,
// press-colors.ts, accent-colors.ts and label-colors.ts: the colour arithmetic on resolved
// token strings. Strings are what the TypeScript passes, so strings are what these take.
import Foundation

/// An sRGB colour as numbers (0–255 channels, 0–1 alpha), what `parseRgba` reads. Channels are
/// doubles because the parser accepts any number (`rgb(12.5 0 0)`), as the TypeScript does.
public struct SRGB: Sendable, Hashable, Codable {
  public var r: Double
  public var g: Double
  public var b: Double
  public var a: Double

  public init(r: Double, g: Double, b: Double, a: Double = 1) {
    self.r = r
    self.g = g
    self.b = b
    self.a = a
  }

  /// From an engine colour.
  public init(argb: ARGB) {
    self.init(r: Double(redFromArgb(argb)), g: Double(greenFromArgb(argb)), b: Double(blueFromArgb(argb)))
  }
}

private func splitChannels(_ inner: Substring) -> [String] {
  // `split(/[\s,/]+/).filter(Boolean)`.
  var parts: [String] = []
  var current = ""
  for scalar in inner.unicodeScalars {
    if jsWhitespace(scalar) || scalar == "," || scalar == "/" {
      if !current.isEmpty { parts.append(current); current = "" }
    } else {
      current.unicodeScalars.append(scalar)
    }
  }
  if !current.isEmpty { parts.append(current) }
  return parts
}

/// The text inside the first `rgb(`/`rgba(` … `)` (case-insensitive), as `/rgba?\(([^)]+)\)/i`.
private func rgbInner(_ text: String) -> Substring? {
  let lower = text.lowercased()
  var search = lower.startIndex
  while let range = lower.range(of: "rgb", range: search..<lower.endIndex) {
    var i = range.upperBound
    if i < lower.endIndex, lower[i] == "a" { i = lower.index(after: i) }
    if i < lower.endIndex, lower[i] == "(" {
      let start = lower.index(after: i)
      if let close = lower[start...].firstIndex(of: ")"), close > start {
        let offsetStart = lower.distance(from: lower.startIndex, to: start)
        let offsetEnd = lower.distance(from: lower.startIndex, to: close)
        let s = text.index(text.startIndex, offsetBy: offsetStart)
        let e = text.index(text.startIndex, offsetBy: offsetEnd)
        return text[s..<e]
      }
    }
    search = range.upperBound
  }
  return nil
}

/// `parseRgba`: `rgb(r g b)`, `rgb(r, g, b)`, `rgba(r, g, b, a)`, `rgb(r g b / a)` (decimal or
/// percentage alpha), `#rgb` and `#rrggbb`; nil for anything else.
public func parseRgba(_ color: String) -> SRGB? {
  let trimmed = jsTrim(color)
  if trimmed.hasPrefix("#") {
    var hex = String(trimmed.dropFirst())
    if hex.count == 3 { hex = hex.map { "\($0)\($0)" }.joined() }
    if hex.count != 6 { return nil }
    let chars = Array(hex)
    func channel(_ i: Int) -> Double { jsParseHexPrefix(String(chars[i..<(i + 2)])) }
    let r = channel(0), g = channel(2), b = channel(4)
    if r.isNaN || g.isNaN || b.isNaN { return nil }
    return SRGB(r: r, g: g, b: b, a: 1)
  }
  guard let inner = rgbInner(trimmed) else { return nil }
  let raw = splitChannels(inner)
  if raw.count < 3 { return nil }
  let r = jsNumber(raw[0]), g = jsNumber(raw[1]), b = jsNumber(raw[2])
  if r.isNaN || g.isNaN || b.isNaN { return nil }
  guard raw.count > 3 else { return SRGB(r: r, g: g, b: b, a: 1) }
  let alphaText = raw[3]
  let a = alphaText.hasSuffix("%") ? jsNumber(String(alphaText.dropLast())) / 100 : jsNumber(alphaText)
  if a.isNaN { return nil }
  return SRGB(r: r, g: g, b: b, a: a)
}

/// `parseInt(text, 16)` for a two-character channel: the leading hex digits, or NaN.
private func jsParseHexPrefix(_ text: String) -> Double {
  var value = 0.0
  var any = false
  var scalars = Substring(jsTrimStart(text)).unicodeScalars[...]
  var negative = false
  if let sign = scalars.first, sign == "-" || sign == "+" {
    negative = sign == "-"
    scalars = scalars.dropFirst()
  }
  for scalar in scalars {
    let digit: Double
    switch scalar.value {
    case 48...57: digit = Double(scalar.value - 48)
    case 65...70: digit = Double(scalar.value - 55)
    case 97...102: digit = Double(scalar.value - 87)
    default: return any ? (negative ? -value : value) : .nan
    }
    value = value * 16 + digit
    any = true
  }
  return any ? (negative ? -value : value) : .nan
}

/// `parseRgb`: the channels without the alpha.
public func parseRgb(_ color: String) -> SRGB? {
  parseRgba(color).map { SRGB(r: $0.r, g: $0.g, b: $0.b, a: 1) }
}

/// `withAlpha`: `color` at `alpha` as `rgba(r, g, b, a)`; the input unchanged when it can't parse.
public func withAlpha(_ color: String, _ alpha: Double) -> String {
  guard let rgb = parseRgb(color) else { return color }
  return "rgba(\(jsNumberString(rgb.r)), \(jsNumberString(rgb.g)), \(jsNumberString(rgb.b)), \(jsNumberString(alpha)))"
}

/// `hslToSrgb` (token-registry.ts): a shadcn `H S% L%` triple (optionally `/ A`) to `rgb(...)`.
public func hslToSrgb(_ triple: String) -> String {
  let parts = triple.split(separator: "/", omittingEmptySubsequences: false).map { jsTrim(String($0)) }
  let colorPart = parts.first ?? ""
  let alphaPart: String? = parts.count > 1 ? parts[1] : nil
  let channels = splitWhitespace(colorPart)
  func stripDeg(_ s: String) -> String {
    s.lowercased().hasSuffix("deg") ? String(s.dropLast(3)) : s
  }
  func stripPercent(_ s: String) -> String {
    guard let i = s.firstIndex(of: "%") else { return s }
    var copy = s
    copy.remove(at: i)
    return copy
  }
  let hue = jsParseFloat(stripDeg(channels.count > 0 ? channels[0] : "0"))
  let sat = jsParseFloat(stripPercent(channels.count > 1 ? channels[1] : "0")) / 100
  let light = jsParseFloat(stripPercent(channels.count > 2 ? channels[2] : "0")) / 100
  let h = hue.isFinite ? hue : 0
  let s = sat.isFinite ? sat : 0
  let l = light.isFinite ? light : 0

  let chroma = (1 - abs(2 * l - 1)) * s
  let huePrime = ((h.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360)) / 60
  let second = chroma * (1 - abs(huePrime.truncatingRemainder(dividingBy: 2) - 1))
  var r = 0.0, g = 0.0, b = 0.0
  if huePrime < 1 {
    (r, g, b) = (chroma, second, 0)
  } else if huePrime < 2 {
    (r, g, b) = (second, chroma, 0)
  } else if huePrime < 3 {
    (r, g, b) = (0, chroma, second)
  } else if huePrime < 4 {
    (r, g, b) = (0, second, chroma)
  } else if huePrime < 5 {
    (r, g, b) = (second, 0, chroma)
  } else {
    (r, g, b) = (chroma, 0, second)
  }
  let match = l - chroma / 2
  let red = jsNumberString(jsRound((r + match) * 255))
  let green = jsNumberString(jsRound((g + match) * 255))
  let blue = jsNumberString(jsRound((b + match) * 255))
  if let alphaPart, !alphaPart.isEmpty {
    let alpha = alphaPart.hasSuffix("%") ? jsParseFloat(alphaPart) / 100 : jsParseFloat(alphaPart)
    let safeAlpha = alpha.isFinite ? alpha : 1
    return "rgb(\(red) \(green) \(blue) / \(jsNumberString(safeAlpha)))"
  }
  return "rgb(\(red) \(green) \(blue))"
}

private func splitWhitespace(_ text: String) -> [String] {
  var parts: [String] = []
  var current = ""
  for scalar in text.unicodeScalars {
    if jsWhitespace(scalar) {
      if !current.isEmpty { parts.append(current); current = "" }
    } else {
      current.unicodeScalars.append(scalar)
    }
  }
  if !current.isEmpty { parts.append(current) }
  return parts
}

/// `RAW_HSL_TRIPLE`: `/^-?\d[\d.]*\s+[\d.]+%/`.
func isRawHslTriple(_ value: String) -> Bool {
  var chars = Array(value.unicodeScalars)[...]
  func isDigit(_ s: Unicode.Scalar) -> Bool { s.value >= 48 && s.value <= 57 }
  if chars.first == "-" { chars = chars.dropFirst() }
  guard let first = chars.first, isDigit(first) else { return false }
  chars = chars.dropFirst()
  // `[\d.]*\s+[\d.]+%` with backtracking: the first run never contains white space, so it
  // is maximal; then one or more white space, then a `[\d.]+` run that a `%` must follow at
  // some prefix of it (any prefix ending in `%`... the run cannot contain `%`, so `%` follows it).
  chars = chars.drop { isDigit($0) || $0 == "." }
  let afterSpace = chars.drop { jsRegexWhitespace($0) }
  guard afterSpace.count < chars.count else { return false }
  let run = afterSpace.prefix { isDigit($0) || $0 == "." }
  guard !run.isEmpty else { return false }
  let rest = afterSpace.dropFirst(run.count)
  return rest.first == "%"
}

/// The `\s` class of a JavaScript regular expression.
private func jsRegexWhitespace(_ s: Unicode.Scalar) -> Bool { jsWhitespace(s) }

// MARK: - color-space.ts

/// `Oklch`: l 0…1, c 0…~0.4, h degrees.
public struct Oklch: Sendable, Hashable {
  public var l: Double
  public var c: Double
  public var h: Double

  public init(l: Double, c: Double, h: Double) {
    self.l = l
    self.c = c
    self.h = h
  }
}

/// `Rgb`: 0–255 integer channels.
public struct Rgb: Sendable, Hashable {
  public var r: Double
  public var g: Double
  public var b: Double

  public init(r: Double, g: Double, b: Double) {
    self.r = r
    self.g = g
    self.b = b
  }
}

private func srgbGamma(_ x: Double) -> Double {
  x <= 0.0031308 ? 12.92 * x : 1.055 * jsPow(x, 1 / 2.4) - 0.055
}

private func srgbLinear(_ x: Double) -> Double {
  x <= 0.04045 ? x / 12.92 : jsPow((x + 0.055) / 1.055, 2.4)
}

/// `clamp` (styles/clamp.ts): `Math.max(min, Math.min(value, max))`.
private func clampUnit(_ value: Double, _ lo: Double, _ hi: Double) -> Double {
  jsMax(lo, jsMin(value, hi))
}

/// `oklchToSrgb`.
public func oklchToSrgb(_ color: Oklch) -> Rgb {
  let hr = (color.h * Double.pi) / 180
  let a = color.c * jsCos(hr)
  let b2 = color.c * jsSin(hr)
  let l_ = color.l + 0.3963377774 * a + 0.2158037573 * b2
  let m_ = color.l - 0.1055613458 * a - 0.0638541728 * b2
  let s_ = color.l - 0.0894841775 * a - 1.291485548 * b2
  let lc = jsPow(l_, 3), mc = jsPow(m_, 3), sc = jsPow(s_, 3)
  let lr = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc
  let lg = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc
  let lb = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc
  return Rgb(
    r: jsRound(clampUnit(srgbGamma(lr), 0, 1) * 255),
    g: jsRound(clampUnit(srgbGamma(lg), 0, 1) * 255),
    b: jsRound(clampUnit(srgbGamma(lb), 0, 1) * 255))
}

/// `srgbToOklch`.
public func srgbToOklch(_ color: Rgb) -> Oklch {
  let lr = srgbLinear(color.r / 255)
  let lg = srgbLinear(color.g / 255)
  let lb = srgbLinear(color.b / 255)
  let l_ = jsCbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  let m_ = jsCbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  let s_ = jsCbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  let l = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  let a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  let bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  let c = (a * a + bb * bb).squareRoot()
  let h = (jsAtan2(bb, a) * 180) / Double.pi
  return Oklch(l: l, c: c, h: h < 0 ? h + 360 : h)
}

/// `srgbToRgbString`.
public func srgbToRgbString(_ color: Rgb, alpha: Double? = nil) -> String {
  let r = jsNumberString(color.r), g = jsNumberString(color.g), b = jsNumberString(color.b)
  guard let alpha, alpha < 1 else { return "rgb(\(r) \(g) \(b))" }
  return "rgb(\(r) \(g) \(b) / \(jsNumberString(alpha)))"
}

/// `parseRgbString`: an `rgb()`/`rgba()` string's channels; nil where the TypeScript throws.
public func parseRgbString(_ s: String) -> Rgb? {
  guard let inner = rgbInner(s) else { return nil }
  // `inner.split(/[ ,/]+/)` keeps empty leading/trailing pieces; `parseInt` makes them NaN.
  var parts: [String] = []
  var current = ""
  var lastWasSeparator = false
  for scalar in inner.unicodeScalars {
    if scalar == " " || scalar == "," || scalar == "/" {
      if !lastWasSeparator { parts.append(current); current = "" }
      lastWasSeparator = true
    } else {
      current.unicodeScalars.append(scalar)
      lastWasSeparator = false
    }
  }
  parts.append(current)
  func channel(_ i: Int) -> Double {
    guard i < parts.count else { return 0 }
    return jsParseInt10(parts[i])
  }
  return Rgb(r: channel(0), g: channel(1), b: channel(2))
}

/// `deltaE`: a cheap sRGB distance.
public func deltaE(_ a: Rgb, _ b: Rgb) -> Double {
  (jsPow(a.r - b.r, 2) + jsPow(a.g - b.g, 2) + jsPow(a.b - b.b, 2)).squareRoot() / (3.0).squareRoot()
}

/// `oklchToRgbString`: chroma reduced until the round trip holds lightness and chroma.
public func oklchToRgbString(_ color: Oklch) -> String {
  var chroma = color.c
  for _ in 0..<24 {
    let rgb = oklchToSrgb(Oklch(l: color.l, c: chroma, h: color.h))
    let back = srgbToOklch(rgb)
    if abs(back.l - color.l) < 0.01 && abs(back.c - chroma) < 0.01 { return srgbToRgbString(rgb) }
    chroma *= 0.9
  }
  return srgbToRgbString(oklchToSrgb(Oklch(l: color.l, c: chroma, h: color.h)))
}

// MARK: - press-colors.ts

/// `PRESS_LAYER_ALPHA`.
public let pressLayerAlpha = BloomConstantData.pressLayerAlpha

private func sourceOver(_ base: SRGB, _ layer: SRGB, _ alpha: Double) -> String {
  let outA = alpha + base.a * (1 - alpha)
  func mix(_ l: Double, _ b: Double) -> String {
    jsNumberString(jsRound((l * alpha + b * base.a * (1 - alpha)) / outA))
  }
  let r = mix(layer.r, base.r)
  let g = mix(layer.g, base.g)
  let b = mix(layer.b, base.b)
  if outA >= 1 { return "rgb(\(r) \(g) \(b))" }
  return "rgba(\(r), \(g), \(b), \(jsNumberString(jsNumber(jsToFixed(outA, 4)))))"
}

/// `pressedSurface`: what a control paints while it is held.
public func pressedSurface(_ colors: ThemeColors, surface: String, layer: String) -> String {
  guard let base = parseRgba(surface), base.a != 0 else { return colors.contrast50 }
  guard let top = parseRgba(layer) else { return colors.contrast50 }
  return sourceOver(base, top, pressLayerAlpha)
}

// MARK: - accent-colors.ts

/// `AccentTone`.
public enum AccentTone: String, CaseIterable, Codable, Sendable {
  case `default`, primary, vivid, secondary, tertiary, success, warning, error, info
}

/// `AccentFill`.
public enum AccentFill: String, CaseIterable, Codable, Sendable {
  case solid, subtle, outlined
}

/// `AccentColors`.
public struct AccentColors: Sendable, Hashable {
  public var background: String
  public var foreground: String
  public var border: String
}

private let statusSolidForeground = "#fff"

/// `resolveAccentColors`: the surface, label and border of one tone at one loudness.
public func resolveAccentColors(_ colors: ThemeColors, tone: AccentTone, fill: AccentFill) -> AccentColors {
  let palette: (fill: String, fillForeground: String, tint: String, accent: String)
  switch tone {
  case .primary:
    palette = (colors.primary, colors.primaryForeground, colors.primarySubtle, colors.primarySubtleForeground)
  case .vivid:
    palette = (colors.vivid, colors.vividForeground, colors.primarySubtle, colors.primarySubtleForeground)
  case .secondary:
    palette = (colors.secondary, colors.secondaryForeground, colors.secondarySubtle, colors.secondarySubtleForeground)
  case .tertiary:
    palette = (colors.tertiary, colors.tertiaryForeground, colors.tertiarySubtle, colors.tertiarySubtleForeground)
  case .success:
    palette = (colors.success, statusSolidForeground, colors.successSubtle, colors.successSubtleForeground)
  case .warning:
    palette = (colors.warning, statusSolidForeground, colors.warningSubtle, colors.warningSubtleForeground)
  case .error:
    palette = (colors.error, statusSolidForeground, colors.errorSubtle, colors.errorSubtleForeground)
  case .info:
    palette = (colors.info, statusSolidForeground, colors.infoSubtle, colors.infoSubtleForeground)
  case .default:
    palette = (colors.textSecondary, colors.background, colors.contrast50, colors.textSecondary)
  }
  switch fill {
  case .solid:
    return AccentColors(background: palette.fill, foreground: palette.fillForeground, border: palette.fill)
  case .subtle:
    return AccentColors(background: palette.tint, foreground: palette.accent, border: "transparent")
  case .outlined:
    return AccentColors(background: "transparent", foreground: palette.accent, border: palette.accent)
  }
}

// MARK: - label-colors.ts

/// `LabelColors`: the theme's ink at the four label alphas.
public struct LabelColors: Sendable, Hashable {
  public var label: String
  public var secondary: String
  public var tertiary: String
  public var quaternary: String
}

/// `resolveLabelColors`.
public func resolveLabelColors(_ colors: ThemeColors) -> LabelColors {
  let ink = colors.text
  let alpha = BloomConstantData.labelAlpha
  return LabelColors(
    label: ink, secondary: withAlpha(ink, alpha.secondary), tertiary: withAlpha(ink, alpha.tertiary),
    quaternary: withAlpha(ink, alpha.quaternary))
}
