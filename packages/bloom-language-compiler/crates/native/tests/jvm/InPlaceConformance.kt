// Copy-on-write and inout on the Kotlin backend (tests/jvm/in-place, the TypeScript backend's
// test/packages/format-app InPlace.bloom), held to test/in-place.test.ts's values.
import bloom.inplacejvm.inplace.*

private var failed = 0

private fun check(what: String, got: Any?, want: Any?) {
  if (got != want) {
    failed++
    println("in place: $what is $got, expected $want")
  }
}

fun main() {
  val start = System.nanoTime()
  val xs = cube(33L)
  val ms = (System.nanoTime() - start) / 1e6
  check("cube's size", xs.size, 35937)
  check("cube's last", xs[35936], 35936L * 2 + 1)
  if (ms >= 200) check("cube's time (ms)", ms, "< 200")
  check("histogram", histogram(listOf("a", "b", "a")), mapOf("a" to 2L, "b" to 1L))
  val ys = listOf(1L, 2L, 3L)
  check("aliasing", aliasing(ys), Triple(listOf(1L, 2L, 3L), listOf(1L, 2L, 3L), listOf(8L, 99L, 2L, 3L)))
  check("ys after aliasing", ys, listOf(1L, 2L, 3L))
  check(
    "members",
    members(),
    listOf(
      listOf(5L, 3L, 8L, 1L, 9L, 2L), listOf(8L, 1L, 3L), listOf(1L, 2L, 3L, 4L, 6L), listOf(6L, 4L, 3L, 2L, 1L),
      listOf(6L, 2L, 3L, 4L, 1L), listOf(3L, 1L), listOf(1L), listOf(1L, 2L, 1L, 2L),
    ),
  )
  check("dictionary", dictionary(), Triple(mapOf("a" to 5L, "c" to 3L), 1L, 2L))
  check("grid", grid(), Pair(listOf(listOf(0L, 5L), listOf(0L, 0L), listOf(0L, 0L)), listOf(0L, 0L)))
  check("doubled", doubled(listOf(1L, 2L)), listOf(1L, 2L, 10L, 20L))
  check("captured", captured(), Pair(2L, listOf(0L, 1L, 2L)))
  val b = Bag(listOf(3L, 1L))
  val (c, second) = nested(b)
  check("b after nested", b.items, listOf(3L, 1L))
  check("nested's c", c.items, listOf(3L, 4L))
  check("nested's second", second.items, listOf(3L, 4L, 1L))
  check(
    "inouts",
    inouts(),
    listOf(listOf(7L, 7L, 7L), listOf(7L), listOf(3L), listOf(21L), listOf(9L, 9L), listOf(4L, 0L, 4L, 0L, 1L)),
  )
  println("in place (Kotlin backend, JVM): cube(33) in ${"%.1f".format(ms)} ms, $failed failure(s)")
  if (failed > 0) kotlin.system.exitProcess(1)
}
