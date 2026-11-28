// Port of src/theme/color-engine/hct-solver.ts (Material Color Utilities' HctSolver,
// Apache-2.0): the closest sRGB colour to a hue, chroma and L*. The numeric tables are
// generated from the TypeScript source (`EngineTables`).
import Foundation

private func sanitizeRadians(_ angle: Double) -> Double {
  (angle + Double.pi * 8).truncatingRemainder(dividingBy: Double.pi * 2)
}

private func trueDelinearized(_ rgbComponent: Double) -> Double {
  let normalized = rgbComponent / 100.0
  let delin = normalized <= 0.0031308 ? normalized * 12.92 : 1.055 * jsPow(normalized, 1.0 / 2.4) - 0.055
  return delin * 255.0
}

private func chromaticAdaptation(_ component: Double) -> Double {
  let af = jsPow(abs(component), 0.42)
  return (signum(component) * 400.0 * af) / (af + 27.13)
}

private func hueOf(_ linrgb: Vec3) -> Double {
  let m = EngineTables.scaledDiscountFromLinrgb
  let rA = chromaticAdaptation(linrgb.0 * m[0][0] + linrgb.1 * m[0][1] + linrgb.2 * m[0][2])
  let gA = chromaticAdaptation(linrgb.0 * m[1][0] + linrgb.1 * m[1][1] + linrgb.2 * m[1][2])
  let bA = chromaticAdaptation(linrgb.0 * m[2][0] + linrgb.1 * m[2][1] + linrgb.2 * m[2][2])
  let a = (11.0 * rA + -12.0 * gA + bA) / 11.0
  let b = (rA + gA - 2.0 * bA) / 9.0
  return jsAtan2(b, a)
}

private func areInCyclicOrder(_ a: Double, _ b: Double, _ c: Double) -> Bool {
  sanitizeRadians(b - a) < sanitizeRadians(c - a)
}

private func intercept(_ source: Double, _ mid: Double, _ target: Double) -> Double {
  (mid - source) / (target - source)
}

private func lerpPoint(_ source: Vec3, _ t: Double, _ target: Vec3) -> Vec3 {
  (
    source.0 + (target.0 - source.0) * t,
    source.1 + (target.1 - source.1) * t,
    source.2 + (target.2 - source.2) * t
  )
}

@inline(__always)
private func coord(_ v: Vec3, _ axis: Int) -> Double {
  axis == 0 ? v.0 : axis == 1 ? v.1 : v.2
}

private func setCoordinate(_ source: Vec3, _ coordinate: Double, _ target: Vec3, _ axis: Int) -> Vec3 {
  let t = intercept(coord(source, axis), coordinate, coord(target, axis))
  return lerpPoint(source, t, target)
}

private func isBounded(_ x: Double) -> Bool { 0.0 <= x && x <= 100.0 }

private func nthVertex(_ y: Double, _ n: Int) -> Vec3 {
  let kR = EngineTables.yFromLinrgb[0]
  let kG = EngineTables.yFromLinrgb[1]
  let kB = EngineTables.yFromLinrgb[2]
  let coordA = n % 4 <= 1 ? 0.0 : 100.0
  let coordB = n % 2 == 0 ? 0.0 : 100.0
  if n < 4 {
    let g = coordA
    let b = coordB
    let r = (y - g * kG - b * kB) / kR
    return isBounded(r) ? (r, g, b) : (-1.0, -1.0, -1.0)
  } else if n < 8 {
    let b = coordA
    let r = coordB
    let g = (y - r * kR - b * kB) / kG
    return isBounded(g) ? (r, g, b) : (-1.0, -1.0, -1.0)
  } else {
    let r = coordA
    let g = coordB
    let b = (y - r * kR - g * kG) / kB
    return isBounded(b) ? (r, g, b) : (-1.0, -1.0, -1.0)
  }
}

private func bisectToSegment(_ y: Double, _ targetHue: Double) -> (Vec3, Vec3) {
  var left: Vec3 = (-1.0, -1.0, -1.0)
  var right: Vec3 = left
  var leftHue = 0.0
  var rightHue = 0.0
  var initialized = false
  var uncut = true
  for n in 0..<12 {
    let mid = nthVertex(y, n)
    if mid.0 < 0 { continue }
    let midHue = hueOf(mid)
    if !initialized {
      left = mid
      right = mid
      leftHue = midHue
      rightHue = midHue
      initialized = true
      continue
    }
    if uncut || areInCyclicOrder(leftHue, midHue, rightHue) {
      uncut = false
      if areInCyclicOrder(leftHue, targetHue, midHue) {
        right = mid
        rightHue = midHue
      } else {
        left = mid
        leftHue = midHue
      }
    }
  }
  return (left, right)
}

private func midpoint(_ a: Vec3, _ b: Vec3) -> Vec3 {
  ((a.0 + b.0) / 2, (a.1 + b.1) / 2, (a.2 + b.2) / 2)
}

private func criticalPlaneBelow(_ x: Double) -> Int { Int((x - 0.5).rounded(.down)) }
private func criticalPlaneAbove(_ x: Double) -> Int { Int((x - 0.5).rounded(.up)) }

private func bisectToLimit(_ y: Double, _ targetHue: Double) -> Vec3 {
  let segment = bisectToSegment(y, targetHue)
  var left = segment.0
  var leftHue = hueOf(left)
  var right = segment.1
  for axis in 0..<3 {
    let leftAxis = coord(left, axis)
    let rightAxis = coord(right, axis)
    if leftAxis != rightAxis {
      var lPlane: Int
      var rPlane: Int
      if leftAxis < rightAxis {
        lPlane = criticalPlaneBelow(trueDelinearized(leftAxis))
        rPlane = criticalPlaneAbove(trueDelinearized(rightAxis))
      } else {
        lPlane = criticalPlaneAbove(trueDelinearized(leftAxis))
        rPlane = criticalPlaneBelow(trueDelinearized(rightAxis))
      }
      for _ in 0..<8 {
        if abs(rPlane - lPlane) <= 1 { break }
        // `Math.floor((lPlane + rPlane) / 2.0)`, a floor (not truncation) for a negative sum.
        let mPlane = Int((Double(lPlane + rPlane) / 2.0).rounded(.down))
        let midPlaneCoordinate = EngineTables.criticalPlanes[mPlane]
        let mid = setCoordinate(left, midPlaneCoordinate, right, axis)
        let midHue = hueOf(mid)
        if areInCyclicOrder(leftHue, targetHue, midHue) {
          right = mid
          rPlane = mPlane
        } else {
          left = mid
          leftHue = midHue
          lPlane = mPlane
        }
      }
    }
  }
  return midpoint(left, right)
}

private func inverseChromaticAdaptation(_ adapted: Double) -> Double {
  let adaptedAbs = abs(adapted)
  let base = jsMax(0, (27.13 * adaptedAbs) / (400.0 - adaptedAbs))
  return signum(adapted) * jsPow(base, 1.0 / 0.42)
}

private func findResultByJ(_ hueRadians: Double, _ chroma: Double, _ y: Double) -> ARGB {
  var j = y.squareRoot() * 11.0
  let vc = ViewingConditions.standard
  let tInnerCoeff = 1 / vc.chromaFactor
  let eHue = 0.25 * (jsCos(hueRadians + 2.0) + 3.8)
  let p1 = eHue * (50000.0 / 13.0) * vc.nc * vc.ncb
  let hSin = jsSin(hueRadians)
  let hCos = jsCos(hueRadians)
  for iterationRound in 0..<5 {
    let jNormalized = j / 100.0
    let alpha = chroma == 0.0 || j == 0.0 ? 0.0 : chroma / jNormalized.squareRoot()
    let t = jsPow(alpha * tInnerCoeff, 1.0 / 0.9)
    let ac = vc.aw * jsPow(jNormalized, 1.0 / vc.c / vc.z)
    let p2 = ac / vc.nbb
    let gamma = (23.0 * (p2 + 0.305) * t) / (23.0 * p1 + 11 * t * hCos + 108.0 * t * hSin)
    let a = gamma * hCos
    let b = gamma * hSin
    let rA = (460.0 * p2 + 451.0 * a + 288.0 * b) / 1403.0
    let gA = (460.0 * p2 - 891.0 * a - 261.0 * b) / 1403.0
    let bA = (460.0 * p2 - 220.0 * a - 6300.0 * b) / 1403.0
    let rCScaled = inverseChromaticAdaptation(rA)
    let gCScaled = inverseChromaticAdaptation(gA)
    let bCScaled = inverseChromaticAdaptation(bA)
    let linrgb = matrixMultiply((rCScaled, gCScaled, bCScaled), EngineTables.linrgbFromScaledDiscount)
    if linrgb.0 < 0 || linrgb.1 < 0 || linrgb.2 < 0 { return 0 }
    let kR = EngineTables.yFromLinrgb[0]
    let kG = EngineTables.yFromLinrgb[1]
    let kB = EngineTables.yFromLinrgb[2]
    let fnj = kR * linrgb.0 + kG * linrgb.1 + kB * linrgb.2
    if fnj <= 0 { return 0 }
    if iterationRound == 4 || abs(fnj - y) < 0.002 {
      if linrgb.0 > 100.01 || linrgb.1 > 100.01 || linrgb.2 > 100.01 { return 0 }
      return argbFromLinrgb(linrgb)
    }
    j = j - ((fnj - y) * j) / (2 * fnj)
  }
  return 0
}

/// `solveToInt`: the sRGB colour with this hue (degrees), chroma and L*; out of gamut, hue and
/// L* are kept and chroma is maximised.
func solveToInt(_ hueDegrees: Double, _ chroma: Double, _ lstar: Double) -> ARGB {
  if chroma < 0.0001 || lstar < 0.0001 || lstar > 99.9999 {
    return argbFromLstar(lstar)
  }
  let hue = sanitizeDegreesDouble(hueDegrees)
  let hueRadians = (hue / 180) * Double.pi
  let y = yFromLstar(lstar)
  let exactAnswer = findResultByJ(hueRadians, chroma, y)
  if exactAnswer != 0 { return exactAnswer }
  let linrgb = bisectToLimit(y, hueRadians)
  return argbFromLinrgb(linrgb)
}
