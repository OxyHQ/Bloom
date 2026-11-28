// The compiler's built-in methods (the checker's `method_sig`, spec 12) for the kotlin-compose
// backend: the ones Kotlin has no same-meaning function for, under their Bloom names. The few
// whose Kotlin member of the same name means something else (`toFloat`, `indexOf`, Optional's
// `map`) are mapped by the emitter instead. Semantics follow the TypeScript runtime's.
package so.oxy.bloom.std

// ---- String ------------------------------------------------------------------------------

/** JavaScript's `slice`: UTF-16 offsets, negative from the end, clamped. */
fun String.slice(start: Long, end: Long = length.toLong()): String {
  val (a, b) = sliceBounds(length, start, end)
  return if (a < b) substring(a, b) else ""
}

// ---- Numbers -----------------------------------------------------------------------------

/** JavaScript's `Math.round`: half toward +infinity. */
fun Double.rounded(): Long = Math.floor(this + 0.5).toLong()

fun Double.floor(): Long = Math.floor(this).toLong()

fun Double.ceil(): Long = Math.ceil(this).toLong()

fun Double.truncated(): Long = toLong()

fun Double.abs(): Double = Math.abs(this)

fun Long.abs(): Long = Math.abs(this)

fun Double.min(other: Double): Double = Math.min(this, other)

fun Double.max(other: Double): Double = Math.max(this, other)

fun Long.min(other: Long): Long = Math.min(this, other)

fun Long.max(other: Long): Long = Math.max(this, other)

fun Long.clamped(lo: Long, hi: Long): Long = coerceIn(lo, hi)

fun Double.clamped(lo: Double, hi: Double): Double = coerceIn(lo, hi)

fun Long.clamp(lo: Long, hi: Long): Long = coerceIn(lo, hi)

fun Double.clamp(lo: Double, hi: Double): Double = coerceIn(lo, hi)

// ---- Lists -------------------------------------------------------------------------------

private fun sliceBounds(size: Int, start: Long, end: Long): Pair<Int, Int> {
  fun at(i: Long): Int = (if (i < 0) (size + i).coerceAtLeast(0) else i.coerceAtMost(size.toLong())).toInt()
  return at(start) to at(end)
}

/** JavaScript's `slice`: negative from the end, clamped. */
fun <T> List<T>.slice(start: Long, end: Long = size.toLong()): List<T> {
  val (a, b) = sliceBounds(size, start, end)
  return if (a < b) subList(a, b).toList() else emptyList()
}

fun <T> List<T>.bloomIndexOf(element: T): Long? = indexOf(element).takeIf { it >= 0 }?.toLong()

fun <T> List<T>.findIndex(predicate: (T) -> Boolean): Long? = indexOfFirst(predicate).takeIf { it >= 0 }?.toLong()

fun <T> List<T>.prefix(n: Long): List<T> = take(n.toInt().coerceAtLeast(0))

fun <T> List<T>.dropFirst(n: Long = 1L): List<T> = drop(n.toInt().coerceAtLeast(0))
fun <T> List<T>.suffix(n: Long): List<T> = takeLast(n.toInt().coerceAtLeast(0))
fun <T> List<T>.dropLast(n: Long = 1L): List<T> = dropLast(n.toInt().coerceAtLeast(0))

fun <T> List<T>.appending(element: T): List<T> = ArrayList<T>(size + 1).also { it.addAll(this); it.add(element) }

fun <T> List<T>.inserting(element: T, at: Long): List<T> =
  ArrayList(this).also { it.add(at.toInt().coerceIn(0, size), element) }

fun <T> List<T>.removing(at: Long): List<T> =
  if (at in 0 until size) ArrayList(this).also { it.removeAt(at.toInt()) } else this

// ---- Dictionaries and sets ---------------------------------------------------------------

fun <K, V> Map<K, V>.setting(key: K, value: V): Map<K, V> = LinkedHashMap(this).also { it[key] = value }

fun <K, V> Map<K, V>.removing(key: K): Map<K, V> = LinkedHashMap(this).also { it.remove(key) }

fun <T> Set<T>.inserting(element: T): Set<T> = LinkedHashSet(this).also { it.add(element) }

fun <T> Set<T>.removing(element: T): Set<T> = LinkedHashSet(this).also { it.remove(element) }

// ---- Result ------------------------------------------------------------------------------

fun <S, F, U> BloomResult<S, F>.map(transform: (S) -> U): BloomResult<U, F> =
  when (this) {
    is BloomResult.Ok -> BloomResult.Ok(transform(value))
    is BloomResult.Err -> this
  }

fun <S, F, U> BloomResult<S, F>.mapErr(transform: (F) -> U): BloomResult<S, U> =
  when (this) {
    is BloomResult.Ok -> this
    is BloomResult.Err -> BloomResult.Err(transform(error))
  }

fun <S, F> BloomResult<S, F>.unwrapOr(fallback: S): S = if (this is BloomResult.Ok) value else fallback
