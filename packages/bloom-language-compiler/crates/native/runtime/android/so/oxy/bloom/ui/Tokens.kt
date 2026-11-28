// BloomUI's token types for Compose that are not values: edges, alignments, control sizes and
// styles. The values (space, corner, sizes, the type ramp, colour roles, tones and every
// preset's palette) are generated from the spec and Bloom's colour engine into
// BloomTheme.generated.kt; none is typed here.
@file:Suppress("EnumEntryName")

package so.oxy.bloom.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
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
fun BloomThemeProvider(preset: String = DEFAULT_PRESET, dark: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
  val palette = BloomPresets.palette(preset, dark) ?: BloomTheme.defaultPalette(dark)
  CompositionLocalProvider(LocalPalette provides palette, LocalDark provides dark, content = content)
}
