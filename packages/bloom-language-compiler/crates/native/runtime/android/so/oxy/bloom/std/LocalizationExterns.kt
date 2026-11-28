// The standard library's Localization externs (stdlib/Bloom/Localization.bloom's `extern module`)
// on Android, as the TypeScript runtime's: the catalogs `bloom build` registers, the preferred
// locale (snapshot state, so a composable that reads it through `useLocalization()` draws again
// when it changes, as `useSyncExternalStore` does), the lookup's fallbacks (the locale, its
// language, then English), the `zero` form, and ICU's plural rules (`Intl.PluralRules`).
package so.oxy.bloom.std

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

private val catalogs = LinkedHashMap<String, Map<String, Any?>>()

private var preferred: String? by mutableStateOf(null)

/** The device's locale, as a BCP 47 tag (JavaScript's `Intl…resolvedOptions().locale`). */
private fun deviceLocale(): String = java.util.Locale.getDefault().toLanguageTag()

internal fun useLocaleIdentifier(): String = preferredLocale()

@Suppress("UNCHECKED_CAST")
internal fun registerCatalog(locale: String, catalog: JSONValue) {
  (catalog as? Map<String, Any?>)?.let { catalogs[locale] = it }
}

internal fun setPreferredLocale(locale: String) {
  preferred = locale.ifEmpty { null }
}

internal fun preferredLocale(): String = preferred ?: deviceLocale()

private fun lookup(key: String, locale: String): Any? =
  catalogs[locale]?.get(key)
    ?: catalogs[locale.substringBefore('-')]?.get(key)
    ?: catalogs["en"]?.get(key)

private fun pluralRules(locale: String): android.icu.text.PluralRules =
  android.icu.text.PluralRules.forLocale(
    if (locale.isEmpty()) android.icu.util.ULocale.getDefault() else android.icu.util.ULocale.forLanguageTag(locale),
  )

private val placeholder = Regex("""\{(\w+)\}""")

/** The string for `key`, its `{name}`s replaced; the key itself when no catalog has it. */
internal fun localize(key: String, args: Map<String, String>, count: Double?, locale: String?): String {
  val inLocale = locale ?: preferredLocale()
  val text = when (val found = lookup(key, inLocale)) {
    null -> key
    is String -> found
    is Map<*, *> -> {
      // A count of exactly 0 takes a `zero` form where the catalog has one, in every language.
      val category = when {
        count == null -> "other"
        count == 0.0 && found["zero"] != null -> "zero"
        else -> pluralRules(inLocale).select(count)
      }
      (found[category] ?: found["other"]) as? String ?: key
    }
    else -> key
  }
  return placeholder.replace(text) { m ->
    val name = m.groupValues[1]
    args[name] ?: if (name == "count" && count != null) jsNumber(count) else m.value
  }
}

internal fun pluralCategoryOf(n: Double, locale: String): String = pluralRules(locale).select(n)

/** A number as JavaScript's `String(n)` writes an integral one (`3`, not `3.0`). */
private fun jsNumber(n: Double): String =
  if (n == StrictMath.rint(n) && StrictMath.abs(n) < 1e21) n.toLong().toString() else n.toString()
