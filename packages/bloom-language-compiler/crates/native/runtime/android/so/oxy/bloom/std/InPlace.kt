// Swift's in-place writes to arrays and dictionaries (core15's copy-on-write). Bloom's arrays and
// dictionaries are values: a `var` that writes its own (the checker's `copy_on_write` analysis)
// holds a MutableList/MutableMap, copied where it escapes, so n writes take O(n), as on the
// TypeScript backend. Each member is the TypeScript runtime's (`$removeAt`, `$sortBy`, …), with its
// range checks, under a `bloom` name so Kotlin's own (`removeLast`, which Android before API 35
// resolves to Java 21's missing `List.removeLast`) is never picked instead.
package so.oxy.bloom.std

/** `xs[i] = v` with Bloom's `Int` index. */
operator fun <T> MutableList<T>.set(index: Long, element: T) {
  set(index.toInt(), element)
}

/** Swift's `Array(repeating: v, count: n)`: `n` copies of `v`, which was evaluated once. */
fun <T> arrayRepeating(value: T, count: Long): MutableList<T> {
  require(count >= 0) { "Can't construct Array with count < 0" }
  return MutableList(count.toInt()) { value }
}

/** An `inout` parameter: the caller's place, read and written as `value`, written back on return. */
class InOut<T>(@JvmField var value: T)

fun <T> MutableList<T>.bloomAppend(element: T) {
  add(element)
}

fun <T> MutableList<T>.bloomAppendContentsOf(elements: Collection<T>) {
  // `xs.append(contentsOf: xs)`: ArrayList copies its argument first.
  addAll(elements)
}

fun <T> MutableList<T>.bloomInsert(element: T, at: Long) {
  if (at < 0 || at > size) throw IndexOutOfBoundsException("Index out of range: $at is not in 0...$size")
  add(at.toInt(), element)
}

fun <T> MutableList<T>.bloomRemoveAt(at: Long): T {
  if (at < 0 || at >= size) throw IndexOutOfBoundsException("Index out of range: $at is not in 0..<$size")
  return removeAt(at.toInt())
}

fun <T> MutableList<T>.bloomRemoveFirst(): T {
  if (isEmpty()) throw NoSuchElementException("Can't remove the first element of an empty array")
  return removeAt(0)
}

fun <T> MutableList<T>.bloomRemoveLast(): T {
  if (isEmpty()) throw NoSuchElementException("Can't remove the last element of an empty array")
  return removeAt(size - 1)
}

fun <T> MutableList<T>.bloomRemoveFirstN(k: Long) {
  if (k < 0 || k > size) throw IndexOutOfBoundsException("Can't remove $k elements of $size")
  subList(0, k.toInt()).clear()
}

fun <T> MutableList<T>.bloomRemoveLastN(k: Long) {
  if (k < 0 || k > size) throw IndexOutOfBoundsException("Can't remove $k elements of $size")
  subList(size - k.toInt(), size).clear()
}

fun <T> MutableList<T>.bloomPopLast(): T? = if (isEmpty()) null else removeAt(size - 1)

fun <T> MutableList<T>.bloomRemoveAll() {
  clear()
}

fun <T> MutableList<T>.bloomRemoveAllWhere(remove: (T) -> Boolean) {
  var kept = 0
  for (i in indices) {
    val item = this[i]
    if (!remove(item)) this[kept++] = item
  }
  subList(kept, size).clear()
}

fun <T> MutableList<T>.bloomSwapAt(i: Long, j: Long) {
  if (i < 0 || i >= size || j < 0 || j >= size) {
    throw IndexOutOfBoundsException("Index out of range: $i, $j in 0..<$size")
  }
  val item = this[i.toInt()]
  this[i.toInt()] = this[j.toInt()]
  this[j.toInt()] = item
}

/** The natural order (`Int`, `Double`, `String`, `Date`), stable as JavaScript's sort. */
fun <T : Comparable<T>> MutableList<T>.bloomSort() {
  sort()
}

/** `sort(by: before)`, stable as JavaScript's sort, with the TypeScript runtime's comparator. */
fun <T> MutableList<T>.bloomSortBy(before: (T, T) -> Boolean) {
  sortWith { a, b -> if (before(a, b)) -1 else if (before(b, a)) 1 else 0 }
}

fun <T> MutableList<T>.bloomReverse() {
  reverse()
}

fun <K, V> MutableMap<K, V>.bloomRemoveAll() {
  clear()
}

fun <K, V> MutableMap<K, V>.bloomRemoveValue(forKey: K): V? = remove(forKey)

fun <K, V> MutableMap<K, V>.bloomUpdateValue(value: V, forKey: K): V? = put(forKey, value)
