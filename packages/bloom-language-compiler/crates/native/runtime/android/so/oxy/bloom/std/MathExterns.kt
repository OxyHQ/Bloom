// The standard library's math externs (stdlib/Bloom/Math.bloom's `extern module`) on the JVM, under
// their Bloom names. StrictMath throughout: fdlibm, the same bits on every JVM and Android device and
// the algorithms JavaScript engines' `Math` uses, so a computation (the colour engine's) gives the
// TypeScript backend's doubles. `pow` may round an ulp apart from V8's or JavaScriptCore's on a few
// inputs; a golden that needs bit identity there says so. No Android here: the number formatters,
// which need ICU, are NumberFormatExterns.kt.
package so.oxy.bloom.std

val PI: Double = StrictMath.PI
val E: Double = StrictMath.E
val INFINITY: Double = Double.POSITIVE_INFINITY
val NAN: Double = Double.NaN

fun sqrt(x: Double): Double = StrictMath.sqrt(x)

fun cbrt(x: Double): Double = StrictMath.cbrt(x)

fun pow(x: Double, y: Double): Double = StrictMath.pow(x, y)

fun exp(x: Double): Double = StrictMath.exp(x)

fun log(x: Double): Double = StrictMath.log(x)

/** JavaScript's `Math.log2`; exact for powers of two. */
fun log2(x: Double): Double {
  val exponent = StrictMath.getExponent(x)
  return if (x > 0.0 && x == StrictMath.scalb(1.0, exponent)) exponent.toDouble() else StrictMath.log(x) / StrictMath.log(2.0)
}

fun log10(x: Double): Double = StrictMath.log10(x)

fun sin(x: Double): Double = StrictMath.sin(x)

fun cos(x: Double): Double = StrictMath.cos(x)

fun tan(x: Double): Double = StrictMath.tan(x)

fun asin(x: Double): Double = StrictMath.asin(x)

fun acos(x: Double): Double = StrictMath.acos(x)

fun atan(x: Double): Double = StrictMath.atan(x)

fun atan2(y: Double, x: Double): Double = StrictMath.atan2(y, x)

fun hypot(a: Double, b: Double): Double = StrictMath.hypot(a, b)

fun random(): Double = Math.random()

/** A uniformly distributed integer in `from..<to` (the TypeScript runtime's `randomInt`). */
fun randomInt(from: Long, to: Long): Long = from + StrictMath.floor(Math.random() * (to - from).toDouble()).toLong()

fun isFiniteNumber(n: Double): Boolean = n.isFinite()

fun isNaNNumber(n: Double): Boolean = n.isNaN()
