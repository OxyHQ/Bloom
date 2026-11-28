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
fun range(n: Long): List<Long> = List(n.toInt()) { it.toLong() }

fun stride(from: Long, to: Long, by: Long = 1L): List<Long> = (from until to step by).toList()

// `Int` is 64-bit (ADR 0003): counts and indices are `Long`; the JVM's collections take `Int`.

/** `xs.count`, `d.count`: a `Long`. */
val <T> Collection<T>.count: Long get() = size.toLong()
val <K, V> Map<K, V>.count: Long get() = size.toLong()

/** `s.count`: the user-perceived characters (extended grapheme clusters), as Swift counts them. */
val String.count: Long get() = characters().size.toLong()

/** `s.characters`: the extended grapheme clusters, each a `String`. */
fun String.characters(): List<String> {
  val it = java.text.BreakIterator.getCharacterInstance()
  it.setText(this)
  val out = ArrayList<String>()
  var start = it.first()
  var end = it.next()
  while (end != java.text.BreakIterator.DONE) {
    out.add(substring(start, end))
    start = end
    end = it.next()
  }
  return out
}

/** `xs[i]` with a 64-bit index. */
operator fun <T> List<T>.get(index: Long): T = get(index.toInt())

/** `xs.at(i)`: the element, or none past either end. */
fun <T> List<T>.at(index: Long): T? = if (index in 0 until size) get(index.toInt()) else null

/** `xs.enumerated()`: `(offset, element)` pairs. */
fun <T> List<T>.enumerated(): List<Pair<Long, T>> = mapIndexed { i, x -> i.toLong() to x }

/** `xs.updating(where:_:)`: a copy with the matching elements replaced. */
fun <T> List<T>.updating(where: (T) -> Boolean, update: (T) -> T): List<T> =
  map { if (where(it)) update(it) else it }

fun <T> List<T>.replacing(at: Long, with: T): List<T> = mapIndexed { i, x -> if (i.toLong() == at) with else x }

fun String.replacingOccurrences(of: String, with: String): String = replace(of, with)

fun String.hasPrefix(prefix: String): Boolean = startsWith(prefix)

// The compiler's built-in members of String and Array (spec 4), as Kotlin.

/** `s.trimmed()`: without leading and trailing whitespace. */
fun String.trimmed(): String = trim()

fun String.lowercased(): String = lowercase()

fun String.uppercased(): String = uppercase()

/** `s.split(separator: ",")`. */
fun String.split(separator: String): List<String> = split(separator, ignoreCase = false, limit = 0)

/** `xs.joined(separator: ", ")`. */
fun List<String>.joined(separator: String = ""): String = joinToString(separator)

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

/**
 * `actor` (2.0): an actor's methods run on its own serial dispatcher, one at a time, as Swift
 * isolates an actor's state. A method calling another of the same actor's re-enters the same
 * dispatcher (no deadlock, unlike a `Mutex`); suspension points interleave as Swift's do.
 */
@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
abstract class BloomActor {
  private val dispatcher = kotlinx.coroutines.Dispatchers.Default.limitedParallelism(1)

  protected suspend fun <T> isolated(block: suspend () -> T): T =
    kotlinx.coroutines.withContext(dispatcher) { block() }
}

/** `EnvironmentKey("session", default: v)`: an app's environment value, provided by `.environment(\.k, v)`. */
class EnvironmentKey<T>(val name: String, default: T) {
  val local: androidx.compose.runtime.ProvidableCompositionLocal<T> = androidx.compose.runtime.compositionLocalOf { default }

  val current: T
    @androidx.compose.runtime.Composable get() = local.current
}
