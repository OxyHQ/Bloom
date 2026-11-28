// What the engine calls of the standard library's Core (`stdlib/Bloom/Core.bloom`), for the JVM
// harness, which compiles the engine without Core and Android (the runtime ships Core's own
// emitted Kotlin, `so/oxy/bloom/std/Core.kt`): a list's write with value semantics and Swift's
// stable `sorted(by:)`, with Core's semantics.
package so.oxy.bloom.std

fun <T> List<T>.replacing(at: Long, with: T): List<T> = ArrayList(this).also { it[at.toInt()] = with }

fun <T> List<T>.sorted(by: (T, T) -> Boolean): List<T> = sortedWith { a, b -> if (by(a, b)) -1 else if (by(b, a)) 1 else 0 }
