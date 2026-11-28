// Port of src/theme/color-engine/color-utils.ts: ARGB, XYZ, L*a*b*, (de)linearisation and L*.
// An ARGB colour is a `UInt32`, which is what the TypeScript's `>>> 0` normalises to.
import Foundation

public typealias ARGB = UInt32

/// `argbFromRgb`: pack 0–255 channels into an opaque ARGB.
public func argbFromRgb(_ red: Int, _ green: Int, _ blue: Int) -> ARGB {
  0xFF00_0000 | (UInt32(red & 255) << 16) | (UInt32(green & 255) << 8) | UInt32(blue & 255)
}

func argbFromLinrgb(_ linrgb: Vec3) -> ARGB {
  argbFromRgb(delinearized(linrgb.0), delinearized(linrgb.1), delinearized(linrgb.2))
}

@inline(__always) public func alphaFromArgb(_ argb: ARGB) -> Int { Int((argb >> 24) & 255) }
@inline(__always) public func redFromArgb(_ argb: ARGB) -> Int { Int((argb >> 16) & 255) }
@inline(__always) public func greenFromArgb(_ argb: ARGB) -> Int { Int((argb >> 8) & 255) }
@inline(__always) public func blueFromArgb(_ argb: ARGB) -> Int { Int(argb & 255) }
func isOpaque(_ argb: ARGB) -> Bool { alphaFromArgb(argb) >= 255 }

/// `argbFromHex`: `#rrggbb` (or `#aarrggbb`) to ARGB, exactly as `parseInt(v, 16) >>> 0` reads
/// it — the leading hex digits, wrapped to 32 bits; none at all is 0.
public func argbFromHex(_ hex: String) -> ARGB {
  var h = hex
  if let i = h.firstIndex(of: "#") { h.remove(at: i) }  // `replace('#', '')` drops the first only
  let v = h.count == 6 ? "ff" + h : h
  var text = Substring(jsTrimStart(v))
  var negative = false
  if let sign = text.first, sign == "-" || sign == "+" {
    negative = sign == "-"
    text = text.dropFirst()
  }
  if text.hasPrefix("0x") || text.hasPrefix("0X") { text = text.dropFirst(2) }
  var value: UInt32 = 0
  digits: for scalar in text.unicodeScalars {
    let digit: UInt32
    switch scalar.value {
    case 48...57: digit = scalar.value - 48
    case 65...70: digit = scalar.value - 55
    case 97...102: digit = scalar.value - 87
    default: break digits
    }
    value = value &* 16 &+ digit
  }
  return negative ? 0 &- value : value
}

/// `hexFromArgb`: `#rrggbb`.
public func hexFromArgb(_ argb: ARGB) -> String {
  func two(_ v: Int) -> String {
    let s = String(v, radix: 16)
    return s.count < 2 ? "0" + s : s
  }
  return "#" + two(redFromArgb(argb)) + two(greenFromArgb(argb)) + two(blueFromArgb(argb))
}

func argbFromXyz(_ x: Double, _ y: Double, _ z: Double) -> ARGB {
  let m = EngineTables.xyzToSrgb
  let linearR = m[0][0] * x + m[0][1] * y + m[0][2] * z
  let linearG = m[1][0] * x + m[1][1] * y + m[1][2] * z
  let linearB = m[2][0] * x + m[2][1] * y + m[2][2] * z
  return argbFromRgb(delinearized(linearR), delinearized(linearG), delinearized(linearB))
}

func xyzFromArgb(_ argb: ARGB) -> Vec3 {
  let r = linearized(redFromArgb(argb))
  let g = linearized(greenFromArgb(argb))
  let b = linearized(blueFromArgb(argb))
  return matrixMultiply((r, g, b), EngineTables.srgbToXyz)
}

func argbFromLab(_ l: Double, _ a: Double, _ b: Double) -> ARGB {
  let wp = EngineTables.whitePointD65
  let fy = (l + 16.0) / 116.0
  let fx = a / 500.0 + fy
  let fz = fy - b / 200.0
  let x = labInvf(fx) * wp[0]
  let y = labInvf(fy) * wp[1]
  let z = labInvf(fz) * wp[2]
  return argbFromXyz(x, y, z)
}

func labFromArgb(_ argb: ARGB) -> Vec3 {
  let linearR = linearized(redFromArgb(argb))
  let linearG = linearized(greenFromArgb(argb))
  let linearB = linearized(blueFromArgb(argb))
  let m = EngineTables.srgbToXyz
  let x = m[0][0] * linearR + m[0][1] * linearG + m[0][2] * linearB
  let y = m[1][0] * linearR + m[1][1] * linearG + m[1][2] * linearB
  let z = m[2][0] * linearR + m[2][1] * linearG + m[2][2] * linearB
  let wp = EngineTables.whitePointD65
  let fx = labF(x / wp[0])
  let fy = labF(y / wp[1])
  let fz = labF(z / wp[2])
  return (116.0 * fy - 16, 500.0 * (fx - fy), 200.0 * (fy - fz))
}

func argbFromLstar(_ lstar: Double) -> ARGB {
  let component = delinearized(yFromLstar(lstar))
  return argbFromRgb(component, component, component)
}

func lstarFromArgb(_ argb: ARGB) -> Double {
  let y = xyzFromArgb(argb).1
  return 116.0 * labF(y / 100.0) - 16.0
}

func yFromLstar(_ lstar: Double) -> Double {
  100.0 * labInvf((lstar + 16.0) / 116.0)
}

func lstarFromY(_ y: Double) -> Double {
  labF(y / 100.0) * 116.0 - 16.0
}

/// `linearized`: a channel 0–255 to linear 0–100, from the same once-solved table.
@inline(__always)
func linearized(_ rgbComponent: Int) -> Double {
  rgbComponent >= 0 && rgbComponent < 256 ? linearizedTable[rgbComponent] : solveLinearized(Double(rgbComponent))
}

private func solveLinearized(_ rgbComponent: Double) -> Double {
  let normalized = rgbComponent / 255.0
  return normalized <= 0.040449936
    ? (normalized / 12.92) * 100.0
    : pow((normalized + 0.055) / 1.055, 2.4) * 100.0
}

private let linearizedTable: [Double] = (0..<256).map { solveLinearized(Double($0)) }

/// `delinearized`: linear 0–100 to a channel 0–255 (`Math.round`, clamped). A NaN channel is
/// 0, as `NaN & 255` is.
func delinearized(_ rgbComponent: Double) -> Int {
  let normalized = rgbComponent / 100.0
  let delin = normalized <= 0.0031308 ? normalized * 12.92 : 1.055 * pow(normalized, 1.0 / 2.4) - 0.055
  let rounded = jsRound(delin * 255.0)
  if rounded.isNaN { return 0 }
  return rounded < 0 ? 0 : rounded > 255 ? 255 : Int(rounded)
}

private func labF(_ t: Double) -> Double {
  let e = 216.0 / 24389.0
  let kappa = 24389.0 / 27.0
  return t > e ? pow(t, 1.0 / 3.0) : (kappa * t + 16) / 116
}

private func labInvf(_ ft: Double) -> Double {
  let e = 216.0 / 24389.0
  let kappa = 24389.0 / 27.0
  let ft3 = ft * ft * ft
  return ft3 > e ? ft3 : (116 * ft - 16) / kappa
}
