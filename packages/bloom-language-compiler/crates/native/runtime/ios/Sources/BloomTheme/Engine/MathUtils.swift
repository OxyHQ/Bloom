// Port of src/theme/color-engine/math-utils.ts. Same operations in the same order, so every
// double comes out bit-identical to the TypeScript.
import Foundation

@inline(__always)
func signum(_ n: Double) -> Double { n < 0 ? -1 : n == 0 ? 0 : 1 }

@inline(__always)
func lerp(_ start: Double, _ stop: Double, _ amount: Double) -> Double {
  (1.0 - amount) * start + amount * stop
}

@inline(__always)
func clampInt(_ min: Int, _ max: Int, _ input: Int) -> Int {
  input < min ? min : input > max ? max : input
}

@inline(__always)
func clampDouble(_ min: Double, _ max: Double, _ input: Double) -> Double {
  input < min ? min : input > max ? max : input
}

/// `sanitizeDegreesInt`: JavaScript's `%` truncates, like Swift's integer `%`.
@inline(__always)
func sanitizeDegreesInt(_ degrees: Int) -> Int {
  let d = degrees % 360
  return d < 0 ? d + 360 : d
}

/// `sanitizeDegreesDouble`: JavaScript's `%` on doubles is C's `fmod`.
@inline(__always)
func sanitizeDegreesDouble(_ degrees: Double) -> Double {
  let d = degrees.truncatingRemainder(dividingBy: 360.0)
  return d < 0 ? d + 360.0 : d
}

func rotationDirection(_ from: Double, _ to: Double) -> Double {
  sanitizeDegreesDouble(to - from) <= 180.0 ? 1.0 : -1.0
}

func differenceDegrees(_ a: Double, _ b: Double) -> Double {
  180.0 - abs(abs(a - b) - 180.0)
}

typealias Vec3 = (Double, Double, Double)

@inline(__always)
func matrixMultiply(_ row: Vec3, _ m: [[Double]]) -> Vec3 {
  let a = row.0 * m[0][0] + row.1 * m[0][1] + row.2 * m[0][2]
  let b = row.0 * m[1][0] + row.1 * m[1][1] + row.2 * m[1][2]
  let c = row.0 * m[2][0] + row.1 * m[2][1] + row.2 * m[2][2]
  return (a, b, c)
}

/// `Math.max`: NaN wins (Swift's `max` would return the other operand).
@inline(__always)
func jsMax(_ a: Double, _ b: Double) -> Double {
  if a.isNaN || b.isNaN { return .nan }
  if a == 0 && b == 0 { return a.sign == .plus ? a : b }
  return a > b ? a : b
}

/// `Math.min`: NaN wins.
@inline(__always)
func jsMin(_ a: Double, _ b: Double) -> Double {
  if a.isNaN || b.isNaN { return .nan }
  if a == 0 && b == 0 { return a.sign == .minus ? a : b }
  return a < b ? a : b
}
