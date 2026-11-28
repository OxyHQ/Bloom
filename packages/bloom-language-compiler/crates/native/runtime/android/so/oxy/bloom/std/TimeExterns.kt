// `stdlib/Bloom/Time.bloom`'s externs for the kotlin-compose backend, under their Bloom names;
// the rest of Time.bloom (`extension Date`, `Duration`, `ContinuousClock`, `Calendar`) is Bloom,
// compiled through the backend. Formatting goes through `android.icu`, which is what Hermes'
// `Intl` uses on Android, so a date reads the same in a Compose island as in React Native.
package so.oxy.bloom.std

import androidx.compose.runtime.Immutable

/** Bloom's built-in `Date`: an instant, in milliseconds since 1970-01-01T00:00:00Z. */
@Immutable
data class Date(val milliseconds: Double)

internal fun dateNow(): Date = Date(System.currentTimeMillis().toDouble())

internal fun dateOfMs(ms: Double): Date = Date(ms)

internal fun msOfDate(date: Date): Double = date.milliseconds

internal fun nowMs(): Double = System.currentTimeMillis().toDouble()

/** A monotonic clock, in milliseconds. */
internal fun monotonicMs(): Double = System.nanoTime() / 1_000_000.0

/** Milliseconds since 1970 for an ISO 8601 date-time or date, as `Date.parse` reads them. */
internal fun parseISO(s: String): Double? =
  runCatching { java.time.OffsetDateTime.parse(s).toInstant().toEpochMilli().toDouble() }
    .recoverCatching { java.time.Instant.parse(s).toEpochMilli().toDouble() }
    .recoverCatching {
      // No offset: a date-time is local time, a bare date UTC (ECMAScript's rule).
      java.time.LocalDateTime.parse(s).atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli().toDouble()
    }
    .recoverCatching { java.time.LocalDate.parse(s).atStartOfDay(java.time.ZoneOffset.UTC).toInstant().toEpochMilli().toDouble() }
    .getOrNull()

private val isoFormat =
  java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(java.time.ZoneOffset.UTC)

/** `toISOString`: UTC, with milliseconds. */
internal fun isoString(ms: Double): String = isoFormat.format(java.time.Instant.ofEpochMilli(ms.toLong()))

private fun uLocale(locale: String): android.icu.util.ULocale =
  if (locale.isEmpty()) android.icu.util.ULocale.getDefault() else android.icu.util.ULocale.forLanguageTag(locale)

private fun zone(timeZone: String): android.icu.util.TimeZone =
  if (timeZone.isEmpty()) android.icu.util.TimeZone.getDefault() else android.icu.util.TimeZone.getTimeZone(timeZone)

private fun icuStyle(style: String): Int =
  when (style) {
    "full" -> android.icu.text.DateFormat.FULL
    "long" -> android.icu.text.DateFormat.LONG
    "medium" -> android.icu.text.DateFormat.MEDIUM
    "short" -> android.icu.text.DateFormat.SHORT
    else -> android.icu.text.DateFormat.NONE
  }

/** `Intl.DateTimeFormat` with `dateStyle` / `timeStyle` (`"numeric"`: the full-year numeric date). */
internal fun formatDate(ms: Double, locale: String, date: String, time: String, timeZone: String): String {
  val l = uLocale(locale)
  val format =
    if (date == "numeric") {
      var skeleton = "yMd"
      if (time != "omitted") {
        skeleton += "jmm"
        if (time != "short") skeleton += "ss"
        if (time == "long") skeleton += "z"
      }
      android.icu.text.DateFormat.getInstanceForSkeleton(skeleton, l)
    } else {
      android.icu.text.DateFormat.getDateTimeInstance(icuStyle(date), icuStyle(time), l)
    }
  format.timeZone = zone(timeZone)
  return format.format(java.util.Date(ms.toLong()))
}

/** `Intl.DateTimeFormat` with fields (`year: "numeric"`, `month: "short"`, …), as an ICU skeleton. */
internal fun formatDateFields(ms: Double, locale: String, options: Map<String, String>, timeZone: String): String {
  val skeleton = StringBuilder()
  fun digits(field: Char, style: String?) {
    when (style) {
      null -> {}
      "2-digit" -> skeleton.append(field).append(field)
      else -> skeleton.append(field)
    }
  }
  fun names(field: Char, style: String?) {
    when (style) {
      null -> {}
      "numeric" -> skeleton.append(field)
      "2-digit" -> skeleton.append(field).append(field)
      "short" -> skeleton.append(field.toString().repeat(3))
      "long" -> skeleton.append(field.toString().repeat(4))
      "narrow" -> skeleton.append(field.toString().repeat(5))
    }
  }
  names('E', options["weekday"]?.let { if (it == "numeric" || it == "2-digit") "short" else it })
  digits('y', options["year"])
  names('M', options["month"])
  digits('d', options["day"])
  digits('j', options["hour"])
  digits('m', options["minute"])
  digits('s', options["second"])
  val format = android.icu.text.DateFormat.getInstanceForSkeleton(skeleton.toString(), uLocale(locale))
  format.timeZone = zone(timeZone)
  return format.format(java.util.Date(ms.toLong()))
}

/** `Intl.RelativeTimeFormat` (`numeric: "auto"`): "in 3 minutes", "yesterday". */
internal fun formatRelative(value: Double, unit: String, locale: String, style: String): String {
  val icuStyle =
    when (style) {
      "short" -> android.icu.text.RelativeDateTimeFormatter.Style.SHORT
      "narrow" -> android.icu.text.RelativeDateTimeFormatter.Style.NARROW
      else -> android.icu.text.RelativeDateTimeFormatter.Style.LONG
    }
  val f =
    android.icu.text.RelativeDateTimeFormatter.getInstance(
      uLocale(locale),
      null,
      icuStyle,
      android.icu.text.DisplayContext.CAPITALIZATION_NONE,
    )
  val u =
    when (unit) {
      "second" -> android.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit.SECOND
      "minute" -> android.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit.MINUTE
      "hour" -> android.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit.HOUR
      "day" -> android.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit.DAY
      "week" -> android.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit.WEEK
      "month" -> android.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit.MONTH
      else -> android.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit.YEAR
    }
  // API 28+ (every device Bloom's Compose islands run on supports it; minSdk 26 reads numerically).
  if (android.os.Build.VERSION.SDK_INT >= 28) return f.format(value, u)
  return "${value.toLong()} $unit"
}

/** The calendar fields of `ms`, in the device's time zone (UTC with `utc`); weekday 1 is Sunday. */
internal fun dateParts(ms: Double, utc: Boolean): DateComponents {
  val zone = if (utc) java.time.ZoneOffset.UTC else java.time.ZoneId.systemDefault()
  val t = java.time.Instant.ofEpochMilli(ms.toLong()).atZone(zone)
  return DateComponents(
    t.year.toLong(),
    t.monthValue.toLong(),
    t.dayOfMonth.toLong(),
    t.hour.toLong(),
    t.minute.toLong(),
    t.second.toLong(),
    (t.dayOfWeek.value % 7 + 1).toLong(),
  )
}

internal fun dateFromParts(year: Long, month: Long, day: Long, hour: Long, minute: Long, second: Long, utc: Boolean): Double {
  val zone = if (utc) java.time.ZoneOffset.UTC else java.time.ZoneId.systemDefault()
  // JavaScript's `Date` rolls over out-of-range fields (month 13 is next January).
  val t =
    java.time.LocalDateTime.of(year.toInt(), 1, 1, 0, 0, 0)
      .plusMonths(month - 1)
      .plusDays(day - 1)
      .plusHours(hour)
      .plusMinutes(minute)
      .plusSeconds(second)
  return t.atZone(zone).toInstant().toEpochMilli().toDouble()
}

internal fun currentTimeZone(): String = java.util.TimeZone.getDefault().id
