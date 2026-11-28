// The standard library's number formatters (stdlib/Bloom/Math.bloom: `formatted`, `compact`) on
// Android, through ICU, which Hermes' `Intl.NumberFormat` uses on Android. A negative fraction bound
// is the currency's own decimal places, as the TypeScript runtime reads it.
package so.oxy.bloom.std

import android.icu.text.CompactDecimalFormat
import android.icu.text.NumberFormat
import android.icu.util.Currency
import android.icu.util.ULocale

private fun localeOf(tag: String): ULocale = if (tag.isEmpty()) ULocale.getDefault() else ULocale.forLanguageTag(tag)

fun formatNumber(n: Double, locale: String, minFraction: Long, maxFraction: Long): String {
  val format = NumberFormat.getInstance(localeOf(locale))
  format.minimumFractionDigits = minFraction.toInt()
  format.maximumFractionDigits = maxFraction.toInt()
  return format.format(n)
}

fun formatCurrency(n: Double, locale: String, currency: String, minFraction: Long, maxFraction: Long): String {
  val format = NumberFormat.getCurrencyInstance(localeOf(locale))
  format.currency = Currency.getInstance(currency)
  if (minFraction >= 0) format.minimumFractionDigits = minFraction.toInt()
  if (maxFraction >= 0) format.maximumFractionDigits = maxFraction.toInt()
  return format.format(n)
}

fun formatCompact(n: Double, locale: String): String =
  CompactDecimalFormat.getInstance(localeOf(locale), CompactDecimalFormat.CompactStyle.SHORT).format(n)
