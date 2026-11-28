// The math externs (runtime/android/so/oxy/bloom/std/MathExterns.kt) against V8's `Math`, bit for bit
// (tests/math/v8-math.mjs writes the reference). `pow` and `exp2` may be an ulp apart: V8 calls the
// platform's libm for them.
import java.io.File
import so.oxy.bloom.std.*

private fun call(name: String, x: Double): Double {
  val a = StrictMath.abs(x)
  return when (name) {
    "sqrt" -> sqrt(a); "cbrt" -> cbrt(x); "pow" -> pow(a, 1.37); "exp" -> exp(x)
    "log" -> log(a); "log2" -> log2(a); "log10" -> log10(a)
    "sin" -> sin(x); "cos" -> cos(x); "tan" -> tan(x)
    "asin" -> asin(x / (1 + a)); "acos" -> acos(x / (1 + a)); "atan" -> atan(x)
    "atan2" -> atan2(x, 0.3); "hypot" -> hypot(x, 0.3)
    "sinh" -> sinh(x); "cosh" -> cosh(x); "tanh" -> tanh(x); "asinh" -> asinh(x)
    "acosh" -> acosh(a + 1); "atanh" -> atanh(x / (1 + a))
    "exp2" -> exp2(x); "expm1" -> expm1(x); "log1p" -> log1p(a); "trunc" -> trunc(x)
    "fmod" -> fmod(x, 0.7)
    else -> error("no extern $name")
  }
}

fun main(args: Array<String>) {
  val ulpOff = setOf("pow", "exp2")
  var checked = 0
  val misses = sortedMapOf<String, Int>()
  for (line in File(args[0]).readLines()) {
    val (name, xBits, wantBits) = line.split(" ")
    val x = java.lang.Double.longBitsToDouble(java.lang.Long.parseUnsignedLong(xBits))
    val want = java.lang.Double.longBitsToDouble(java.lang.Long.parseUnsignedLong(wantBits))
    val got = call(name, x)
    checked++
    val same = got.toRawBits() == want.toRawBits() || (got.isNaN() && want.isNaN())
    val near = name in ulpOff && StrictMath.abs(got - want) <= StrictMath.ulp(want)
    if (!same && !near) {
      if ((misses[name] ?: 0) < 3) println("$name($x): $got, V8 $want")
      misses[name] = (misses[name] ?: 0) + 1
    }
  }
  println("math externs: $checked calls, ${misses.values.sum()} differ from V8 $misses")
  if (misses.isNotEmpty()) kotlin.system.exitProcess(1)
}
