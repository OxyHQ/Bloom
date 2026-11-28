// The compiler's built-ins for the kotlin-compose backend (ADR 0003): what the checker
// knows without a standard library file (`count`, `xs[i]`, `trimmed()`, `print`, `Binding`,
// actors), as Kotlin. What `stdlib/Bloom/*.bloom` writes in Bloom is compiled through the
// backend (`--std JSON,Core`) into this package, and its externs are `Externs.kt`. Names and
// labels are Bloom's, so the emitter passes arguments through unchanged.
package so.oxy.bloom.std

import android.util.Log

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

// The compiler's built-in members of String and Array (spec 4), as Kotlin.

/** `s.trimmed()`: without leading and trailing whitespace. */
fun String.trimmed(): String = trim()

fun String.lowercased(): String = lowercase()

fun String.uppercased(): String = uppercase()

/** `s.split(separator: ",")`. */
fun String.split(separator: String): List<String> = split(separator, ignoreCase = false, limit = 0)

/** `xs.joined(separator: ", ")`. */
fun List<String>.joined(separator: String = ""): String = joinToString(separator)

/**
 * `sleep(for:)`: suspends, cancellably (the coroutine's cancellation is the task's). Hand-written
 * until `Concurrency.bloom` compiles through the backend (its `Foreign` handles need typed
 * runtime classes first).
 */
suspend fun sleep(`for`: Duration) {
  kotlinx.coroutines.delay(`for`.milliseconds.toLong())
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
