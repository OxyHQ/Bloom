// What the emitted Kotlin and the runtime's std name from Android, Compose and the standard library
// modules this harness does not compile (Core's Result, Time's Duration), stubbed so the colour
// engine compiles and runs on a plain JVM. The engine calls none of them; the runtime files it does
// call (Std.kt, Builtins.kt, MathExterns.kt) are compiled as they are.
@file:Suppress("unused", "UNUSED_PARAMETER")

package android.util

object Log {
  fun i(tag: String, message: String): Int = 0
}
