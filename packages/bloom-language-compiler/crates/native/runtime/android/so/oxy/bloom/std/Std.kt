// Bloom's standard library for the kotlin-compose backend (ADR 0003): the parts of
// stdlib/Bloom/*.bloom the bench calls, as Kotlin. Names and labels are Bloom's, so the
// emitter passes arguments through unchanged.
package so.oxy.bloom.std

import android.util.Log
import kotlinx.coroutines.delay

/** `Identifiable`: a value with a stable `id` (a list's key). */
interface Identifiable {
  val id: String
}

/** A thrown Bloom value (`throw x`). */
class BloomError(val value: Any?) : Exception(value.toString())

/** `print(_:)`: a log line (logcat tag `Bloom`), as the TypeScript runtime's `console.log`. */
fun print(message: String) {
  Log.i("Bloom", message)
}

/** `range(n)`: `[0, 1, …, n-1]`. */
fun range(n: Int): List<Int> = List(n) { it }

fun stride(from: Int, to: Int, by: Int = 1): List<Int> = (from until to step by).toList()

/** `xs.updating(where:_:)`: a copy with the matching elements replaced. */
fun <T> List<T>.updating(where: (T) -> Boolean, update: (T) -> T): List<T> =
  map { if (where(it)) update(it) else it }

fun <T> List<T>.replacing(at: Int, with: T): List<T> = mapIndexed { i, x -> if (i == at) with else x }

fun String.replacingOccurrences(of: String, with: String): String = replace(of, with)

fun String.hasPrefix(prefix: String): Boolean = startsWith(prefix)

fun String.hasSuffix(suffix: String): Boolean = endsWith(suffix)

/** `Duration`: a length of time. */
data class Duration(val seconds: Double) {
  val milliseconds: Double get() = seconds * 1000.0

  companion object {
    fun milliseconds(n: Double) = Duration(n / 1000.0)
    fun seconds(n: Double) = Duration(n)
    val zero = Duration(0.0)
  }
}

/** `ContinuousClock`: a monotonic instant, in milliseconds. */
data class ContinuousClock(val milliseconds: Double) {
  val elapsed: Duration get() = Duration.milliseconds(now.milliseconds - milliseconds)

  companion object {
    val now: ContinuousClock get() = ContinuousClock(System.nanoTime() / 1_000_000.0)
  }
}

/** `sleep(for:)`: suspends, cancellably. */
suspend fun sleep(`for`: Duration) {
  delay((`for`.seconds * 1000.0).toLong())
}

/** `Binding(get:set:)`, `$state`: a value and its setter. */
class Binding<T>(val get: () -> T, val set: (T) -> Unit) {
  val value: T get() = get()
}
