// The standard library's externs for the kotlin-compose backend (ADR 0003): what
// `stdlib/Bloom/JSON.bloom` and `Core.bloom` declare in their `extern module "./runtime"`
// blocks, as Kotlin, under their Bloom names (`graphemes`, not the TypeScript runtime's
// `characters`). Everything else in those files is Bloom, compiled through the backend
// (`bloom-native --std JSON,Core`) into this package.
package so.oxy.bloom.std

// ---- JSON --------------------------------------------------------------------------------
//
// A `JSONValue` (`Any?`) is what `parseJSON` makes: a `LinkedHashMap<String, Any?>` (an
// object, in its keys' order), a `List<Any?>`, a `String`, a `Double`, a `Boolean`, `null`,
// or `JSONAbsent` (a member the object does not have, left out when encoded).

/** A member an object does not have: `jsonKind` "absent", left out of an encoded object. */
object JSONAbsent {
  override fun toString(): String = "absent"
}

internal fun parseJSON(text: String): JSONValue = JSONParser(text).document()

internal fun stringifyJSON(value: JSONValue, indent: Long): String =
  StringBuilder().also { writeJSON(it, value, indent.toInt(), 0) }.toString()

internal fun jsonKind(value: JSONValue): String =
  when (value) {
    JSONAbsent -> "absent"
    null -> "null"
    is Boolean -> "bool"
    is Number -> "number"
    is String -> "string"
    is List<*> -> "array"
    else -> "object"
  }

internal fun jsonMember(value: JSONValue, key: String): JSONValue {
  val map = value as? Map<*, *> ?: return JSONAbsent
  return if (map.containsKey(key)) map[key] else JSONAbsent
}

internal fun jsonKeys(value: JSONValue): List<String> =
  (value as? Map<*, *>)?.keys?.map { it as String } ?: emptyList()

internal fun jsonItems(value: JSONValue): List<JSONValue> = (value as? List<*>) ?: emptyList()

internal fun jsonString(value: JSONValue): String = value as String

internal fun jsonNumber(value: JSONValue): Double = (value as Number).toDouble()

internal fun jsonBool(value: JSONValue): Boolean = value as Boolean

/** The case of `cases` named `value` (a case-only enum's, by its Kotlin name). */
internal fun <T> jsonOneOf(value: JSONValue, cases: List<T>): T? = cases.firstOrNull { it.toString() == value }

internal fun <T> jsonOfCase(value: T): JSONValue = value.toString()

internal fun jsonOfString(s: String): JSONValue = s

internal fun jsonOfNumber(n: Double): JSONValue = n

internal fun jsonOfBool(b: Boolean): JSONValue = b

internal fun jsonNull(): JSONValue = null

internal fun jsonAbsent(): JSONValue = JSONAbsent

internal fun jsonOfArray(xs: List<JSONValue>): JSONValue = xs

internal fun jsonOfObject(entries: Map<String, JSONValue>): JSONValue {
  val out = LinkedHashMap<String, Any?>(entries.size)
  for ((k, v) in entries) if (v !== JSONAbsent) out[k] = v
  return out
}

/** Invalid JSON text: what `JSON.parse` throws. */
class JSONSyntaxError(message: String) : Exception(message)

private class JSONParser(private val s: String) {
  private var i = 0

  fun document(): Any? {
    val v = value()
    space()
    if (i != s.length) fail("unexpected text after the value")
    return v
  }

  private fun fail(why: String): Nothing = throw JSONSyntaxError("JSON at $i: $why")

  private fun space() {
    while (i < s.length && (s[i] == ' ' || s[i] == '\n' || s[i] == '\r' || s[i] == '\t')) i++
  }

  private fun value(): Any? {
    space()
    if (i >= s.length) fail("unexpected end")
    return when (val c = s[i]) {
      '{' -> obj()
      '[' -> arr()
      '"' -> str()
      't' -> word("true", true)
      'f' -> word("false", false)
      'n' -> word("null", null)
      else -> if (c == '-' || c in '0'..'9') num() else fail("unexpected '$c'")
    }
  }

  private fun word(w: String, v: Any?): Any? {
    if (!s.startsWith(w, i)) fail("expected $w")
    i += w.length
    return v
  }

  private fun obj(): Map<String, Any?> {
    val out = LinkedHashMap<String, Any?>()
    i++
    space()
    if (i < s.length && s[i] == '}') {
      i++
      return out
    }
    while (true) {
      space()
      if (i >= s.length || s[i] != '"') fail("expected a key")
      val k = str()
      space()
      if (i >= s.length || s[i] != ':') fail("expected ':'")
      i++
      out[k] = value()
      space()
      if (i >= s.length) fail("unexpected end")
      when (s[i++]) {
        ',' -> continue
        '}' -> return out
        else -> fail("expected ',' or '}'")
      }
    }
  }

  private fun arr(): List<Any?> {
    val out = ArrayList<Any?>()
    i++
    space()
    if (i < s.length && s[i] == ']') {
      i++
      return out
    }
    while (true) {
      out.add(value())
      space()
      if (i >= s.length) fail("unexpected end")
      when (s[i++]) {
        ',' -> continue
        ']' -> return out
        else -> fail("expected ',' or ']'")
      }
    }
  }

  private fun str(): String {
    i++
    val sb = StringBuilder()
    while (true) {
      if (i >= s.length) fail("unterminated string")
      val c = s[i++]
      when (c) {
        '"' -> return sb.toString()
        '\\' -> {
          if (i >= s.length) fail("unterminated escape")
          when (val e = s[i++]) {
            '"' -> sb.append('"')
            '\\' -> sb.append('\\')
            '/' -> sb.append('/')
            'b' -> sb.append('\b')
            'f' -> sb.append('\u000C')
            'n' -> sb.append('\n')
            'r' -> sb.append('\r')
            't' -> sb.append('\t')
            'u' -> {
              if (i + 4 > s.length) fail("bad \\u escape")
              sb.append(s.substring(i, i + 4).toInt(16).toChar())
              i += 4
            }
            else -> fail("bad escape '\\$e'")
          }
        }
        else -> sb.append(c)
      }
    }
  }

  private fun num(): Double {
    val start = i
    if (s[i] == '-') i++
    while (i < s.length && (s[i].isDigit() || s[i] == '.' || s[i] == 'e' || s[i] == 'E' || s[i] == '+' || s[i] == '-')) i++
    return s.substring(start, i).toDoubleOrNull() ?: fail("bad number")
  }
}

private fun writeJSON(out: StringBuilder, value: Any?, indent: Int, depth: Int) {
  fun newline(d: Int) {
    if (indent > 0) {
      out.append('\n')
      repeat(indent * d) { out.append(' ') }
    }
  }
  when (value) {
    null, JSONAbsent -> out.append("null")
    is Boolean -> out.append(value)
    is Double ->
      if (value.isNaN() || value.isInfinite()) {
        out.append("null")
      } else if (value == Math.rint(value) && Math.abs(value) < 1e21) {
        out.append(value.toLong())
      } else {
        out.append(value)
      }
    is Number -> writeJSON(out, value.toDouble(), indent, depth)
    is String -> {
      out.append('"')
      for (c in value) {
        when (c) {
          '"' -> out.append("\\\"")
          '\\' -> out.append("\\\\")
          '\n' -> out.append("\\n")
          '\r' -> out.append("\\r")
          '\t' -> out.append("\\t")
          '\b' -> out.append("\\b")
          '\u000C' -> out.append("\\f")
          else -> if (c < ' ') out.append(String.format("\\u%04x", c.code)) else out.append(c)
        }
      }
      out.append('"')
    }
    is List<*> -> {
      out.append('[')
      value.forEachIndexed { n, item ->
        if (n > 0) out.append(',')
        newline(depth + 1)
        writeJSON(out, item, indent, depth + 1)
      }
      if (value.isNotEmpty()) newline(depth)
      out.append(']')
    }
    is Map<*, *> -> {
      out.append('{')
      var n = 0
      for ((k, v) in value) {
        if (v === JSONAbsent) continue
        if (n++ > 0) out.append(',')
        newline(depth + 1)
        writeJSON(out, k.toString(), indent, depth + 1)
        out.append(if (indent > 0) ": " else ":")
        writeJSON(out, v, indent, depth + 1)
      }
      if (n > 0) newline(depth)
      out.append('}')
    }
    else -> writeJSON(out, value.toString(), indent, depth)
  }
}

// ---- Core --------------------------------------------------------------------------------

internal fun graphemes(s: String): List<String> = s.characters()

/** UTF-16 offsets, as the TypeScript runtime's (`-1` when absent). */
internal fun indexOf(s: String, sub: String, from: Long): Long = s.indexOf(sub, from.toInt()).toLong()

internal fun lastIndexOf(s: String, sub: String): Long = s.lastIndexOf(sub).toLong()

internal fun replaceAll(s: String, target: String, replacement: String): String = s.replace(target, replacement)

/** JavaScript's `padStart`: `pad` repeated, cut to fit. */
internal fun padStart(s: String, length: Long, pad: String): String {
  val missing = length.toInt() - s.length
  if (missing <= 0 || pad.isEmpty()) return s
  return pad.repeat(missing / pad.length + 1).take(missing) + s
}

internal fun padEnd(s: String, length: Long, pad: String): String {
  val missing = length.toInt() - s.length
  if (missing <= 0 || pad.isEmpty()) return s
  return s + pad.repeat(missing / pad.length + 1).take(missing)
}

internal fun repeatString(s: String, count: Long): String = s.repeat(count.toInt().coerceAtLeast(0))

/** `-1`, `0` or `1`, by the locale's collation (the device's when `locale` is empty). */
internal fun compareStrings(a: String, b: String, locale: String): Long {
  val l = if (locale.isEmpty()) java.util.Locale.getDefault() else java.util.Locale.forLanguageTag(locale)
  return Integer.signum(java.text.Collator.getInstance(l).compare(a, b)).toLong()
}

internal fun trimStart(s: String): String = s.trimStart()

internal fun trimEnd(s: String): String = s.trimEnd()

/** A stable sort by `before` (Swift's `sorted(by:)`). */
internal fun <T> sortedBy(xs: List<T>, before: (T, T) -> Boolean): List<T> =
  xs.sortedWith { a, b -> if (before(a, b)) -1 else if (before(b, a)) 1 else 0 }

internal fun uniqueStrings(xs: List<String>): List<String> = xs.distinct()

internal fun arrayOfRange(from: Long, to: Long, step: Long): List<Long> {
  if (step == 0L) return emptyList()
  val out = ArrayList<Long>()
  var x = from
  if (step > 0) while (x < to) { out.add(x); x += step } else while (x > to) { out.add(x); x += step }
  return out
}

internal fun <T> setOf(xs: List<T>): Set<T> = LinkedHashSet(xs)

internal fun <T> setValues(s: Set<T>): List<T> = s.toList()

internal fun <T> setUnion(a: Set<T>, b: Set<T>): Set<T> = LinkedHashSet(a).apply { addAll(b) }

internal fun <T> setIntersection(a: Set<T>, b: Set<T>): Set<T> = a.filterTo(LinkedHashSet()) { it in b }

internal fun <T> setSubtracting(a: Set<T>, b: Set<T>): Set<T> = a.filterTo(LinkedHashSet()) { it !in b }

/** What a thrown value says: a Bloom value's `message` field, or its text. */
internal fun errorMessage(error: Throwable): String {
  val value = (error as? BloomError)?.value ?: return error.message ?: error.toString()
  return when (value) {
    is DecodingError -> value.message
    is RuntimeError -> value.message
    else -> value.toString()
  }
}

// ---- Result ------------------------------------------------------------------------------

/** Bloom's `Result<Success, Failure>`: `.ok(value)` or `.err(error)` (not Kotlin's `Result`). */
sealed interface BloomResult<out Success, out Failure> {
  data class Ok<out Success>(val value: Success) : BloomResult<Success, Nothing>

  data class Err<out Failure>(val error: Failure) : BloomResult<Nothing, Failure>
}

/** The success value, or none. */
fun <S, F> BloomResult<S, F>.ok(): S? = (this as? BloomResult.Ok)?.value

/** The error, or none. */
fun <S, F> BloomResult<S, F>.err(): F? = (this as? BloomResult.Err)?.error

// ---- URL ---------------------------------------------------------------------------------

/**
 * `text` as an absolute URL (resolved against `base` when given), or none: what the
 * TypeScript runtime's WHATWG `URL` reads of it. The host is lowercased, an `http(s)` URL with
 * no path has `/`, and a default port is dropped.
 */
internal fun parseURL(text: String, base: String): URLParts? {
  val uri =
    runCatching {
        val u = java.net.URI(text.trim())
        if (base.isNotEmpty() && !u.isAbsolute) java.net.URI(base).resolve(u) else u
      }
      .getOrNull() ?: return null
  if (!uri.isAbsolute) return null
  val scheme = uri.scheme.lowercase()
  val host = (uri.host ?: "").lowercase()
  val defaultPort = when (scheme) { "http", "ws" -> 80; "https", "wss" -> 443; else -> -1 }
  val port = if (uri.port == -1 || uri.port == defaultPort) "" else uri.port.toString()
  val special = scheme in setOf("http", "https", "ws", "wss", "ftp", "file")
  val path = (uri.rawPath ?: uri.rawSchemeSpecificPart ?: "").ifEmpty { if (special) "/" else "" }
  val query = uri.rawQuery ?: ""
  val fragment = uri.rawFragment ?: ""
  val authority = if (uri.rawAuthority != null || special) "//" + (uri.rawUserInfo?.let { "$it@" } ?: "") + host + (if (port.isEmpty()) "" else ":$port") else ""
  val href = "$scheme:$authority$path" + (if (query.isEmpty()) "" else "?$query") + (if (fragment.isEmpty()) "" else "#$fragment")
  return URLParts(href, scheme, host, port, path, query, fragment)
}

/** JavaScript's `encodeURIComponent`. */
internal fun encodeComponent(s: String): String =
  java.net.URLEncoder.encode(s, "UTF-8")
    .replace("+", "%20")
    .replace("%21", "!")
    .replace("%27", "'")
    .replace("%28", "(")
    .replace("%29", ")")
    .replace("%7E", "~")

/** JavaScript's `decodeURIComponent` (a `+` stays a `+`). */
internal fun decodeComponent(s: String): String =
  runCatching { java.net.URLDecoder.decode(s.replace("+", "%2B"), "UTF-8") }.getOrDefault(s)

// ---- lenient reads (stdlib JSON's `string`, `number`, `int`, `bool`, `array`, `object`) ----

internal fun jsonAsString(value: JSONValue): String? = value as? String

internal fun jsonAsNumber(value: JSONValue): Double? = (value as? Double)?.takeIf { it.isFinite() }

/** A number with no fraction, within `Int`'s exact range (2^53, as the TypeScript runtime's). */
internal fun jsonAsInt(value: JSONValue): Long? {
  val d = value as? Double ?: return null
  if (!d.isFinite() || d != Math.floor(d) || Math.abs(d) > 9007199254740991.0) return null
  return d.toLong()
}

internal fun jsonAsBool(value: JSONValue): Boolean? = value as? Boolean

@Suppress("UNCHECKED_CAST")
internal fun jsonAsArray(value: JSONValue): List<JSONValue>? = value as? List<JSONValue>

@Suppress("UNCHECKED_CAST")
internal fun jsonAsObject(value: JSONValue): Map<String, JSONValue>? = value as? Map<String, JSONValue>

/**
 * The value an error was thrown with (`error.jsValue`): a `BloomError`'s, else none. On the JVM a
 * thrown value is a `Throwable`; only a Bloom `throw` of a value carries one.
 */
internal fun errorValue(error: Throwable): JSONValue? = (error as? BloomError)?.value

/** A JS `Error` (`JSError.cast`): the JVM's throwable as one, by its class name and message. */
internal fun jsErrorFrom(error: Throwable): JSError? =
  JSError(error::class.simpleName ?: "Error", error.message ?: "", error.stackTraceToString())
