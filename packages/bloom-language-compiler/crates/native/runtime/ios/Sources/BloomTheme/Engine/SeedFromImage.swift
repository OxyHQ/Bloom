// Ports of src/theme/color-engine/quantizer-map.ts, quantizer-wu.ts, lab-point-provider.ts,
// score.ts and seed-from-image.ts: the ambient accent's seeds, from an image's pixels.
import Foundation

/// An insertion-ordered colour histogram, as the TypeScript `Map` iterates.
struct ColorCounts {
  private(set) var colors: [ARGB] = []
  private(set) var counts: [ARGB: Int] = [:]

  mutating func add(_ color: ARGB, _ count: Int) {
    if let existing = counts[color] {
      counts[color] = existing + count
    } else {
      counts[color] = count
      colors.append(color)
    }
  }
}

/// `countByColor`: opaque pixels by exact ARGB.
func countByColor(_ pixels: [ARGB]) -> ColorCounts {
  var counts = ColorCounts()
  for pixel in pixels where alphaFromArgb(pixel) >= 255 { counts.add(pixel, 1) }
  return counts
}

private let indexBits = 5
private let sideLength = 33
private let totalSize = 35937

private struct Box {
  var r0 = 0, r1 = 0, g0 = 0, g1 = 0, b0 = 0, b1 = 0, vol = 0
}

private enum Direction { case red, green, blue }

@inline(__always)
private func getIndex(_ r: Int, _ g: Int, _ b: Int) -> Int {
  (r << (indexBits * 2)) + (r << (indexBits + 1)) + r + (g << indexBits) + g + b
}

/// `quantizeWu`: at most `maxColors` representative colours.
func quantizeWu(_ pixels: [ARGB], _ maxColors: Int) -> [ARGB] {
  var weights = [Double](repeating: 0, count: totalSize)
  var momentsR = [Double](repeating: 0, count: totalSize)
  var momentsG = [Double](repeating: 0, count: totalSize)
  var momentsB = [Double](repeating: 0, count: totalSize)
  var moments = [Double](repeating: 0, count: totalSize)

  let counts = countByColor(pixels)
  let bitsToRemove = 8 - indexBits
  for pixel in counts.colors {
    let count = Double(counts.counts[pixel]!)
    let red = redFromArgb(pixel)
    let green = greenFromArgb(pixel)
    let blue = blueFromArgb(pixel)
    let index = getIndex((red >> bitsToRemove) + 1, (green >> bitsToRemove) + 1, (blue >> bitsToRemove) + 1)
    weights[index] += count
    momentsR[index] += count * Double(red)
    momentsG[index] += count * Double(green)
    momentsB[index] += count * Double(blue)
    moments[index] += count * Double(red * red + green * green + blue * blue)
  }

  for r in 1..<sideLength {
    var area = [Double](repeating: 0, count: sideLength)
    var areaR = area, areaG = area, areaB = area, area2 = area
    for g in 1..<sideLength {
      var line = 0.0, lineR = 0.0, lineG = 0.0, lineB = 0.0, line2 = 0.0
      for b in 1..<sideLength {
        let index = getIndex(r, g, b)
        line += weights[index]
        lineR += momentsR[index]
        lineG += momentsG[index]
        lineB += momentsB[index]
        line2 += moments[index]
        area[b] += line
        areaR[b] += lineR
        areaG[b] += lineG
        areaB[b] += lineB
        area2[b] += line2
        let prev = getIndex(r - 1, g, b)
        weights[index] = weights[prev] + area[b]
        momentsR[index] = momentsR[prev] + areaR[b]
        momentsG[index] = momentsG[prev] + areaG[b]
        momentsB[index] = momentsB[prev] + areaB[b]
        moments[index] = moments[prev] + area2[b]
      }
    }
  }

  func volume(_ c: Box, _ m: [Double]) -> Double {
    m[getIndex(c.r1, c.g1, c.b1)] - m[getIndex(c.r1, c.g1, c.b0)] - m[getIndex(c.r1, c.g0, c.b1)]
      + m[getIndex(c.r1, c.g0, c.b0)] - m[getIndex(c.r0, c.g1, c.b1)] + m[getIndex(c.r0, c.g1, c.b0)]
      + m[getIndex(c.r0, c.g0, c.b1)] - m[getIndex(c.r0, c.g0, c.b0)]
  }

  func bottom(_ c: Box, _ d: Direction, _ m: [Double]) -> Double {
    switch d {
    case .red:
      return -m[getIndex(c.r0, c.g1, c.b1)] + m[getIndex(c.r0, c.g1, c.b0)]
        + m[getIndex(c.r0, c.g0, c.b1)] - m[getIndex(c.r0, c.g0, c.b0)]
    case .green:
      return -m[getIndex(c.r1, c.g0, c.b1)] + m[getIndex(c.r1, c.g0, c.b0)]
        + m[getIndex(c.r0, c.g0, c.b1)] - m[getIndex(c.r0, c.g0, c.b0)]
    case .blue:
      return -m[getIndex(c.r1, c.g1, c.b0)] + m[getIndex(c.r1, c.g0, c.b0)]
        + m[getIndex(c.r0, c.g1, c.b0)] - m[getIndex(c.r0, c.g0, c.b0)]
    }
  }

  func top(_ c: Box, _ d: Direction, _ p: Int, _ m: [Double]) -> Double {
    switch d {
    case .red:
      return m[getIndex(p, c.g1, c.b1)] - m[getIndex(p, c.g1, c.b0)] - m[getIndex(p, c.g0, c.b1)]
        + m[getIndex(p, c.g0, c.b0)]
    case .green:
      return m[getIndex(c.r1, p, c.b1)] - m[getIndex(c.r1, p, c.b0)] - m[getIndex(c.r0, p, c.b1)]
        + m[getIndex(c.r0, p, c.b0)]
    case .blue:
      return m[getIndex(c.r1, c.g1, p)] - m[getIndex(c.r1, c.g0, p)] - m[getIndex(c.r0, c.g1, p)]
        + m[getIndex(c.r0, c.g0, p)]
    }
  }

  func variance(_ c: Box) -> Double {
    let dr = volume(c, momentsR)
    let dg = volume(c, momentsG)
    let db = volume(c, momentsB)
    let xx = volume(c, moments)
    let hypotenuse = dr * dr + dg * dg + db * db
    return xx - hypotenuse / volume(c, weights)
  }

  func maximize(
    _ c: Box, _ d: Direction, _ first: Int, _ last: Int,
    _ wholeR: Double, _ wholeG: Double, _ wholeB: Double, _ wholeW: Double
  ) -> (cutLocation: Int, maximum: Double) {
    let bottomR = bottom(c, d, momentsR)
    let bottomG = bottom(c, d, momentsG)
    let bottomB = bottom(c, d, momentsB)
    let bottomW = bottom(c, d, weights)
    var maxValue = 0.0
    var cut = -1
    var i = first
    while i < last {
      defer { i += 1 }
      var halfR = bottomR + top(c, d, i, momentsR)
      var halfG = bottomG + top(c, d, i, momentsG)
      var halfB = bottomB + top(c, d, i, momentsB)
      var halfW = bottomW + top(c, d, i, weights)
      if halfW == 0 { continue }
      var temp = (halfR * halfR + halfG * halfG + halfB * halfB) / halfW
      halfR = wholeR - halfR
      halfG = wholeG - halfG
      halfB = wholeB - halfB
      halfW = wholeW - halfW
      if halfW == 0 { continue }
      temp += (halfR * halfR + halfG * halfG + halfB * halfB) / halfW
      if temp > maxValue {
        maxValue = temp
        cut = i
      }
    }
    return (cut, maxValue)
  }

  func cut(_ one: inout Box, _ two: inout Box) -> Bool {
    let wholeR = volume(one, momentsR)
    let wholeG = volume(one, momentsG)
    let wholeB = volume(one, momentsB)
    let wholeW = volume(one, weights)
    let maxR = maximize(one, .red, one.r0 + 1, one.r1, wholeR, wholeG, wholeB, wholeW)
    let maxG = maximize(one, .green, one.g0 + 1, one.g1, wholeR, wholeG, wholeB, wholeW)
    let maxB = maximize(one, .blue, one.b0 + 1, one.b1, wholeR, wholeG, wholeB, wholeW)
    let direction: Direction
    if maxR.maximum >= maxG.maximum && maxR.maximum >= maxB.maximum {
      if maxR.cutLocation < 0 { return false }
      direction = .red
    } else if maxG.maximum >= maxR.maximum && maxG.maximum >= maxB.maximum {
      direction = .green
    } else {
      direction = .blue
    }
    two.r1 = one.r1
    two.g1 = one.g1
    two.b1 = one.b1
    switch direction {
    case .red:
      one.r1 = maxR.cutLocation
      two.r0 = one.r1
      two.g0 = one.g0
      two.b0 = one.b0
    case .green:
      one.g1 = maxG.cutLocation
      two.r0 = one.r0
      two.g0 = one.g1
      two.b0 = one.b0
    case .blue:
      one.b1 = maxB.cutLocation
      two.r0 = one.r0
      two.g0 = one.g0
      two.b0 = one.b1
    }
    one.vol = (one.r1 - one.r0) * (one.g1 - one.g0) * (one.b1 - one.b0)
    two.vol = (two.r1 - two.r0) * (two.g1 - two.g0) * (two.b1 - two.b0)
    return true
  }

  var cubes = [Box](repeating: Box(), count: maxColors)
  var volumeVariance = [Double](repeating: 0, count: maxColors)
  cubes[0].r1 = sideLength - 1
  cubes[0].g1 = sideLength - 1
  cubes[0].b1 = sideLength - 1
  var generatedColorCount = maxColors
  var next = 0
  var i = 1
  while i < maxColors {
    var one = cubes[next]
    var two = cubes[i]
    let didCut = cut(&one, &two)
    cubes[next] = one
    cubes[i] = two
    if didCut {
      volumeVariance[next] = cubes[next].vol > 1 ? variance(cubes[next]) : 0.0
      volumeVariance[i] = cubes[i].vol > 1 ? variance(cubes[i]) : 0.0
    } else {
      volumeVariance[next] = 0.0
      i -= 1
    }
    next = 0
    var temp = volumeVariance[0]
    var j = 1
    while j <= i {
      if volumeVariance[j] > temp {
        temp = volumeVariance[j]
        next = j
      }
      j += 1
    }
    if temp <= 0.0 {
      generatedColorCount = i + 1
      break
    }
    i += 1
  }

  var colors: [ARGB] = []
  for k in 0..<generatedColorCount {
    let cube = cubes[k]
    let weight = volume(cube, weights)
    if weight > 0 {
      let r = jsRoundInt(volume(cube, momentsR) / weight)
      let g = jsRoundInt(volume(cube, momentsG) / weight)
      let b = jsRoundInt(volume(cube, momentsB) / weight)
      colors.append(argbFromRgb(r, g, b))
    }
  }
  return colors
}

@inline(__always)
private func labDistance(_ from: Vec3, _ to: Vec3) -> Double {
  let dL = from.0 - to.0
  let dA = from.1 - to.1
  let dB = from.2 - to.2
  return dL * dL + dA * dA + dB * dB
}

/// `quantizeImage`: Wu's palette, every pixel tallied to its nearest representative in L*a*b*.
/// Ordered as the TypeScript `Map` is: representatives in Wu's order.
public func quantizeImage(_ pixels: [ARGB], maxColors: Int = 128) -> [(color: ARGB, population: Int)] {
  let representatives = quantizeWu(pixels, maxColors)
  if representatives.isEmpty { return [] }
  let repPoints = representatives.map(labFromArgb)
  var populations = [Int](repeating: 0, count: representatives.count)
  let counts = countByColor(pixels)
  for pixel in counts.colors {
    let point = labFromArgb(pixel)
    var best = 0
    var bestDistance = Double.infinity
    for (i, repPoint) in repPoints.enumerated() {
      let d = labDistance(point, repPoint)
      if d < bestDistance {
        bestDistance = d
        best = i
      }
    }
    populations[best] += counts.counts[pixel]!
  }
  var result: [(color: ARGB, population: Int)] = []
  var seen = Set<ARGB>()
  for (i, representative) in representatives.enumerated() where populations[i] > 0 {
    // A `Map.set` on a repeated key keeps the first position and the LAST value.
    if seen.contains(representative) {
      let at = result.firstIndex { $0.color == representative }!
      result[at].population = populations[i]
    } else {
      seen.insert(representative)
      result.append((representative, populations[i]))
    }
  }
  return result
}

/// `ScoreOptions`.
public struct ScoreOptions: Sendable, Hashable {
  public var desired: Int
  public var fallbackColorARGB: ARGB
  public var filter: Bool

  public init(desired: Int = 4, fallbackColorARGB: ARGB = 0xFF42_85F4, filter: Bool = true) {
    self.desired = desired
    self.fallbackColorARGB = fallbackColorARGB
    self.filter = filter
  }
}

/// `score`: rank quantized colours as theme seeds, best first.
public func score(_ colorsToPopulation: [(color: ARGB, population: Int)], _ options: ScoreOptions = ScoreOptions()) -> [ARGB] {
  let targetChroma = 48.0
  let weightProportion = 0.7
  let weightChromaAbove = 0.3
  let weightChromaBelow = 0.1
  let cutoffChroma = 5.0
  let cutoffExcitedProportion = 0.01

  var colorsHct: [Hct] = []
  var huePopulation = [Double](repeating: 0, count: 360)
  var populationSum = 0.0
  for (argb, population) in colorsToPopulation {
    let hct = Hct.fromInt(argb)
    colorsHct.append(hct)
    let hueIndex = Int(hct.hue.rounded(.down))
    huePopulation[hueIndex] += Double(population)
    populationSum += Double(population)
  }

  var hueExcitedProportions = [Double](repeating: 0, count: 360)
  for hue in 0..<360 {
    let proportion = huePopulation[hue] / populationSum
    for i in (hue - 14)..<(hue + 16) {
      hueExcitedProportions[sanitizeDegreesInt(i)] += proportion
    }
  }

  var scored: [(hct: Hct, score: Double, order: Int)] = []
  for hct in colorsHct {
    let hue = sanitizeDegreesInt(jsRoundInt(hct.hue))
    let proportion = hueExcitedProportions[hue]
    if options.filter && (hct.chroma < cutoffChroma || proportion <= cutoffExcitedProportion) {
      continue
    }
    let proportionScore = proportion * 100.0 * weightProportion
    let chromaWeight = hct.chroma < targetChroma ? weightChromaBelow : weightChromaAbove
    let chromaScore = (hct.chroma - targetChroma) * chromaWeight
    scored.append((hct, proportionScore + chromaScore, scored.count))
  }
  // `Array.prototype.sort` is stable: equal scores keep their order.
  scored.sort { a, b in a.score != b.score ? a.score > b.score : a.order < b.order }

  var chosenColors: [Hct] = []
  var differenceLimit = 90
  while differenceLimit >= 15 {
    chosenColors.removeAll()
    for entry in scored {
      let duplicateHue = chosenColors.contains {
        differenceDegrees(entry.hct.hue, $0.hue) < Double(differenceLimit)
      }
      if !duplicateHue { chosenColors.append(entry.hct) }
      if chosenColors.count >= options.desired { break }
    }
    if chosenColors.count >= options.desired { break }
    differenceLimit -= 1
  }

  var colors: [ARGB] = []
  if chosenColors.isEmpty { colors.append(options.fallbackColorARGB) }
  for chosen in chosenColors { colors.append(chosen.toInt()) }
  return colors
}

/// `seedsFromImagePixels`: ranked seed candidates (best first) from ARGB pixels.
public func seedsFromImagePixels(_ pixels: [ARGB], _ options: ScoreOptions = ScoreOptions()) -> [ARGB] {
  score(quantizeImage(pixels), options)
}

/// `seedsFromRgbBytes`: from raw decoded bytes, `channels` per pixel in R, G, B order (a fourth
/// channel is skipped, as are trailing bytes that make no whole pixel).
public func seedsFromRgbBytes(_ bytes: [UInt8], channels: Int = 3, _ options: ScoreOptions = ScoreOptions()) -> [ARGB] {
  precondition(channels == 3 || channels == 4)
  var pixels: [ARGB] = []
  pixels.reserveCapacity(bytes.count / channels)
  var offset = 0
  while offset + channels <= bytes.count {
    pixels.append(argbFromRgb(Int(bytes[offset]), Int(bytes[offset + 1]), Int(bytes[offset + 2])))
    offset += channels
  }
  return seedsFromImagePixels(pixels, options)
}

/// `seedHexFromImagePixels`: the single best seed, `#rrggbb`; nil when none can be extracted
/// (the TypeScript throws).
public func seedHexFromImagePixels(_ pixels: [ARGB]) -> String? {
  seedsFromImagePixels(pixels, ScoreOptions(desired: 1)).first.map(hexFromArgb)
}
