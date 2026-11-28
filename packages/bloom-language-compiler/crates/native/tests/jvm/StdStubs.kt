// See JvmStubs.kt: Core's and Time's names that Std.kt and Builtins.kt read.
@file:Suppress("unused", "UNUSED_PARAMETER")

package so.oxy.bloom.std

/** Time.bloom's `Duration`, as far as Std.kt's `sleep(for:)` reads it. */
class Duration(val milliseconds: Double)

/** Core.bloom's `Result`, as far as Builtins.kt reads it. */
sealed interface BloomResult<out S, out F> {
  data class Ok<S>(val value: S) : BloomResult<S, Nothing>
  data class Err<F>(val error: F) : BloomResult<Nothing, F>
}

/** Core.bloom's element write of a list value. */
fun <T> List<T>.replacing(at: Long, with: T): List<T> = ArrayList(this).also { it[at.toInt()] = with }
