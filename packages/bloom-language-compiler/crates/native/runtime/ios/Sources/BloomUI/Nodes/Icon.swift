// `Icon`: a glyph of Bloom's set (src/icons: Remix and Bloom's own), drawn from its SVG path
// data as react-native-svg draws it today: even-odd, filled, or only stroked when the glyph is
// a stroke (`LikeIcon`, `ReplyIcon`). Size md (20 pt) and the subtree's ink by default.
#if canImport(SwiftUI)
import SwiftUI
#endif
import Foundation

/// A glyph: its path data in its viewBox (Generated/Glyphs.generated.swift).
public struct Glyph: Sendable, Hashable {
  public enum Cap: Sendable, Hashable { case butt, round, square }
  public enum Join: Sendable, Hashable { case miter, round, bevel }
  public let name: String
  public let paths: [String]
  public let width: Double
  public let height: Double
  public let strokeWidth: Double?
  public let cap: Cap
  public let join: Join

  public init(name: String, paths: [String], width: Double, height: Double, strokeWidth: Double?, cap: Cap, join: Join) {
    self.name = name; self.paths = paths; self.width = width; self.height = height
    self.strokeWidth = strokeWidth; self.cap = cap; self.join = join
  }
}

/// One segment of a path, in viewBox units, absolute.
public enum PathSegment: Sendable, Equatable {
  case move(Double, Double)
  case line(Double, Double)
  case cubic(Double, Double, Double, Double, Double, Double)
  case quad(Double, Double, Double, Double)
  case close
}

/// SVG path data (`M`, `L`, `H`, `V`, `C`, `S`, `Q`, `T`, `A`, `Z`, absolute and relative) as
/// segments; an arc becomes cubic Béziers (SVG 1.1, F.6).
public enum SVGPath {
  public static func parse(_ d: String) -> [PathSegment] {
    var scanner = Scanner(d)
    var out: [PathSegment] = []
    var (x, y) = (0.0, 0.0)
    var (sx, sy) = (0.0, 0.0)
    var lastControl: (Double, Double)? = nil
    var lastQuad: (Double, Double)? = nil
    var command: Character = "M"
    while scanner.skipSeparators() {
      if let c = scanner.command() { command = c } else if command == "M" { command = "L" } else if command == "m" { command = "l" }
      let rel = command.isLowercase
      let ox = rel ? x : 0, oy = rel ? y : 0
      switch command.uppercased() {
      case "M":
        guard let px = scanner.number(), let py = scanner.number() else { return out }
        x = ox + px; y = oy + py; sx = x; sy = y
        out.append(.move(x, y)); lastControl = nil; lastQuad = nil
      case "L":
        guard let px = scanner.number(), let py = scanner.number() else { return out }
        x = ox + px; y = oy + py
        out.append(.line(x, y)); lastControl = nil; lastQuad = nil
      case "H":
        guard let px = scanner.number() else { return out }
        x = (rel ? x : 0) + px
        out.append(.line(x, y)); lastControl = nil; lastQuad = nil
      case "V":
        guard let py = scanner.number() else { return out }
        y = (rel ? y : 0) + py
        out.append(.line(x, y)); lastControl = nil; lastQuad = nil
      case "C":
        guard let a = scanner.number(), let b = scanner.number(), let c = scanner.number(),
              let e = scanner.number(), let f = scanner.number(), let g = scanner.number() else { return out }
        out.append(.cubic(ox + a, oy + b, ox + c, oy + e, ox + f, oy + g))
        lastControl = (ox + c, oy + e); lastQuad = nil
        x = ox + f; y = oy + g
      case "S":
        guard let c = scanner.number(), let e = scanner.number(), let f = scanner.number(), let g = scanner.number() else { return out }
        let (c1x, c1y) = lastControl.map { (2 * x - $0.0, 2 * y - $0.1) } ?? (x, y)
        out.append(.cubic(c1x, c1y, ox + c, oy + e, ox + f, oy + g))
        lastControl = (ox + c, oy + e); lastQuad = nil
        x = ox + f; y = oy + g
      case "Q":
        guard let a = scanner.number(), let b = scanner.number(), let c = scanner.number(), let e = scanner.number() else { return out }
        out.append(.quad(ox + a, oy + b, ox + c, oy + e))
        lastQuad = (ox + a, oy + b); lastControl = nil
        x = ox + c; y = oy + e
      case "T":
        guard let c = scanner.number(), let e = scanner.number() else { return out }
        let q = lastQuad.map { (2 * x - $0.0, 2 * y - $0.1) } ?? (x, y)
        out.append(.quad(q.0, q.1, ox + c, oy + e))
        lastQuad = q; lastControl = nil
        x = ox + c; y = oy + e
      case "A":
        guard let rx = scanner.number(), let ry = scanner.number(), let rot = scanner.number(),
              let large = scanner.flag(), let sweep = scanner.flag(),
              let px = scanner.number(), let py = scanner.number() else { return out }
        let (ex, ey) = (ox + px, oy + py)
        out.append(contentsOf: arc(from: (x, y), to: (ex, ey), rx: rx, ry: ry, rotation: rot, large: large, sweep: sweep))
        x = ex; y = ey; lastControl = nil; lastQuad = nil
      case "Z":
        out.append(.close)
        x = sx; y = sy; lastControl = nil; lastQuad = nil
      default:
        return out
      }
    }
    return out
  }

  /// An elliptical arc as cubic Béziers (SVG 1.1 implementation notes, F.6.5 and F.6.6).
  static func arc(from p0: (Double, Double), to p1: (Double, Double), rx: Double, ry: Double, rotation: Double, large: Bool, sweep: Bool) -> [PathSegment] {
    var rx = abs(rx), ry = abs(ry)
    if rx == 0 || ry == 0 || (p0.0 == p1.0 && p0.1 == p1.1) { return [.line(p1.0, p1.1)] }
    let phi = rotation * .pi / 180
    let (cosPhi, sinPhi) = (cos(phi), sin(phi))
    let dx = (p0.0 - p1.0) / 2, dy = (p0.1 - p1.1) / 2
    let x1 = cosPhi * dx + sinPhi * dy
    let y1 = -sinPhi * dx + cosPhi * dy
    let lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
    if lambda > 1 { rx *= lambda.squareRoot(); ry *= lambda.squareRoot() }
    let num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
    let den = rx * rx * y1 * y1 + ry * ry * x1 * x1
    var coef = (max(0, num / den)).squareRoot()
    if large == sweep { coef = -coef }
    let cx1 = coef * rx * y1 / ry
    let cy1 = -coef * ry * x1 / rx
    let cx = cosPhi * cx1 - sinPhi * cy1 + (p0.0 + p1.0) / 2
    let cy = sinPhi * cx1 + cosPhi * cy1 + (p0.1 + p1.1) / 2
    func angle(_ ux: Double, _ uy: Double, _ vx: Double, _ vy: Double) -> Double {
      let a = atan2(ux * vy - uy * vx, ux * vx + uy * vy)
      return a
    }
    let theta1 = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
    var delta = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
    if !sweep && delta > 0 { delta -= 2 * .pi }
    if sweep && delta < 0 { delta += 2 * .pi }
    let count = max(1, Int((abs(delta) / (.pi / 2)).rounded(.up)))
    let step = delta / Double(count)
    let t = 4.0 / 3.0 * tan(step / 4)
    var out: [PathSegment] = []
    var a1 = theta1
    for _ in 0..<count {
      let a2 = a1 + step
      let (c1, s1, c2, s2) = (cos(a1), sin(a1), cos(a2), sin(a2))
      func map(_ px: Double, _ py: Double) -> (Double, Double) {
        (cosPhi * rx * px - sinPhi * ry * py + cx, sinPhi * rx * px + cosPhi * ry * py + cy)
      }
      let q1 = map(c1 - t * s1, s1 + t * c1)
      let q2 = map(c2 + t * s2, s2 - t * c2)
      let e = map(c2, s2)
      out.append(.cubic(q1.0, q1.1, q2.0, q2.1, e.0, e.1))
      a1 = a2
    }
    return out
  }

  struct Scanner {
    let chars: [Character]
    var i = 0
    init(_ s: String) { chars = Array(s) }

    /// Skips whitespace and commas; whether anything is left.
    mutating func skipSeparators() -> Bool {
      while i < chars.count, chars[i] == " " || chars[i] == "," || chars[i] == "\n" || chars[i] == "\t" || chars[i] == "\r" { i += 1 }
      return i < chars.count
    }

    mutating func command() -> Character? {
      guard i < chars.count, chars[i].isLetter, chars[i] != "e", chars[i] != "E" else { return nil }
      defer { i += 1 }
      return chars[i]
    }

    /// An arc flag: one `0` or `1`, which may be written with no separator after it.
    mutating func flag() -> Bool? {
      _ = skipSeparators()
      guard i < chars.count, chars[i] == "0" || chars[i] == "1" else { return nil }
      defer { i += 1 }
      return chars[i] == "1"
    }

    mutating func number() -> Double? {
      _ = skipSeparators()
      let start = i
      if i < chars.count, chars[i] == "-" || chars[i] == "+" { i += 1 }
      var dot = false
      while i < chars.count {
        let c = chars[i]
        if c.isNumber { i += 1 } else if c == ".", !dot { dot = true; i += 1 } else { break }
      }
      if i < chars.count, chars[i] == "e" || chars[i] == "E" {
        i += 1
        if i < chars.count, chars[i] == "-" || chars[i] == "+" { i += 1 }
        while i < chars.count, chars[i].isNumber { i += 1 }
      }
      guard i > start else { return nil }
      return Double(String(chars[start..<i]))
    }
  }
}

/// Parsed glyphs, kept: a glyph's path data is read once per process.
final class GlyphCache: @unchecked Sendable {
  static let shared = GlyphCache()
  private let lock = NSLock()
  private var parsed: [String: [PathSegment]] = [:]

  func segments(_ glyph: Glyph) -> [PathSegment] {
    lock.lock()
    defer { lock.unlock() }
    if let hit = parsed[glyph.name] { return hit }
    let segments = glyph.paths.flatMap { SVGPath.parse($0) }
    parsed[glyph.name] = segments
    return segments
  }
}

#if canImport(SwiftUI)
/// A glyph as a shape, scaled from its viewBox to the frame.
public struct GlyphShape: Shape {
  public let glyph: Glyph
  public init(_ glyph: Glyph) { self.glyph = glyph }

  nonisolated public func path(in rect: CGRect) -> Path {
    let sx = rect.width / CGFloat(glyph.width), sy = rect.height / CGFloat(glyph.height)
    func p(_ x: Double, _ y: Double) -> CGPoint { CGPoint(x: rect.minX + CGFloat(x) * sx, y: rect.minY + CGFloat(y) * sy) }
    var path = Path()
    var current = CGPoint.zero
    for segment in GlyphCache.shared.segments(glyph) {
      switch segment {
      case .move(let x, let y): current = p(x, y); path.move(to: current)
      case .line(let x, let y): current = p(x, y); path.addLine(to: current)
      case .cubic(let a, let b, let c, let d, let e, let f):
        current = p(e, f)
        path.addCurve(to: current, control1: p(a, b), control2: p(c, d))
      case .quad(let a, let b, let c, let d):
        current = p(c, d)
        path.addQuadCurve(to: current, control: p(a, b))
      case .close: path.closeSubpath()
      }
    }
    return path
  }
}

public struct Icon: View {
  let glyph: Glyph
  var size: Tokens.IconSize = .md
  @Environment(\.bloomInk) private var ink
  @Environment(\.bloomPalette) private var palette

  public init(_ glyph: Glyph) { self.glyph = glyph }

  public var body: some View {
    let side = CGFloat(size.value)
    let color = palette.color(ink.foreground ?? BloomColor(.foreground))
    let shape = GlyphShape(glyph)
    Group {
      if let stroke = glyph.strokeWidth {
        shape.stroke(color, style: StrokeStyle(lineWidth: CGFloat(stroke) * side / CGFloat(glyph.width), lineCap: glyph.cap.swift, lineJoin: glyph.join.swift))
      } else {
        shape.fill(color, style: FillStyle(eoFill: true))
      }
    }
    .frame(width: side, height: side)
    .accessibilityHidden(true)
  }

  public func size(_ size: Tokens.IconSize) -> Icon { var i = self; i.size = size; return i }
}

extension Glyph.Cap {
  var swift: CGLineCap {
    switch self {
    case .butt: .butt
    case .round: .round
    case .square: .square
    }
  }
}

extension Glyph.Join {
  var swift: CGLineJoin {
    switch self {
    case .miter: .miter
    case .round: .round
    case .bevel: .bevel
    }
  }
}
#endif
