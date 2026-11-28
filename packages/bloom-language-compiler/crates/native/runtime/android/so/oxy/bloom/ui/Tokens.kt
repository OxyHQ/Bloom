// BloomUI's token types for Compose that are not values: edges, alignments, control sizes and
// styles. The values (space, corner, sizes, the type ramp, colour roles, tones and every
// preset's palette) are generated from the spec and Bloom's colour engine into
// BloomTheme.generated.kt; none is typed here.
@file:Suppress("EnumEntryName")

package so.oxy.bloom.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import bloom.bloomthemeengine.colorengine.SeedThemeOptions
import bloom.bloomthemeengine.colorengine.seedTokens
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp

/** A frame's length relative to its parent: `full` fills it, `auto` is the content's own. */
object Length {
  val full: Dp = Dp.Infinity
  val auto: Dp = Dp.Unspecified
}

enum class Edge { all, horizontal, vertical, top, bottom, leading, trailing }

/** A VStack's alignment of its children across. */
enum class HAlign { leading, center, trailing, start, end, stretch }

/** An HStack's alignment of its children across. */
enum class VAlign { top, center, bottom, start, end, baseline }

enum class ControlSize { xs, sm, md, lg }

enum class ButtonStyle { solid, subtle, outline, plain, glass, glassProminent }

enum class ContentFit { cover, contain, fill, none, scaleDown }

/** Bloom's default preset, the one an app draws with before it chooses. */
const val DEFAULT_PRESET = "oxy"

private val LocalPalette = staticCompositionLocalOf<BloomPalette?> { null }

/** Whether the theme in scope is dark (its material's edge is the dark one). */
val LocalDark = staticCompositionLocalOf { false }

/** The theme in scope: the palette every colour role reads. */
object BloomTheme {
  val palette: BloomPalette
    @Composable @ReadOnlyComposable get() = LocalPalette.current ?: defaultPalette(isSystemInDarkTheme())

  private val light by lazy { requireNotNull(BloomPresets.palette(DEFAULT_PRESET, dark = false)) }
  private val dark by lazy { requireNotNull(BloomPresets.palette(DEFAULT_PRESET, dark = true)) }

  internal fun defaultPalette(isDark: Boolean): BloomPalette = if (isDark) dark else light
}

/**
 * `BloomThemeProvider(preset:)`: the subtree draws with a preset's palette, in the system's
 * scheme unless `dark` says. A colour scope (`ColorScope`) is the same provider, nested.
 */
@Composable
fun BloomThemeProvider(
  preset: String = DEFAULT_PRESET,
  dark: Boolean = isSystemInDarkTheme(),
  colors: Map<String, Long>? = null,
  seed: String? = null,
  secondarySeed: String? = null,
  tertiarySeed: String? = null,
  content: @Composable () -> Unit,
) {
  val preset0 = BloomPresets.palette(preset, dark) ?: BloomTheme.defaultPalette(dark)
  // A seed's theme (a colour the person picked, an ambient accent), resolved on the device by
  // Bloom's colour engine, the one the TypeScript engine's goldens hold.
  val base = if (seed == null) preset0 else remember(preset0, seed, secondarySeed, tertiarySeed, dark) {
    preset0.with(seedPaletteColors(seed, dark, secondarySeed, tertiarySeed))
  }
  // A theme resolved elsewhere (an island's host app: its accents, seed or ambient colour) wins
  // over the preset's own colours, token by token.
  val palette = if (colors.isNullOrEmpty()) base else remember(base, colors) { base.with(colors) }
  CompositionLocalProvider(
    LocalPalette provides palette,
    LocalDark provides dark,
    LocalThemeColors provides (colors ?: emptyMap()),
    // `backing`: the surface fill the host draws the island on (its `useSurfaceFill()`), what a
    // lens in the island's page samples.
    LocalBacking provides colors?.get("backing")?.let { Color(it) },
    content = content,
  )
}


/**
 * A seed's palette colours by field name (`--primary-foreground` → `primaryForeground`), from the
 * colour engine's `seedTokens` (`packages/bloom-theme-engine`, `SeedTheme.bloom`).
 */
fun seedPaletteColors(seed: String, dark: Boolean, secondarySeed: String? = null, tertiarySeed: String? = null): Map<String, Long> {
  val tokens: Map<String, String> = seedTokens(
    SeedThemeOptions(
      seed = seed,
      isDark = dark,
      secondarySeed = secondarySeed,
      tertiarySeed = tertiarySeed,
    ),
  )
  val out = HashMap<String, Long>()
  for ((token, value) in tokens) {
    val argb = parseCssColor(value) ?: continue
    val name = token.removePrefix("--").split('-').mapIndexed { i, part ->
      if (i == 0) part else part.replaceFirstChar { it.uppercase() }
    }.joinToString("")
    out[name] = argb
  }
  return out
}

/**
 * The colours a host app handed over beyond the palette's tokens, by name: what its theme
 * resolves that the palette has no field for (an avatar's tints, `avatarBlue`, …, and `backing`,
 * the surface fill the island is drawn on).
 */
val LocalThemeColors = staticCompositionLocalOf<Map<String, Long>> { emptyMap() }

/**
 * A theme's colours as React Native's Bloom hands them over (`useColorTokens()`: `background` to
 * `#fff8f6`, `rgb(255 248 246)`, `rgba(…)`), as ARGB by field name. A value it cannot read is left
 * out, so the preset's colour stays.
 */
fun parseThemeColors(json: String?): Map<String, Long>? {
  if (json.isNullOrBlank()) return null
  val obj = try { org.json.JSONObject(json) } catch (_: org.json.JSONException) { return null }
  val out = HashMap<String, Long>()
  for (name in obj.keys()) {
    val argb = parseCssColor(obj.optString(name)) ?: continue
    out[name] = argb
  }
  return out
}

/** `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(r g b)`, `rgb(r g b / a)`, `rgb(r, g, b)` and `rgba(r, g, b, a)`. */
internal fun parseCssColor(text: String): Long? {
  val t = text.trim().lowercase()
  if (t.startsWith("#")) {
    val hex = t.substring(1)
    val full = when (hex.length) {
      3 -> hex.map { "$it$it" }.joinToString("") + "ff"
      6 -> hex + "ff"
      8 -> hex
      else -> return null
    }
    val v = full.toLongOrNull(16) ?: return null
    val rgb = v ushr 8
    val a = v and 0xff
    return (a shl 24) or rgb
  }
  val open = t.indexOf('(')
  if (open < 0 || !t.endsWith(")") || !t.startsWith("rgb")) return null
  val parts = t.substring(open + 1, t.length - 1).replace("/", " ").replace(",", " ").split(' ').filter { it.isNotEmpty() }
  if (parts.size < 3) return null
  fun channel(p: String): Long? =
    if (p.endsWith("%")) p.dropLast(1).toDoubleOrNull()?.let { Math.round(it * 2.55).toLong() } else p.toDoubleOrNull()?.let { Math.round(it).toLong() }
  val r = channel(parts[0]) ?: return null
  val g = channel(parts[1]) ?: return null
  val b = channel(parts[2]) ?: return null
  val a = parts.getOrNull(3)?.let { p ->
    if (p.endsWith("%")) p.dropLast(1).toDoubleOrNull()?.div(100.0) else p.toDoubleOrNull()
  } ?: 1.0
  val alpha = Math.round(a.coerceIn(0.0, 1.0) * 255).toLong()
  return (alpha shl 24) or (r.coerceIn(0, 255) shl 16) or (g.coerceIn(0, 255) shl 8) or b.coerceIn(0, 255)
}
