// Bloom's colour engine on the JVM (ADR 0003, step 4): the HCT core of src/theme/color-engine, ported once,
// line for line, and held byte-identical to the TypeScript by its golden (golden-color-engine.txt, written by
// scripts/generate-color-engine-golden.ts from the TypeScript engine, checked by ColorEngineConformance).
// StrictMath throughout: fdlibm, as V8's Math is, so every double matches the TypeScript's. No Android here.
// The TypeScript is a port of Material Color Utilities (Apache-2.0), as this is.
package so.oxy.bloom.color

// ---- math-utils.ts ---------------------------------------------------------------------------------------------

fun signum(n: Double): Double = if (n < 0) -1.0 else if (n == 0.0) 0.0 else 1.0

fun lerp(start: Double, stop: Double, amount: Double): Double = (1.0 - amount) * start + amount * stop

fun clampInt(min: Int, max: Int, input: Int): Int = if (input < min) min else if (input > max) max else input

fun clampDouble(min: Double, max: Double, input: Double): Double = if (input < min) min else if (input > max) max else input

fun sanitizeDegreesInt(degrees: Int): Int {
  val d = degrees % 360
  return if (d < 0) d + 360 else d
}

fun sanitizeDegreesDouble(degrees: Double): Double {
  val d = degrees % 360.0
  return if (d < 0) d + 360.0 else d
}

fun rotationDirection(from: Double, to: Double): Double = if (sanitizeDegreesDouble(to - from) <= 180.0) 1.0 else -1.0

fun differenceDegrees(a: Double, b: Double): Double = 180.0 - StrictMath.abs(StrictMath.abs(a - b) - 180.0)

fun matrixMultiply(row: DoubleArray, matrix: Array<DoubleArray>): DoubleArray {
  val a = row[0] * matrix[0][0] + row[1] * matrix[0][1] + row[2] * matrix[0][2]
  val b = row[0] * matrix[1][0] + row[1] * matrix[1][1] + row[2] * matrix[1][2]
  val c = row[0] * matrix[2][0] + row[1] * matrix[2][1] + row[2] * matrix[2][2]
  return doubleArrayOf(a, b, c)
}

/** JavaScript's `Math.round`: the nearest integer, ties toward +∞. */
internal fun jsRound(x: Double): Double = java.lang.Math.round(x).toDouble()

// ---- color-utils.ts --------------------------------------------------------------------------------------------

private val SRGB_TO_XYZ = arrayOf(
  doubleArrayOf(0.41233895, 0.35762064, 0.18051042),
  doubleArrayOf(0.2126, 0.7152, 0.0722),
  doubleArrayOf(0.01932141, 0.11916382, 0.95034478),
)

private val XYZ_TO_SRGB = arrayOf(
  doubleArrayOf(3.2413774792388685, -1.5376652402851851, -0.49885366846268053),
  doubleArrayOf(-0.9691452513005321, 1.8758853451067872, 0.04156585616912061),
  doubleArrayOf(0.05562093689691305, -0.20395524564742123, 1.0571799111220335),
)

private val WHITE_POINT_D65 = doubleArrayOf(95.047, 100.0, 108.883)

/** An opaque ARGB colour, as the TypeScript's unsigned 32-bit number (kept in a Long). */
fun argbFromRgb(red: Int, green: Int, blue: Int): Long =
  ((255L shl 24) or ((red and 255).toLong() shl 16) or ((green and 255).toLong() shl 8) or (blue and 255).toLong())

fun argbFromLinrgb(linrgb: DoubleArray): Long =
  argbFromRgb(delinearized(linrgb[0]), delinearized(linrgb[1]), delinearized(linrgb[2]))

fun alphaFromArgb(argb: Long): Int = ((argb shr 24) and 255).toInt()

fun redFromArgb(argb: Long): Int = ((argb shr 16) and 255).toInt()

fun greenFromArgb(argb: Long): Int = ((argb shr 8) and 255).toInt()

fun blueFromArgb(argb: Long): Int = (argb and 255).toInt()

fun isOpaque(argb: Long): Boolean = alphaFromArgb(argb) >= 255

fun argbFromHex(hex: String): Long {
  val h = hex.replace("#", "")
  val v = if (h.length == 6) "ff$h" else h
  return v.toLong(16) and 0xffffffffL
}

fun hexFromArgb(argb: Long): String =
  "#" + listOf(redFromArgb(argb), greenFromArgb(argb), blueFromArgb(argb)).joinToString("") { it.toString(16).padStart(2, '0') }

fun argbFromXyz(x: Double, y: Double, z: Double): Long {
  val m = XYZ_TO_SRGB
  val linearR = m[0][0] * x + m[0][1] * y + m[0][2] * z
  val linearG = m[1][0] * x + m[1][1] * y + m[1][2] * z
  val linearB = m[2][0] * x + m[2][1] * y + m[2][2] * z
  return argbFromRgb(delinearized(linearR), delinearized(linearG), delinearized(linearB))
}

fun xyzFromArgb(argb: Long): DoubleArray {
  val r = linearized(redFromArgb(argb))
  val g = linearized(greenFromArgb(argb))
  val b = linearized(blueFromArgb(argb))
  return matrixMultiply(doubleArrayOf(r, g, b), SRGB_TO_XYZ)
}

fun argbFromLab(l: Double, a: Double, b: Double): Long {
  val wp = WHITE_POINT_D65
  val fy = (l + 16.0) / 116.0
  val fx = a / 500.0 + fy
  val fz = fy - b / 200.0
  return argbFromXyz(labInvf(fx) * wp[0], labInvf(fy) * wp[1], labInvf(fz) * wp[2])
}

fun labFromArgb(argb: Long): DoubleArray {
  val linearR = linearized(redFromArgb(argb))
  val linearG = linearized(greenFromArgb(argb))
  val linearB = linearized(blueFromArgb(argb))
  val m = SRGB_TO_XYZ
  val x = m[0][0] * linearR + m[0][1] * linearG + m[0][2] * linearB
  val y = m[1][0] * linearR + m[1][1] * linearG + m[1][2] * linearB
  val z = m[2][0] * linearR + m[2][1] * linearG + m[2][2] * linearB
  val wp = WHITE_POINT_D65
  val fx = labF(x / wp[0])
  val fy = labF(y / wp[1])
  val fz = labF(z / wp[2])
  return doubleArrayOf(116.0 * fy - 16, 500.0 * (fx - fy), 200.0 * (fy - fz))
}

fun argbFromLstar(lstar: Double): Long {
  val component = delinearized(yFromLstar(lstar))
  return argbFromRgb(component, component, component)
}

fun lstarFromArgb(argb: Long): Double = 116.0 * labF(xyzFromArgb(argb)[1] / 100.0) - 16.0

fun yFromLstar(lstar: Double): Double = 100.0 * labInvf((lstar + 16.0) / 116.0)

fun lstarFromY(y: Double): Double = labF(y / 100.0) * 116.0 - 16.0

private fun solveLinearized(rgbComponent: Int): Double {
  val normalized = rgbComponent / 255.0
  return if (normalized <= 0.040449936) {
    (normalized / 12.92) * 100.0
  } else {
    StrictMath.pow((normalized + 0.055) / 1.055, 2.4) * 100.0
  }
}

private val LINEARIZED = DoubleArray(256) { solveLinearized(it) }

fun linearized(rgbComponent: Int): Double = if (rgbComponent in 0..255) LINEARIZED[rgbComponent] else solveLinearized(rgbComponent)

fun delinearized(rgbComponent: Double): Int {
  val normalized = rgbComponent / 100.0
  val delin = if (normalized <= 0.0031308) normalized * 12.92 else 1.055 * StrictMath.pow(normalized, 1.0 / 2.4) - 0.055
  return clampInt(0, 255, jsRound(delin * 255.0).toInt())
}

fun whitePointD65(): DoubleArray = WHITE_POINT_D65

private fun labF(t: Double): Double {
  val e = 216.0 / 24389.0
  val kappa = 24389.0 / 27.0
  return if (t > e) StrictMath.pow(t, 1.0 / 3.0) else (kappa * t + 16) / 116
}

private fun labInvf(ft: Double): Double {
  val e = 216.0 / 24389.0
  val kappa = 24389.0 / 27.0
  val ft3 = ft * ft * ft
  return if (ft3 > e) ft3 else (116 * ft - 16) / kappa
}

// ---- viewing-conditions.ts -------------------------------------------------------------------------------------

class ViewingConditions private constructor(
  val n: Double,
  val aw: Double,
  val nbb: Double,
  val ncb: Double,
  val c: Double,
  val nc: Double,
  val rgbD: DoubleArray,
  val fl: Double,
  val fLRoot: Double,
  val z: Double,
) {
  val chromaFactor: Double = StrictMath.pow(1.64 - StrictMath.pow(0.29, n), 0.73)

  companion object {
    val DEFAULT: ViewingConditions by lazy { make() }

    fun make(
      whitePoint: DoubleArray = whitePointD65(),
      adaptingLuminance: Double = ((200.0 / StrictMath.PI) * yFromLstar(50.0)) / 100.0,
      backgroundLstar: Double = 50.0,
      surround: Double = 2.0,
      discountingIlluminant: Boolean = false,
    ): ViewingConditions {
      val xyz = whitePoint
      val rW = xyz[0] * 0.401288 + xyz[1] * 0.650173 + xyz[2] * -0.051461
      val gW = xyz[0] * -0.250268 + xyz[1] * 1.204414 + xyz[2] * 0.045854
      val bW = xyz[0] * -0.002079 + xyz[1] * 0.048952 + xyz[2] * 0.953127
      val f = 0.8 + surround / 10.0
      val c = if (f >= 0.9) lerp(0.59, 0.69, (f - 0.9) * 10.0) else lerp(0.525, 0.59, (f - 0.8) * 10.0)
      var d = if (discountingIlluminant) 1.0 else f * (1.0 - (1.0 / 3.6) * StrictMath.exp((-adaptingLuminance - 42.0) / 92.0))
      d = if (d > 1.0) 1.0 else if (d < 0.0) 0.0 else d
      val nc = f
      val rgbD = doubleArrayOf(d * (100.0 / rW) + 1.0 - d, d * (100.0 / gW) + 1.0 - d, d * (100.0 / bW) + 1.0 - d)
      val k = 1.0 / (5.0 * adaptingLuminance + 1.0)
      val k4 = k * k * k * k
      val k4F = 1.0 - k4
      val fl = k4 * adaptingLuminance + 0.1 * k4F * k4F * StrictMath.cbrt(5.0 * adaptingLuminance)
      val n = yFromLstar(backgroundLstar) / whitePoint[1]
      val z = 1.48 + StrictMath.sqrt(n)
      val nbb = 0.725 / StrictMath.pow(n, 0.2)
      val ncb = nbb
      val rgbAFactors = doubleArrayOf(
        StrictMath.pow((fl * rgbD[0] * rW) / 100.0, 0.42),
        StrictMath.pow((fl * rgbD[1] * gW) / 100.0, 0.42),
        StrictMath.pow((fl * rgbD[2] * bW) / 100.0, 0.42),
      )
      val rgbA = DoubleArray(3) { (400.0 * rgbAFactors[it]) / (rgbAFactors[it] + 27.13) }
      val aw = (2.0 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2]) * nbb
      return ViewingConditions(n, aw, nbb, ncb, c, nc, rgbD, fl, StrictMath.pow(fl, 0.25), z)
    }
  }
}

// ---- cam16.ts --------------------------------------------------------------------------------------------------

class Cam16(
  val hue: Double,
  val chroma: Double,
  val j: Double,
  val q: Double,
  val m: Double,
  val s: Double,
  val jstar: Double,
  val astar: Double,
  val bstar: Double,
) {
  fun distance(other: Cam16): Double {
    val dJ = jstar - other.jstar
    val dA = astar - other.astar
    val dB = bstar - other.bstar
    return 1.41 * StrictMath.pow(StrictMath.sqrt(dJ * dJ + dA * dA + dB * dB), 0.63)
  }

  fun toInt(): Long = viewed(ViewingConditions.DEFAULT)

  fun viewed(vc: ViewingConditions): Long {
    val xyz = xyzInViewingConditions(vc)
    return argbFromXyz(xyz[0], xyz[1], xyz[2])
  }

  fun xyzInViewingConditions(vc: ViewingConditions): DoubleArray {
    val alpha = if (chroma == 0.0 || j == 0.0) 0.0 else chroma / StrictMath.sqrt(j / 100.0)
    val t = StrictMath.pow(alpha / vc.chromaFactor, 1.0 / 0.9)
    val hRad = (hue * StrictMath.PI) / 180.0
    val eHue = 0.25 * (StrictMath.cos(hRad + 2.0) + 3.8)
    val ac = vc.aw * StrictMath.pow(j / 100.0, 1.0 / vc.c / vc.z)
    val p1 = eHue * (50000.0 / 13.0) * vc.nc * vc.ncb
    val p2 = ac / vc.nbb
    val hSin = StrictMath.sin(hRad)
    val hCos = StrictMath.cos(hRad)
    val gamma = (23.0 * (p2 + 0.305) * t) / (23.0 * p1 + 11.0 * t * hCos + 108.0 * t * hSin)
    val a = gamma * hCos
    val b = gamma * hSin
    val rA = (460.0 * p2 + 451.0 * a + 288.0 * b) / 1403.0
    val gA = (460.0 * p2 - 891.0 * a - 261.0 * b) / 1403.0
    val bA = (460.0 * p2 - 220.0 * a - 6300.0 * b) / 1403.0
    val rCBase = StrictMath.max(0.0, (27.13 * StrictMath.abs(rA)) / (400.0 - StrictMath.abs(rA)))
    val rC = signum(rA) * (100.0 / vc.fl) * StrictMath.pow(rCBase, 1.0 / 0.42)
    val gCBase = StrictMath.max(0.0, (27.13 * StrictMath.abs(gA)) / (400.0 - StrictMath.abs(gA)))
    val gC = signum(gA) * (100.0 / vc.fl) * StrictMath.pow(gCBase, 1.0 / 0.42)
    val bCBase = StrictMath.max(0.0, (27.13 * StrictMath.abs(bA)) / (400.0 - StrictMath.abs(bA)))
    val bC = signum(bA) * (100.0 / vc.fl) * StrictMath.pow(bCBase, 1.0 / 0.42)
    val rF = rC / vc.rgbD[0]
    val gF = gC / vc.rgbD[1]
    val bF = bC / vc.rgbD[2]
    val x = 1.86206786 * rF - 1.01125463 * gF + 0.14918677 * bF
    val y = 0.38752654 * rF + 0.62144744 * gF - 0.00897398 * bF
    val z = -0.0158415 * rF - 0.03412294 * gF + 1.04996444 * bF
    return doubleArrayOf(x, y, z)
  }

  companion object {
    fun fromInt(argb: Long): Cam16 = fromIntInViewingConditions(argb, ViewingConditions.DEFAULT)

    fun fromIntInViewingConditions(argb: Long, vc: ViewingConditions): Cam16 {
      val redL = linearized(redFromArgb(argb))
      val greenL = linearized(greenFromArgb(argb))
      val blueL = linearized(blueFromArgb(argb))
      val x = 0.41233895 * redL + 0.35762064 * greenL + 0.18051042 * blueL
      val y = 0.2126 * redL + 0.7152 * greenL + 0.0722 * blueL
      val z = 0.01932141 * redL + 0.11916382 * greenL + 0.95034478 * blueL
      return fromXyzInViewingConditions(x, y, z, vc)
    }

    fun fromXyzInViewingConditions(x: Double, y: Double, z: Double, vc: ViewingConditions): Cam16 {
      val rC = 0.401288 * x + 0.650173 * y - 0.051461 * z
      val gC = -0.250268 * x + 1.204414 * y + 0.045854 * z
      val bC = -0.002079 * x + 0.048952 * y + 0.953127 * z
      val rD = vc.rgbD[0] * rC
      val gD = vc.rgbD[1] * gC
      val bD = vc.rgbD[2] * bC
      val rAF = StrictMath.pow((vc.fl * StrictMath.abs(rD)) / 100.0, 0.42)
      val gAF = StrictMath.pow((vc.fl * StrictMath.abs(gD)) / 100.0, 0.42)
      val bAF = StrictMath.pow((vc.fl * StrictMath.abs(bD)) / 100.0, 0.42)
      val rA = (signum(rD) * 400.0 * rAF) / (rAF + 27.13)
      val gA = (signum(gD) * 400.0 * gAF) / (gAF + 27.13)
      val bA = (signum(bD) * 400.0 * bAF) / (bAF + 27.13)
      val a = (11.0 * rA + -12.0 * gA + bA) / 11.0
      val b = (rA + gA - 2.0 * bA) / 9.0
      val u = (20.0 * rA + 20.0 * gA + 21.0 * bA) / 20.0
      val p2 = (40.0 * rA + 20.0 * gA + bA) / 20.0
      val atan2 = StrictMath.atan2(b, a)
      val atanDegrees = (atan2 * 180.0) / StrictMath.PI
      val hue = if (atanDegrees < 0) atanDegrees + 360.0 else if (atanDegrees >= 360) atanDegrees - 360 else atanDegrees
      val hueRadians = (hue * StrictMath.PI) / 180.0
      val ac = p2 * vc.nbb
      val jj = 100.0 * StrictMath.pow(ac / vc.aw, vc.c * vc.z)
      val qq = (4.0 / vc.c) * StrictMath.sqrt(jj / 100.0) * (vc.aw + 4.0) * vc.fLRoot
      val huePrime = if (hue < 20.14) hue + 360 else hue
      val eHue = (1.0 / 4.0) * (StrictMath.cos((huePrime * StrictMath.PI) / 180.0 + 2.0) + 3.8)
      val p1 = (50000.0 / 13.0) * eHue * vc.nc * vc.ncb
      val t = (p1 * StrictMath.sqrt(a * a + b * b)) / (u + 0.305)
      val alpha = StrictMath.pow(t, 0.9) * vc.chromaFactor
      val cc = alpha * StrictMath.sqrt(jj / 100.0)
      val mm = cc * vc.fLRoot
      val s = 50.0 * StrictMath.sqrt((alpha * vc.c) / (vc.aw + 4.0))
      val jstar = ((1.0 + 100.0 * 0.007) * jj) / (1.0 + 0.007 * jj)
      val mstar = StrictMath.log(1.0 + 0.0228 * mm) / 0.0228
      val astar = mstar * StrictMath.cos(hueRadians)
      val bstar = mstar * StrictMath.sin(hueRadians)
      return Cam16(hue, cc, jj, qq, mm, s, jstar, astar, bstar)
    }

    fun fromJch(j: Double, c: Double, h: Double): Cam16 = fromJchInViewingConditions(j, c, h, ViewingConditions.DEFAULT)

    fun fromJchInViewingConditions(j: Double, c: Double, h: Double, vc: ViewingConditions): Cam16 {
      val q = (4.0 / vc.c) * StrictMath.sqrt(j / 100.0) * (vc.aw + 4.0) * vc.fLRoot
      val m = c * vc.fLRoot
      val alpha = c / StrictMath.sqrt(j / 100.0)
      val s = 50.0 * StrictMath.sqrt((alpha * vc.c) / (vc.aw + 4.0))
      val hueRadians = (h * StrictMath.PI) / 180.0
      val jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j)
      val mstar = (1.0 / 0.0228) * StrictMath.log(1.0 + 0.0228 * m)
      val astar = mstar * StrictMath.cos(hueRadians)
      val bstar = mstar * StrictMath.sin(hueRadians)
      return Cam16(h, c, j, q, m, s, jstar, astar, bstar)
    }

    fun fromUcs(jstar: Double, astar: Double, bstar: Double): Cam16 =
      fromUcsInViewingConditions(jstar, astar, bstar, ViewingConditions.DEFAULT)

    fun fromUcsInViewingConditions(jstar: Double, astar: Double, bstar: Double, vc: ViewingConditions): Cam16 {
      val m = StrictMath.sqrt(astar * astar + bstar * bstar)
      val mm = (StrictMath.exp(m * 0.0228) - 1.0) / 0.0228
      val c = mm / vc.fLRoot
      var h = StrictMath.atan2(bstar, astar) * (180.0 / StrictMath.PI)
      if (h < 0.0) h += 360.0
      val j = jstar / (1 - (jstar - 100) * 0.007)
      return fromJchInViewingConditions(j, c, h, vc)
    }
  }
}

// ---- hct-solver.ts ---------------------------------------------------------------------------------------------

object HctSolver {
  private val SCALED_DISCOUNT_FROM_LINRGB = arrayOf(
    doubleArrayOf(0.001200833568784504, 0.002389694492170889, 0.0002795742885861124),
    doubleArrayOf(0.0005891086651375999, 0.0029785502573438758, 0.0003270666104008398),
    doubleArrayOf(0.00010146692491640572, 0.0005364214359186694, 0.0032979401770712076),
  )
  private val LINRGB_FROM_SCALED_DISCOUNT = arrayOf(
    doubleArrayOf(1373.2198709594231, -1100.4251190754821, -7.278681089101213),
    doubleArrayOf(-271.815969077903, 559.6580465940733, -32.46047482791194),
    doubleArrayOf(1.9622899599665666, -57.173814538844006, 308.7233197812385),
  )
  private val Y_FROM_LINRGB = doubleArrayOf(0.2126, 0.7152, 0.0722)

  /** Linear RGB's critical planes (hct-solver.ts's list, verbatim): where an sRGB channel's 8-bit value changes. */
  private val CRITICAL_PLANES = doubleArrayOf(
    0.015176349177441876, 0.045529047532325624, 0.07588174588720938, 0.10623444424209313,
    0.13658714259697685, 0.16693984095186062, 0.19729253930674434, 0.2276452376616281,
    0.2579979360165119, 0.28835063437139563, 0.3188300904430532, 0.350925934958123,
    0.3848314933096426, 0.42057480301049466, 0.458183274052838, 0.4976837250274023,
    0.5391024159806381, 0.5824650784040898, 0.6277969426914107, 0.6751227633498623,
    0.7244668422128921, 0.775853049866786, 0.829304845476233, 0.8848452951698498,
    0.942497089126609, 1.0022825574869039, 1.0642236851973577, 1.1283421258858297,
    1.1946592148522128, 1.2631959812511864, 1.3339731595349034, 1.407011200216447,
    1.4823302800086415, 1.5599503113873272, 1.6398909516233677, 1.7221716113234105,
    1.8068114625156377, 1.8938294463134073, 1.9832442801866852, 2.075074464868551,
    2.1693382909216234, 2.2660538449872063, 2.36523901573795, 2.4669114995532007,
    2.5710888059345764, 2.6777882626779785, 2.7870270208169257, 2.898822059350997,
    3.0131901897720907, 3.1301480604002863, 3.2497121605402226, 3.3718988244681087,
    3.4967242352587946, 3.624204428461639, 3.754355295633311, 3.887192587735158,
    4.022731918402185, 4.160988767090289, 4.301978482107941, 4.445716283538092,
    4.592217266055746, 4.741496401646282, 4.893568542229298, 5.048448422192488,
    5.20615066083972, 5.3666897647573375, 5.5300801301023865, 5.696336044816294,
    5.865471690767354, 6.037501145825082, 6.212438385869475, 6.390297286737924,
    6.571091626112461, 6.7548350853498045, 6.941541251256611, 7.131223617812143,
    7.323895587840543, 7.5195704746346665, 7.7182615035334345, 7.919981813454504,
    8.124744458384042, 8.332562408825165, 8.543448553206703, 8.757415699253682,
    8.974476575321063, 9.194643831691977, 9.417930041841839, 9.644347703669503,
    9.873909240696694, 10.106627003236781, 10.342513269534024, 10.58158024687427,
    10.8238400726681, 11.069304815507364, 11.317986476196008, 11.569896988756009,
    11.825048221409341, 12.083451977536606, 12.345119996613247, 12.610063955123938,
    12.878295467455942, 13.149826086772048, 13.42466730586372, 13.702830557985108,
    13.984327217668513, 14.269168601521828, 14.55736596900856, 14.848930523210871,
    15.143873411576273, 15.44220572664832, 15.743938506781891, 16.04908273684337,
    16.35764934889634, 16.66964922287304, 16.985093187232053, 17.30399201960269,
    17.62635644741625, 17.95219714852476, 18.281524751807332, 18.614349837764564,
    18.95068293910138, 19.290534541298456, 19.633915083172692, 19.98083495742689,
    20.331304511189067, 20.685334046541502, 21.042933821039977, 21.404114048223256,
    21.76888489811322, 22.137256497705877, 22.50923893145328, 22.884842241736916,
    23.264076429332462, 23.6469514538663, 24.033477234264016, 24.42366364919083,
    24.817520537484558, 25.21505769858089, 25.61628489293138, 26.021211842414342,
    26.429848230738664, 26.842203703840827, 27.258287870275353, 27.678110301598522,
    28.10168053274597, 28.529008062403893, 28.96010235337422, 29.39497283293396,
    29.83362889318845, 30.276079891419332, 30.722335150426627, 31.172403958865512,
    31.62629557157785, 32.08401920991837, 32.54558406207592, 33.010999283389665,
    33.4802739966603, 33.953417292456834, 34.430438229418264, 34.911345834551085,
    35.39614910352207, 35.88485700094671, 36.37747846067349, 36.87402238606382,
    37.37449765026789, 37.87891309649659, 38.38727753828926, 38.89959975977785,
    39.41588851594697, 39.93615253289054, 40.460400508064545, 40.98864111053629,
    41.520882981230194, 42.05713473317016, 42.597404951718396, 43.141702194811224,
    43.6900349931913, 44.24241185063697, 44.798841244188324, 45.35933162437017,
    45.92389141541209, 46.49252901546552, 47.065252796817916, 47.64207110610409,
    48.22299226451468, 48.808024568002054, 49.3971762874833, 49.9904556690408,
    50.587870934119984, 51.189430279724725, 51.79514187861014, 52.40501387947288,
    53.0190544071392, 53.637271562750364, 54.259673423945976, 54.88626804504493,
    55.517063457223934, 56.15206766869424, 56.79128866487574, 57.43473440856916,
    58.08241284012621, 58.734331877617365, 59.39049941699807, 60.05092333227251,
    60.715611475655585, 61.38457167773311, 62.057811747619894, 62.7353394731159,
    63.417162620860914, 64.10328893648692, 64.79372614476921, 65.48848194977529,
    66.18756403501224, 66.89098006357258, 67.59873767827808, 68.31084450182222,
    69.02730813691093, 69.74813616640164, 70.47333615344107, 71.20291564160104,
    71.93688215501312, 72.67524319850172, 73.41800625771542, 74.16517879925733,
    74.9167682708136, 75.67278210128072, 76.43322770089146, 77.1981124613393,
    77.96744375590167, 78.74122893956174, 79.51947534912904, 80.30219030335869,
    81.08938110306934, 81.88105503125999, 82.67721935322541, 83.4778813166706,
    84.28304815182372, 85.09272707154808, 85.90692527145302, 86.72564993000343,
    87.54890820862819, 88.3767072518277, 89.2090541872801, 90.04595612594655,
    90.88742016217518, 91.73345337380438, 92.58406282226491, 93.43925555268066,
    94.29903859396902, 95.16341895893969, 96.03240364439274, 96.9059996312159,
    97.78421388448044, 98.6670533535366, 99.55452497210776,
  )

  private fun sanitizeRadians(angle: Double): Double = (angle + StrictMath.PI * 8) % (StrictMath.PI * 2)

  private fun trueDelinearized(rgbComponent: Double): Double {
    val normalized = rgbComponent / 100.0
    val delin = if (normalized <= 0.0031308) normalized * 12.92 else 1.055 * StrictMath.pow(normalized, 1.0 / 2.4) - 0.055
    return delin * 255.0
  }

  private fun chromaticAdaptation(component: Double): Double {
    val af = StrictMath.pow(StrictMath.abs(component), 0.42)
    return (signum(component) * 400.0 * af) / (af + 27.13)
  }

  private fun hueOf(linrgb: DoubleArray): Double {
    val m = SCALED_DISCOUNT_FROM_LINRGB
    val rA = chromaticAdaptation(linrgb[0] * m[0][0] + linrgb[1] * m[0][1] + linrgb[2] * m[0][2])
    val gA = chromaticAdaptation(linrgb[0] * m[1][0] + linrgb[1] * m[1][1] + linrgb[2] * m[1][2])
    val bA = chromaticAdaptation(linrgb[0] * m[2][0] + linrgb[1] * m[2][1] + linrgb[2] * m[2][2])
    val a = (11.0 * rA + -12.0 * gA + bA) / 11.0
    val b = (rA + gA - 2.0 * bA) / 9.0
    return StrictMath.atan2(b, a)
  }

  private fun areInCyclicOrder(a: Double, b: Double, c: Double): Boolean =
    sanitizeRadians(b - a) < sanitizeRadians(c - a)

  private fun intercept(source: Double, mid: Double, target: Double): Double = (mid - source) / (target - source)

  private fun lerpPoint(source: DoubleArray, t: Double, target: DoubleArray): DoubleArray = doubleArrayOf(
    source[0] + (target[0] - source[0]) * t,
    source[1] + (target[1] - source[1]) * t,
    source[2] + (target[2] - source[2]) * t,
  )

  private fun setCoordinate(source: DoubleArray, coordinate: Double, target: DoubleArray, axis: Int): DoubleArray =
    lerpPoint(source, intercept(source[axis], coordinate, target[axis]), target)

  private fun isBounded(x: Double): Boolean = 0.0 <= x && x <= 100.0

  private val NONE = doubleArrayOf(-1.0, -1.0, -1.0)

  private fun nthVertex(y: Double, n: Int): DoubleArray {
    val kR = Y_FROM_LINRGB[0]
    val kG = Y_FROM_LINRGB[1]
    val kB = Y_FROM_LINRGB[2]
    val coordA = if (n % 4 <= 1) 0.0 else 100.0
    val coordB = if (n % 2 == 0) 0.0 else 100.0
    return if (n < 4) {
      val g = coordA
      val b = coordB
      val r = (y - g * kG - b * kB) / kR
      if (isBounded(r)) doubleArrayOf(r, g, b) else NONE
    } else if (n < 8) {
      val b = coordA
      val r = coordB
      val g = (y - r * kR - b * kB) / kG
      if (isBounded(g)) doubleArrayOf(r, g, b) else NONE
    } else {
      val r = coordA
      val g = coordB
      val b = (y - r * kR - g * kG) / kB
      if (isBounded(b)) doubleArrayOf(r, g, b) else NONE
    }
  }

  private fun bisectToSegment(y: Double, targetHue: Double): Array<DoubleArray> {
    var left = NONE
    var right = left
    var leftHue = 0.0
    var rightHue = 0.0
    var initialized = false
    var uncut = true
    for (n in 0 until 12) {
      val mid = nthVertex(y, n)
      if (mid[0] < 0) continue
      val midHue = hueOf(mid)
      if (!initialized) {
        left = mid
        right = mid
        leftHue = midHue
        rightHue = midHue
        initialized = true
        continue
      }
      if (uncut || areInCyclicOrder(leftHue, midHue, rightHue)) {
        uncut = false
        if (areInCyclicOrder(leftHue, targetHue, midHue)) {
          right = mid
          rightHue = midHue
        } else {
          left = mid
          leftHue = midHue
        }
      }
    }
    return arrayOf(left, right)
  }

  private fun midpoint(a: DoubleArray, b: DoubleArray): DoubleArray =
    doubleArrayOf((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)

  private fun criticalPlaneBelow(x: Double): Int = StrictMath.floor(x - 0.5).toInt()

  private fun criticalPlaneAbove(x: Double): Int = StrictMath.ceil(x - 0.5).toInt()

  private fun bisectToLimit(y: Double, targetHue: Double): DoubleArray {
    val segment = bisectToSegment(y, targetHue)
    var left = segment[0]
    var leftHue = hueOf(left)
    var right = segment[1]
    for (axis in 0 until 3) {
      if (left[axis] != right[axis]) {
        var lPlane: Int
        var rPlane: Int
        if (left[axis] < right[axis]) {
          lPlane = criticalPlaneBelow(trueDelinearized(left[axis]))
          rPlane = criticalPlaneAbove(trueDelinearized(right[axis]))
        } else {
          lPlane = criticalPlaneAbove(trueDelinearized(left[axis]))
          rPlane = criticalPlaneBelow(trueDelinearized(right[axis]))
        }
        for (i in 0 until 8) {
          if (StrictMath.abs(rPlane - lPlane) <= 1) break
          val mPlane = StrictMath.floor((lPlane + rPlane) / 2.0).toInt()
          val mid = setCoordinate(left, CRITICAL_PLANES[mPlane], right, axis)
          val midHue = hueOf(mid)
          if (areInCyclicOrder(leftHue, targetHue, midHue)) {
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

  private fun inverseChromaticAdaptation(adapted: Double): Double {
    val adaptedAbs = StrictMath.abs(adapted)
    val base = StrictMath.max(0.0, (27.13 * adaptedAbs) / (400.0 - adaptedAbs))
    return signum(adapted) * StrictMath.pow(base, 1.0 / 0.42)
  }

  private fun findResultByJ(hueRadians: Double, chroma: Double, y: Double): Long {
    var j = StrictMath.sqrt(y) * 11.0
    val vc = ViewingConditions.DEFAULT
    val tInnerCoeff = 1 / vc.chromaFactor
    val eHue = 0.25 * (StrictMath.cos(hueRadians + 2.0) + 3.8)
    val p1 = eHue * (50000.0 / 13.0) * vc.nc * vc.ncb
    val hSin = StrictMath.sin(hueRadians)
    val hCos = StrictMath.cos(hueRadians)
    for (iterationRound in 0 until 5) {
      val jNormalized = j / 100.0
      val alpha = if (chroma == 0.0 || j == 0.0) 0.0 else chroma / StrictMath.sqrt(jNormalized)
      val t = StrictMath.pow(alpha * tInnerCoeff, 1.0 / 0.9)
      val ac = vc.aw * StrictMath.pow(jNormalized, 1.0 / vc.c / vc.z)
      val p2 = ac / vc.nbb
      val gamma = (23.0 * (p2 + 0.305) * t) / (23.0 * p1 + 11 * t * hCos + 108.0 * t * hSin)
      val a = gamma * hCos
      val b = gamma * hSin
      val rA = (460.0 * p2 + 451.0 * a + 288.0 * b) / 1403.0
      val gA = (460.0 * p2 - 891.0 * a - 261.0 * b) / 1403.0
      val bA = (460.0 * p2 - 220.0 * a - 6300.0 * b) / 1403.0
      val linrgb = matrixMultiply(
        doubleArrayOf(inverseChromaticAdaptation(rA), inverseChromaticAdaptation(gA), inverseChromaticAdaptation(bA)),
        LINRGB_FROM_SCALED_DISCOUNT,
      )
      if (linrgb[0] < 0 || linrgb[1] < 0 || linrgb[2] < 0) return 0
      val fnj = Y_FROM_LINRGB[0] * linrgb[0] + Y_FROM_LINRGB[1] * linrgb[1] + Y_FROM_LINRGB[2] * linrgb[2]
      if (fnj <= 0) return 0
      if (iterationRound == 4 || StrictMath.abs(fnj - y) < 0.002) {
        if (linrgb[0] > 100.01 || linrgb[1] > 100.01 || linrgb[2] > 100.01) return 0
        return argbFromLinrgb(linrgb)
      }
      j = j - ((fnj - y) * j) / (2 * fnj)
    }
    return 0
  }

  /** The colour with this hue, chroma (or the most it can have) and tone, as ARGB. */
  fun solveToInt(hueDegrees: Double, chroma: Double, lstar: Double): Long {
    if (chroma < 0.0001 || lstar < 0.0001 || lstar > 99.9999) return argbFromLstar(lstar)
    val hue = sanitizeDegreesDouble(hueDegrees)
    val hueRadians = (hue / 180) * StrictMath.PI
    val y = yFromLstar(lstar)
    val exact = findResultByJ(hueRadians, chroma, y)
    if (exact != 0L) return exact
    return argbFromLinrgb(bisectToLimit(y, hueRadians))
  }
}

// ---- hct.ts ----------------------------------------------------------------------------------------------------

class Hct private constructor(argb: Long) {
  private var argb: Long = 0
  var hue: Double = 0.0
    private set
  var chroma: Double = 0.0
    private set
  var tone: Double = 0.0
    private set

  init {
    setInternalState(argb)
  }

  fun toInt(): Long = argb

  fun withHue(newHue: Double): Hct = Hct(HctSolver.solveToInt(newHue, chroma, tone))

  fun withChroma(newChroma: Double): Hct = Hct(HctSolver.solveToInt(hue, newChroma, tone))

  fun withTone(newTone: Double): Hct = Hct(HctSolver.solveToInt(hue, chroma, newTone))

  private fun setInternalState(argb: Long) {
    val cam = Cam16.fromInt(argb)
    hue = cam.hue
    chroma = cam.chroma
    tone = lstarFromArgb(argb)
    this.argb = argb
  }

  companion object {
    fun from(hue: Double, chroma: Double, tone: Double): Hct = Hct(HctSolver.solveToInt(hue, chroma, tone))

    fun fromInt(argb: Long): Hct = Hct(argb)
  }
}

// ---- tonal-palette.ts ------------------------------------------------------------------------------------------

class TonalPalette private constructor(val hue: Double, val chroma: Double, private var key: Hct?) {
  private val cache = HashMap<Double, Long>()

  val keyColor: Hct
    get() = key ?: KeyColor(hue, chroma).create().also { key = it }

  fun tone(tone: Double): Long = cache.getOrPut(tone) { HctSolver.solveToInt(hue, chroma, tone) }

  fun getHct(tone: Double): Hct = Hct.fromInt(tone(tone))

  companion object {
    fun fromInt(argb: Long): TonalPalette = fromHct(Hct.fromInt(argb))

    fun fromHct(hct: Hct): TonalPalette = TonalPalette(hct.hue, hct.chroma, hct)

    fun fromHueAndChroma(hue: Double, chroma: Double): TonalPalette = TonalPalette(hue, chroma, null)
  }
}

private class KeyColor(private val hue: Double, private val requestedChroma: Double) {
  private val chromaCache = HashMap<Int, Double>()
  private val maxChromaValue = 200.0

  fun create(): Hct {
    val pivotTone = 50
    val toneStepSize = 1
    val epsilon = 0.01
    var lowerTone = 0
    var upperTone = 100
    while (lowerTone < upperTone) {
      val midTone = (lowerTone + upperTone) / 2
      val isAscending = maxChroma(midTone) < maxChroma(midTone + toneStepSize)
      val sufficientChroma = maxChroma(midTone) >= requestedChroma - epsilon
      if (sufficientChroma) {
        if (StrictMath.abs(lowerTone - pivotTone) < StrictMath.abs(upperTone - pivotTone)) {
          upperTone = midTone
        } else {
          if (lowerTone == midTone) return Hct.from(hue, requestedChroma, lowerTone.toDouble())
          lowerTone = midTone
        }
      } else if (isAscending) {
        lowerTone = midTone + toneStepSize
      } else {
        upperTone = midTone
      }
    }
    return Hct.from(hue, requestedChroma, lowerTone.toDouble())
  }

  private fun maxChroma(tone: Int): Double = chromaCache.getOrPut(tone) { Hct.from(hue, maxChromaValue, tone.toDouble()).chroma }
}
