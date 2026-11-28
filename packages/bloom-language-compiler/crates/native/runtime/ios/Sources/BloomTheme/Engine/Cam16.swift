// Ports of src/theme/color-engine/viewing-conditions.ts and cam16.ts (Material Color Utilities,
// Apache-2.0). Expressions keep the TypeScript's operand order: floating point is not
// associative, and the goldens compare bytes.
import Foundation

struct ViewingConditions: Sendable {
  let n: Double
  let aw: Double
  let nbb: Double
  let ncb: Double
  let c: Double
  let nc: Double
  let rgbD: Vec3
  let fl: Double
  let fLRoot: Double
  let z: Double
  /// `(1.64 - 0.29^n)^0.73`, computed with the conditions as the TypeScript does.
  let chromaFactor: Double

  /// sRGB-like viewing conditions, the only ones Bloom uses.
  static let standard: ViewingConditions = make()

  static func make(
    whitePoint: [Double] = EngineTables.whitePointD65,
    adaptingLuminance: Double = ((200.0 / Double.pi) * yFromLstar(50.0)) / 100.0,
    backgroundLstar: Double = 50.0,
    surround: Double = 2.0,
    discountingIlluminant: Bool = false
  ) -> ViewingConditions {
    let xyz = whitePoint
    let rW = xyz[0] * 0.401288 + xyz[1] * 0.650173 + xyz[2] * -0.051461
    let gW = xyz[0] * -0.250268 + xyz[1] * 1.204414 + xyz[2] * 0.045854
    let bW = xyz[0] * -0.002079 + xyz[1] * 0.048952 + xyz[2] * 0.953127
    let f = 0.8 + surround / 10.0
    let c = f >= 0.9 ? lerp(0.59, 0.69, (f - 0.9) * 10.0) : lerp(0.525, 0.59, (f - 0.8) * 10.0)
    var d = discountingIlluminant
      ? 1.0 : f * (1.0 - (1.0 / 3.6) * jsExp((-adaptingLuminance - 42.0) / 92.0))
    d = d > 1.0 ? 1.0 : d < 0.0 ? 0.0 : d
    let nc = f
    let rgbD: Vec3 = (
      d * (100.0 / rW) + 1.0 - d,
      d * (100.0 / gW) + 1.0 - d,
      d * (100.0 / bW) + 1.0 - d
    )
    let k = 1.0 / (5.0 * adaptingLuminance + 1.0)
    let k4 = k * k * k * k
    let k4F = 1.0 - k4
    let fl = k4 * adaptingLuminance + 0.1 * k4F * k4F * jsCbrt(5.0 * adaptingLuminance)
    let n = yFromLstar(backgroundLstar) / whitePoint[1]
    let z = 1.48 + n.squareRoot()
    let nbb = 0.725 / jsPow(n, 0.2)
    let ncb = nbb
    let rgbAFactors: Vec3 = (
      jsPow((fl * rgbD.0 * rW) / 100.0, 0.42),
      jsPow((fl * rgbD.1 * gW) / 100.0, 0.42),
      jsPow((fl * rgbD.2 * bW) / 100.0, 0.42)
    )
    let rgbA: Vec3 = (
      (400.0 * rgbAFactors.0) / (rgbAFactors.0 + 27.13),
      (400.0 * rgbAFactors.1) / (rgbAFactors.1 + 27.13),
      (400.0 * rgbAFactors.2) / (rgbAFactors.2 + 27.13)
    )
    let aw = (2.0 * rgbA.0 + rgbA.1 + 0.05 * rgbA.2) * nbb
    return ViewingConditions(
      n: n, aw: aw, nbb: nbb, ncb: ncb, c: c, nc: nc, rgbD: rgbD, fl: fl, fLRoot: jsPow(fl, 0.25),
      z: z, chromaFactor: jsPow(1.64 - jsPow(0.29, n), 0.73))
  }
}

/// `Cam16`: a colour in the CAM16 appearance model, with CAM16-UCS coordinates.
public struct Cam16: Sendable, Hashable {
  public let hue: Double
  public let chroma: Double
  public let j: Double
  public let q: Double
  public let m: Double
  public let s: Double
  public let jstar: Double
  public let astar: Double
  public let bstar: Double

  /// CAM16-UCS perceptual distance.
  public func distance(_ other: Cam16) -> Double {
    let dJ = jstar - other.jstar
    let dA = astar - other.astar
    let dB = bstar - other.bstar
    let dEPrime = (dJ * dJ + dA * dA + dB * dB).squareRoot()
    return 1.41 * jsPow(dEPrime, 0.63)
  }

  public static func fromInt(_ argb: ARGB) -> Cam16 {
    fromInt(argb, in: .standard)
  }

  static func fromInt(_ argb: ARGB, in vc: ViewingConditions) -> Cam16 {
    let red = Int((argb & 0x00FF_0000) >> 16)
    let green = Int((argb & 0x0000_FF00) >> 8)
    let blue = Int(argb & 0x0000_00FF)
    let redL = linearized(red)
    let greenL = linearized(green)
    let blueL = linearized(blue)
    let x = 0.41233895 * redL + 0.35762064 * greenL + 0.18051042 * blueL
    let y = 0.2126 * redL + 0.7152 * greenL + 0.0722 * blueL
    let z = 0.01932141 * redL + 0.11916382 * greenL + 0.95034478 * blueL
    return fromXyz(x, y, z, in: vc)
  }

  static func fromXyz(_ x: Double, _ y: Double, _ z: Double, in vc: ViewingConditions) -> Cam16 {
    let rC = 0.401288 * x + 0.650173 * y - 0.051461 * z
    let gC = -0.250268 * x + 1.204414 * y + 0.045854 * z
    let bC = -0.002079 * x + 0.048952 * y + 0.953127 * z
    let rD = vc.rgbD.0 * rC
    let gD = vc.rgbD.1 * gC
    let bD = vc.rgbD.2 * bC
    let rAF = jsPow((vc.fl * abs(rD)) / 100.0, 0.42)
    let gAF = jsPow((vc.fl * abs(gD)) / 100.0, 0.42)
    let bAF = jsPow((vc.fl * abs(bD)) / 100.0, 0.42)
    let rA = (signum(rD) * 400.0 * rAF) / (rAF + 27.13)
    let gA = (signum(gD) * 400.0 * gAF) / (gAF + 27.13)
    let bA = (signum(bD) * 400.0 * bAF) / (bAF + 27.13)
    let a = (11.0 * rA + -12.0 * gA + bA) / 11.0
    let b = (rA + gA - 2.0 * bA) / 9.0
    let u = (20.0 * rA + 20.0 * gA + 21.0 * bA) / 20.0
    let p2 = (40.0 * rA + 20.0 * gA + bA) / 20.0
    let atan2Value = jsAtan2(b, a)
    let atanDegrees = (atan2Value * 180.0) / Double.pi
    let hue = atanDegrees < 0
      ? atanDegrees + 360.0 : atanDegrees >= 360 ? atanDegrees - 360 : atanDegrees
    let hueRadians = (hue * Double.pi) / 180.0
    let ac = p2 * vc.nbb
    let J = 100.0 * jsPow(ac / vc.aw, vc.c * vc.z)
    let Q = (4.0 / vc.c) * (J / 100.0).squareRoot() * (vc.aw + 4.0) * vc.fLRoot
    let huePrime = hue < 20.14 ? hue + 360 : hue
    let eHue = (1.0 / 4.0) * (jsCos((huePrime * Double.pi) / 180.0 + 2.0) + 3.8)
    let p1 = (50000.0 / 13.0) * eHue * vc.nc * vc.ncb
    let t = (p1 * (a * a + b * b).squareRoot()) / (u + 0.305)
    let alpha = jsPow(t, 0.9) * vc.chromaFactor
    let C = alpha * (J / 100.0).squareRoot()
    let M = C * vc.fLRoot
    let s = 50.0 * ((alpha * vc.c) / (vc.aw + 4.0)).squareRoot()
    let jstar = ((1.0 + 100.0 * 0.007) * J) / (1.0 + 0.007 * J)
    let mstar = jsLog(1.0 + 0.0228 * M) / 0.0228
    let astar = mstar * jsCos(hueRadians)
    let bstar = mstar * jsSin(hueRadians)
    return Cam16(hue: hue, chroma: C, j: J, q: Q, m: M, s: s, jstar: jstar, astar: astar, bstar: bstar)
  }

  public static func fromJch(_ j: Double, _ c: Double, _ h: Double) -> Cam16 {
    fromJch(j, c, h, in: .standard)
  }

  static func fromJch(_ j: Double, _ c: Double, _ h: Double, in vc: ViewingConditions) -> Cam16 {
    let q = (4.0 / vc.c) * (j / 100.0).squareRoot() * (vc.aw + 4.0) * vc.fLRoot
    let m = c * vc.fLRoot
    let alpha = c / (j / 100.0).squareRoot()
    let s = 50.0 * ((alpha * vc.c) / (vc.aw + 4.0)).squareRoot()
    let hueRadians = (h * Double.pi) / 180.0
    let jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j)
    let mstar = (1.0 / 0.0228) * jsLog(1.0 + 0.0228 * m)
    let astar = mstar * jsCos(hueRadians)
    let bstar = mstar * jsSin(hueRadians)
    return Cam16(hue: h, chroma: c, j: j, q: q, m: m, s: s, jstar: jstar, astar: astar, bstar: bstar)
  }

  public static func fromUcs(_ jstar: Double, _ astar: Double, _ bstar: Double) -> Cam16 {
    let a = astar
    let b = bstar
    let m = (a * a + b * b).squareRoot()
    let M = (jsExp(m * 0.0228) - 1.0) / 0.0228
    let vc = ViewingConditions.standard
    let c = M / vc.fLRoot
    var h = jsAtan2(b, a) * (180.0 / Double.pi)
    if h < 0.0 { h += 360.0 }
    let j = jstar / (1 - (jstar - 100) * 0.007)
    return fromJch(j, c, h, in: vc)
  }

  public func toInt() -> ARGB { viewed(.standard) }

  func viewed(_ vc: ViewingConditions) -> ARGB {
    let xyz = xyzInViewingConditions(vc)
    return argbFromXyz(xyz.0, xyz.1, xyz.2)
  }

  func xyzInViewingConditions(_ vc: ViewingConditions) -> Vec3 {
    let alpha = chroma == 0.0 || j == 0.0 ? 0.0 : chroma / (j / 100.0).squareRoot()
    let t = jsPow(alpha / vc.chromaFactor, 1.0 / 0.9)
    let hRad = (hue * Double.pi) / 180.0
    let eHue = 0.25 * (jsCos(hRad + 2.0) + 3.8)
    let ac = vc.aw * jsPow(j / 100.0, 1.0 / vc.c / vc.z)
    let p1 = eHue * (50000.0 / 13.0) * vc.nc * vc.ncb
    let p2 = ac / vc.nbb
    let hSin = jsSin(hRad)
    let hCos = jsCos(hRad)
    let gamma = (23.0 * (p2 + 0.305) * t) / (23.0 * p1 + 11.0 * t * hCos + 108.0 * t * hSin)
    let a = gamma * hCos
    let b = gamma * hSin
    let rA = (460.0 * p2 + 451.0 * a + 288.0 * b) / 1403.0
    let gA = (460.0 * p2 - 891.0 * a - 261.0 * b) / 1403.0
    let bA = (460.0 * p2 - 220.0 * a - 6300.0 * b) / 1403.0
    let rCBase = jsMax(0, (27.13 * abs(rA)) / (400.0 - abs(rA)))
    let rC = signum(rA) * (100.0 / vc.fl) * jsPow(rCBase, 1.0 / 0.42)
    let gCBase = jsMax(0, (27.13 * abs(gA)) / (400.0 - abs(gA)))
    let gC = signum(gA) * (100.0 / vc.fl) * jsPow(gCBase, 1.0 / 0.42)
    let bCBase = jsMax(0, (27.13 * abs(bA)) / (400.0 - abs(bA)))
    let bC = signum(bA) * (100.0 / vc.fl) * jsPow(bCBase, 1.0 / 0.42)
    let rF = rC / vc.rgbD.0
    let gF = gC / vc.rgbD.1
    let bF = bC / vc.rgbD.2
    let x = 1.86206786 * rF - 1.01125463 * gF + 0.14918677 * bF
    let y = 0.38752654 * rF + 0.62144744 * gF - 0.00897398 * bF
    let z = -0.0158415 * rF - 0.03412294 * gF + 1.04996444 * bF
    return (x, y, z)
  }
}
