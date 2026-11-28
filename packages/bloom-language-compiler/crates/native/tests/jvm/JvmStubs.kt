// What emitted Kotlin and the runtime's Std.kt/Builtins.kt name from Android, Compose and the standard
// library modules a plain-JVM harness does not compile (Core's Result and `replacing`, Time's
// Duration), stubbed with their semantics so a pure-Bloom module (no views) runs on the JVM.
@file:Suppress("unused", "UNUSED_PARAMETER")

package android.util

object Log {
  fun i(tag: String, message: String): Int = 0
}
