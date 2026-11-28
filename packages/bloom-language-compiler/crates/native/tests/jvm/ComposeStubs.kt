// See JvmStubs.kt: the Compose names a pure-Bloom module's emitted Kotlin imports.
@file:Suppress("unused")

package androidx.compose.runtime

annotation class Immutable

@Target(AnnotationTarget.FUNCTION, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.TYPE)
annotation class Composable

interface ProvidableCompositionLocal<T> {
  val current: T
}

fun <T> compositionLocalOf(defaultFactory: () -> T): ProvidableCompositionLocal<T> =
  object : ProvidableCompositionLocal<T> {
    override val current: T get() = defaultFactory()
  }
