// Ports of src/theme/color-engine/hct.ts, tonal-palette.ts, contrast.ts, contrast-curve.ts and
// dislike-analyzer.ts (Material Color Utilities, Apache-2.0).
import Foundation

/// `Hct`: CAM16 hue and chroma with L* as tone.
public struct Hct: Sendable, Hashable {
  public private(set) var argb: ARGB
  public private(set) var hue: Double
  public private(set) var chroma: Double
  public private(set) var tone: Double

  private init(argb: ARGB) {
    let cam = Cam16.fromInt(argb)
    self.argb = argb
    self.hue = cam.hue
    self.chroma = cam.chroma
    self.tone = lstarFromArgb(argb)
  }

  /// `Hct.from(hue, chroma, tone)`.
  public static func from(_ hue: Double, _ chroma: Double, _ tone: Double) -> Hct {
    Hct(argb: solveToInt(hue, chroma, tone))
  }

  /// `Hct.fromInt(argb)`.
  public static func fromInt(_ argb: ARGB) -> Hct { Hct(argb: argb) }

  public func toInt() -> ARGB { argb }

  /// The setters of the TypeScript `Hct`: re-solve with one coordinate changed.
  public func with(hue newHue: Double) -> Hct { .from(newHue, chroma, tone) }
  public func with(chroma newChroma: Double) -> Hct { .from(hue, newChroma, tone) }
  public func with(tone newTone: Double) -> Hct { .from(hue, chroma, newTone) }
}

/// `TonalPalette`: a fixed hue and chroma, read at any tone.
public struct TonalPalette: Sendable, Hashable {
  public let hue: Double
  public let chroma: Double
  private let key: Hct?

  private init(hue: Double, chroma: Double, key: Hct?) {
    self.hue = hue
    self.chroma = chroma
    self.key = key
  }

  public static func fromInt(_ argb: ARGB) -> TonalPalette { fromHct(.fromInt(argb)) }
  public static func fromHct(_ hct: Hct) -> TonalPalette {
    TonalPalette(hue: hct.hue, chroma: hct.chroma, key: hct)
  }
  public static func fromHueAndChroma(_ hue: Double, _ chroma: Double) -> TonalPalette {
    TonalPalette(hue: hue, chroma: chroma, key: nil)
  }

  /// The palette's key colour (solved on read when the palette was not made from one).
  public var keyColor: Hct { key ?? KeyColor(hue: hue, requestedChroma: chroma).create() }

  /// ARGB at `tone`.
  public func tone(_ tone: Double) -> ARGB { solveToInt(hue, chroma, tone) }

  public func getHct(_ tone: Double) -> Hct { .fromInt(self.tone(tone)) }
}

private struct KeyColor {
  let hue: Double
  let requestedChroma: Double
  private let maxChromaValue = 200.0

  init(hue: Double, requestedChroma: Double) {
    self.hue = hue
    self.requestedChroma = requestedChroma
  }

  func create() -> Hct {
    var cache: [Int: Double] = [:]
    func maxChroma(_ tone: Int) -> Double {
      if let cached = cache[tone] { return cached }
      let chroma = Hct.from(hue, maxChromaValue, Double(tone)).chroma
      cache[tone] = chroma
      return chroma
    }
    let pivotTone = 50
    let toneStepSize = 1
    let epsilon = 0.01
    var lowerTone = 0
    var upperTone = 100
    while lowerTone < upperTone {
      let midTone = (lowerTone + upperTone) / 2  // both non-negative: truncation is Math.floor
      let isAscending = maxChroma(midTone) < maxChroma(midTone + toneStepSize)
      let sufficientChroma = maxChroma(midTone) >= requestedChroma - epsilon
      if sufficientChroma {
        if abs(lowerTone - pivotTone) < abs(upperTone - pivotTone) {
          upperTone = midTone
        } else {
          if lowerTone == midTone { return .from(hue, requestedChroma, Double(lowerTone)) }
          lowerTone = midTone
        }
      } else if isAscending {
        lowerTone = midTone + toneStepSize
      } else {
        upperTone = midTone
      }
    }
    return .from(hue, requestedChroma, Double(lowerTone))
  }
}

// MARK: - Contrast in tone space

/// `ratioOfTones`: the WCAG ratio between two tones.
public func ratioOfTones(_ toneA: Double, _ toneB: Double) -> Double {
  ratioOfYs(yFromLstar(clampDouble(0.0, 100.0, toneA)), yFromLstar(clampDouble(0.0, 100.0, toneB)))
}

func ratioOfYs(_ y1: Double, _ y2: Double) -> Double {
  let lighter = y1 > y2 ? y1 : y2
  let darker = lighter == y2 ? y1 : y2
  return (lighter + 5.0) / (darker + 5.0)
}

func lighterTone(_ tone: Double, _ ratio: Double) -> Double {
  if tone < 0.0 || tone > 100.0 { return -1.0 }
  let darkY = yFromLstar(tone)
  let lightY = ratio * (darkY + 5.0) - 5.0
  let realContrast = ratioOfYs(lightY, darkY)
  let delta = abs(realContrast - ratio)
  if realContrast < ratio && delta > 0.04 { return -1 }
  let returnValue = lstarFromY(lightY) + 0.4
  return returnValue < 0 || returnValue > 100 ? -1 : returnValue
}

func darkerTone(_ tone: Double, _ ratio: Double) -> Double {
  if tone < 0.0 || tone > 100.0 { return -1.0 }
  let lightY = yFromLstar(tone)
  let darkY = (lightY + 5.0) / ratio - 5.0
  let realContrast = ratioOfYs(lightY, darkY)
  let delta = abs(realContrast - ratio)
  if realContrast < ratio && delta > 0.04 { return -1 }
  let returnValue = lstarFromY(darkY) - 0.4
  return returnValue < 0 || returnValue > 100 ? -1 : returnValue
}

func lighterToneUnsafe(_ tone: Double, _ ratio: Double) -> Double {
  let safe = lighterTone(tone, ratio)
  return safe < 0.0 ? 100.0 : safe
}

func darkerToneUnsafe(_ tone: Double, _ ratio: Double) -> Double {
  let safe = darkerTone(tone, ratio)
  return safe < 0.0 ? 0.0 : safe
}

/// `ContrastCurve`: a contrast level (−1 … 1) to a target WCAG ratio.
struct ContrastCurve: Sendable {
  let low: Double
  let normal: Double
  let medium: Double
  let high: Double

  init(_ low: Double, _ normal: Double, _ medium: Double, _ high: Double) {
    self.low = low
    self.normal = normal
    self.medium = medium
    self.high = high
  }

  func get(_ contrastLevel: Double) -> Double {
    if contrastLevel <= -1.0 { return low }
    if contrastLevel < 0.0 { return lerp(low, normal, (contrastLevel - -1) / 1) }
    if contrastLevel < 0.5 { return lerp(normal, medium, (contrastLevel - 0) / 0.5) }
    if contrastLevel < 1.0 { return lerp(medium, high, (contrastLevel - 0.5) / 0.5) }
    return high
  }
}

// MARK: - Dislike analyzer

func isDisliked(_ hct: Hct) -> Bool {
  let huePasses = jsRound(hct.hue) >= 90.0 && jsRound(hct.hue) <= 111.0
  let chromaPasses = jsRound(hct.chroma) > 16.0
  let tonePasses = jsRound(hct.tone) < 65.0
  return huePasses && chromaPasses && tonePasses
}

func fixIfDisliked(_ hct: Hct) -> Hct {
  isDisliked(hct) ? .from(hct.hue, hct.chroma, 70.0) : hct
}
