// The standard library's math externs (stdlib/Bloom/Math.bloom's `extern module`) on the JVM, under
// their Bloom names, giving V8's `Math` doubles: StrictMath (fdlibm 5.3, the same bits on every JVM
// and Android device) where V8 runs the same algorithm, and a port of V8's own where it does not
// (`exp(1)`, `cosh`, `tanh`, `cbrt`, `log2` from FreeBSD's msun, `hypot`'s Kahan sum, and the inverse
// hyperbolic functions, which the JVM lacks). Held to node's `Math` over 20000 random inputs each.
// `pow` (and `exp2`, which is `2 ** x`) is the exception: V8 calls the platform's libm for it, so no
// one double is V8's; StrictMath's is within an ulp of it. JavaScriptCore (bun) differs from V8 in
// the last bit on several of these. No Android here: the number formatters, which need ICU, are
// NumberFormatExterns.kt.
package so.oxy.bloom.std

val PI: Double = StrictMath.PI
val E: Double = StrictMath.E
val INFINITY: Double = Double.POSITIVE_INFINITY
val NAN: Double = Double.NaN

fun sqrt(x: Double): Double = StrictMath.sqrt(x)

/** FreeBSD's s_cbrt.c, as V8's `Math.cbrt` (fdlibm 5.3's, StrictMath's, misses it for ~8% of inputs). */
fun cbrt(x: Double): Double {
  var hx = hiWord(x)
  val low = loWord(x)
  val sign = hx and 0x80000000.toInt()
  hx = hx xor sign
  if (hx >= 0x7ff00000) return x + x // NaN, infinity
  var t: Double
  if (hx < 0x00100000) { // zero or subnormal
    if ((hx or low) == 0) return x
    t = withHiWord(0.0, 0x43500000) * x // 2**54 * x
    val high = hiWord(t)
    t = words(sign or (Integer.divideUnsigned(high and 0x7fffffff, 3) + 696219795), 0)
  } else {
    t = words(sign or (hx / 3 + 715094163), 0)
  }
  // To 23 bits.
  var r = (t * t) * (t / x)
  t = t * ((1.87595182427177009643 + r * (-1.88497979543377169875 + r * 1.621429720105354466140)) +
    ((r * r) * r) * (-0.758397934778766047437 + r * 0.145996192886612446982))
  // Rounded away from zero to 23 bits.
  t = java.lang.Double.longBitsToDouble((t.toRawBits() + 0x80000000L) and -0x40000000L)
  // One Newton step to 53 bits.
  val s = t * t
  r = x / s
  val w = t + t
  r = (r - t) / (w + r)
  return t + t * r
}

fun pow(x: Double, y: Double): Double = StrictMath.pow(x, y)

/** fdlibm's exp, but V8 returns `E` itself for 1, where fdlibm's reduction is an ulp off. */
fun exp(x: Double): Double = if (x == 1.0) StrictMath.E else StrictMath.exp(x)

fun log(x: Double): Double = StrictMath.log(x)

/** FreeBSD's e_log2.c, as V8's `Math.log2` (exact for powers of two). */
fun log2(x: Double): Double {
  var v = x
  var hx = hiWord(v)
  val lx = loWord(v)
  var k = 0
  if (hx < 0x00100000) { // x < 2**-1022
    if (((hx and 0x7fffffff) or lx) == 0) return Double.NEGATIVE_INFINITY
    if (hx < 0) return Double.NaN
    k -= 54 // subnormal: scale up
    v *= TWO54
    hx = hiWord(v)
  }
  if (hx >= 0x7ff00000) return v + v
  if (hx == 0x3ff00000 && loWord(v) == 0) return 0.0
  k += (hx shr 20) - 1023
  hx = hx and 0x000fffff
  val i = (hx + 0x95f64) and 0x100000
  v = withHiWord(v, hx or (i xor 0x3ff00000)) // x or x/2
  k += i shr 20
  val y = k.toDouble()
  val f = v - 1.0
  val hfsq = 0.5 * f * f
  val r = kLog1p(f)
  val hi = withLoWord(f - hfsq, 0)
  val lo = (f - hi) - hfsq + r
  var valHi = hi * IVLN2HI
  var valLo = (lo + hi) * IVLN2LO + lo * IVLN2HI
  val w = y + valHi
  valLo += (y - w) + valHi
  valHi = w
  return valLo + valHi
}

private const val TWO54 = 1.80143985094819840000e+16
private const val IVLN2HI = 1.44269504072144627571e+00
private const val IVLN2LO = 1.67517131648865118353e-10

/** k_log.h's `k_log1p`: log(1 + f) less f - f*f/2, for f in [sqrt(2)/2 - 1, sqrt(2) - 1]. */
private fun kLog1p(f: Double): Double {
  val s = f / (2.0 + f)
  val z = s * s
  val w = z * z
  val t1 = w * (3.999999999940941908e-01 + w * (2.222219843214978396e-01 + w * 1.531383769920937332e-01))
  val t2 = z * (6.666666666666735130e-01 + w * (2.857142874366239149e-01 + w * (1.818357216161805012e-01 + w * 1.479819860511658591e-01)))
  val hfsq = 0.5 * f * f
  return s * (hfsq + (t2 + t1))
}

fun log10(x: Double): Double = StrictMath.log10(x)

fun sin(x: Double): Double = StrictMath.sin(x)

fun cos(x: Double): Double = StrictMath.cos(x)

fun tan(x: Double): Double = StrictMath.tan(x)

fun asin(x: Double): Double = StrictMath.asin(x)

fun acos(x: Double): Double = StrictMath.acos(x)

fun atan(x: Double): Double = StrictMath.atan(x)

fun atan2(y: Double, x: Double): Double = StrictMath.atan2(y, x)

/** V8's `Math.hypot` (builtins' math.tq): the values over the largest, Kahan-summed. */
fun hypot(a: Double, b: Double): Double {
  if (a.isInfinite() || b.isInfinite()) return Double.POSITIVE_INFINITY
  if (a.isNaN() || b.isNaN()) return Double.NaN
  val x = StrictMath.abs(a)
  val y = StrictMath.abs(b)
  val max = if (y > x) y else x
  if (max == 0.0) return 0.0
  var sum = 0.0
  var compensation = 0.0
  for (v in doubleArrayOf(x, y)) {
    val n = v / max
    val summand = n * n - compensation
    val preliminary = sum + summand
    compensation = (preliminary - sum) - summand
    sum = preliminary
  }
  return StrictMath.sqrt(sum) * max
}

fun sinh(x: Double): Double = StrictMath.sinh(x)

/** V8's (FreeBSD's e_cosh.c) over this file's `exp`. */
fun cosh(x: Double): Double {
  val ix = hiWord(x) and 0x7fffffff
  val a = StrictMath.abs(x)
  if (ix < 0x3fd62e43) { // |x| in [0, ln2/2]: 1 + expm1(|x|)^2 / (2 exp(|x|))
    val t = StrictMath.expm1(a)
    val w = 1.0 + t
    if (ix < 0x3c800000) return w
    return 1.0 + (t * t) / (w + w)
  }
  if (ix < 0x40360000) { // |x| in [ln2/2, 22]
    val t = exp(a)
    return 0.5 * t + 0.5 / t
  }
  if (ix < 0x40862e42) return 0.5 * exp(a) // |x| in [22, log(max double)]
  if (a <= 710.4758600739439) { // up to the overflow threshold
    val w = exp(0.5 * a)
    val t = 0.5 * w
    return t * w
  }
  if (ix >= 0x7ff00000) return x * x // NaN, infinity
  return Double.POSITIVE_INFINITY
}

/** V8's (FreeBSD's s_tanh.c): `x` itself below 2**-28, where fdlibm 5.3 stops at 2**-55. */
fun tanh(x: Double): Double {
  val jx = hiWord(x)
  val ix = jx and 0x7fffffff
  if (ix >= 0x7ff00000) return if (jx >= 0) 1.0 / x + 1.0 else 1.0 / x - 1.0 // ±1 for ±inf, NaN
  val z = if (ix < 0x40360000) { // |x| < 22
    if (ix < 0x3e300000 && HUGE + x > 1.0) return x // |x| < 2**-28
    if (ix >= 0x3ff00000) { // |x| >= 1
      val t = StrictMath.expm1(2.0 * StrictMath.abs(x))
      1.0 - 2.0 / (t + 2.0)
    } else {
      val t = StrictMath.expm1(-2.0 * StrictMath.abs(x))
      -t / (t + 2.0)
    }
  } else {
    1.0 // |x| >= 22
  }
  return if (jx >= 0) z else -z
}

// fdlibm's s_asinh.c, e_acosh.c and e_atanh.c (V8's ieee754.cc ports them unchanged), over
// StrictMath's fdlibm log, log1p and sqrt: the JVM has no inverse hyperbolic functions.
private const val LN2 = 6.93147180559945286227e-01
private const val HUGE = 1.0e300

private fun hiWord(x: Double): Int = (x.toRawBits() ushr 32).toInt()

private fun loWord(x: Double): Int = x.toRawBits().toInt()

private fun words(hi: Int, lo: Int): Double =
  java.lang.Double.longBitsToDouble((hi.toLong() shl 32) or (lo.toLong() and 0xffffffffL))

private fun withHiWord(x: Double, hi: Int): Double = words(hi, loWord(x))

private fun withLoWord(x: Double, lo: Int): Double = words(hiWord(x), lo)

fun asinh(x: Double): Double {
  val hx = hiWord(x)
  val ix = hx and 0x7fffffff
  if (ix >= 0x7ff00000) return x + x // inf or NaN
  if (ix < 0x3e300000 && HUGE + x > 1.0) return x // |x| < 2**-28
  val w = if (ix > 0x41b00000) {
    StrictMath.log(StrictMath.abs(x)) + LN2 // |x| > 2**28
  } else if (ix > 0x40000000) {
    val t = StrictMath.abs(x) // 2**28 > |x| > 2
    StrictMath.log(2.0 * t + 1.0 / (StrictMath.sqrt(x * x + 1.0) + t))
  } else {
    val t = x * x // 2 > |x| > 2**-28
    StrictMath.log1p(StrictMath.abs(x) + t / (1.0 + StrictMath.sqrt(1.0 + t)))
  }
  return if (hx > 0) w else -w
}

fun acosh(x: Double): Double {
  val hx = hiWord(x)
  return if (hx < 0x3ff00000) {
    (x - x) / (x - x) // x < 1
  } else if (hx >= 0x41b00000) {
    if (hx >= 0x7ff00000) x + x else StrictMath.log(x) + LN2 // inf or NaN; x > 2**28
  } else if (((hx - 0x3ff00000) or loWord(x)) == 0) {
    0.0 // acosh(1)
  } else if (hx > 0x40000000) {
    val t = x * x // 2**28 > x > 2
    StrictMath.log(2.0 * x - 1.0 / (x + StrictMath.sqrt(t - 1.0)))
  } else {
    val t = x - 1.0 // 1 < x < 2
    StrictMath.log1p(t + StrictMath.sqrt(2.0 * t + t * t))
  }
}

fun atanh(x: Double): Double {
  val hx = hiWord(x)
  val lx = loWord(x)
  val ix = hx and 0x7fffffff
  if ((ix or ((lx or -lx) ushr 31)) > 0x3ff00000) return (x - x) / (x - x) // |x| > 1
  if (ix == 0x3ff00000) return if (x > 0.0) Double.POSITIVE_INFINITY else Double.NEGATIVE_INFINITY
  if (ix < 0x3e300000 && HUGE + x > 0.0) return x // |x| < 2**-28
  val a = StrictMath.abs(x)
  val t = if (ix < 0x3fe00000) {
    val t2 = a + a // |x| < 0.5
    0.5 * StrictMath.log1p(t2 + t2 * a / (1.0 - a))
  } else {
    0.5 * StrictMath.log1p((a + a) / (1.0 - a))
  }
  return if (hx >= 0) t else -t
}

/** The TypeScript runtime's `2 ** x`, which V8 computes as `Math.pow(2, x)`. */
fun exp2(x: Double): Double = StrictMath.pow(2.0, x)

fun expm1(x: Double): Double = StrictMath.expm1(x)

fun log1p(x: Double): Double = StrictMath.log1p(x)

/** Toward zero, keeping a negative zero's sign (`trunc(-0.5)` is `-0.0`), as `Math.trunc`. */
fun trunc(x: Double): Double = if (x < 0.0) StrictMath.ceil(x) else StrictMath.floor(x)

/** C's `fmod`: the JVM's `%` on doubles is exactly it (the result has `x`'s sign), as JS's. */
fun fmod(x: Double, y: Double): Double = x % y

fun random(): Double = Math.random()

/** A uniformly distributed integer in `from..<to` (the TypeScript runtime's `randomInt`). */
fun randomInt(from: Long, to: Long): Long = from + StrictMath.floor(Math.random() * (to - from).toDouble()).toLong()

fun isFiniteNumber(n: Double): Boolean = n.isFinite()

fun isNaNNumber(n: Double): Boolean = n.isNaN()
