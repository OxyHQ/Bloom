@file:Suppress("unused", "UNUSED_PARAMETER")

package so.oxy.bloom.std

/** Time.bloom's `Duration`, as far as Std.kt's `sleep(for:)` reads it. */
class Duration(val milliseconds: Double)

/** Core.bloom's `Result`, as far as Builtins.kt reads it. */
sealed interface BloomResult<out S, out F> {
  data class Ok<S>(val value: S) : BloomResult<S, Nothing>
  data class Err<F>(val error: F) : BloomResult<Nothing, F>
}

// Math.bloom's ICU formatters (NumberFormatExterns.kt on Android).
fun formatNumber(n: Double, locale: String, minFraction: Long, maxFraction: Long): String = n.toString()
fun formatCurrency(n: Double, locale: String, currency: String, minFraction: Long, maxFraction: Long): String = n.toString()
fun formatCompact(n: Double, locale: String): String = n.toString()
