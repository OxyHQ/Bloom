// BloomUI's tokens for Compose: the language's scales (packages/bloom-language/spec/
// language.json) as Kotlin constants. A real backend generates this file from the spec, as
// crates/lang/src/swift_tokens.generated.rs is generated for the TypeScript emitter.
@file:Suppress("ObjectPropertyName", "EnumEntryName")

package so.oxy.bloom.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

object Space {
  val none: Dp = 0.dp
  val _2xs: Dp = 2.dp
  val xs: Dp = 4.dp
  val sm: Dp = 8.dp
  val md: Dp = 12.dp
  val lg: Dp = 16.dp
  val xl: Dp = 20.dp
  val _2xl: Dp = 24.dp
  val _3xl: Dp = 32.dp
  val _4xl: Dp = 40.dp
  val _5xl: Dp = 60.dp
}

object Corner {
  val none: Dp = 0.dp
  val _2xs: Dp = 2.dp
  val xs: Dp = 4.dp
  val sm: Dp = 8.dp
  val md: Dp = 12.dp
  val lg: Dp = 16.dp
  val xl: Dp = 20.dp
  val _2xl: Dp = 24.dp
  val _3xl: Dp = 28.dp
  val full: Dp = 9999.dp
}

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

enum class AvatarSize(val dp: Dp) { xs(20.dp), sm(24.dp), md(32.dp), lg(36.dp), xl(40.dp) }

enum class IconSize(val dp: Dp) { _2xs(8.dp), xs(12.dp), sm(16.dp), md(20.dp), lg(24.dp), xl(28.dp), _2xl(32.dp), _3xl(48.dp) }

enum class ContentFit { cover, contain, fill, none, scaleDown }

/** The type ramp: [fontSize, lineHeight, tracking, weight] as the spec's `typeRamp`. */
object Font {
  private fun ramp(size: Int, line: Int, tracking: Double, weight: Int) =
    TextStyle(fontSize = size.sp, lineHeight = line.sp, letterSpacing = (tracking / size).em, fontWeight = FontWeight(weight))

  val largeTitle = ramp(64, 80, 0.0, 700)
  val title1 = ramp(24, 34, 0.0, 700)
  val title2 = ramp(20, 26, 0.0, 700)
  val title3 = ramp(18, 24, 0.0, 600)
  val headline = ramp(16, 22, 0.0, 600)
  val body = ramp(14, 20, 0.0, 400)
  val body2 = ramp(13, 18, 0.0, 400)
  val caption1 = ramp(12, 16, 0.15, 400)
  val caption2 = ramp(11, 15, 0.2, 400)
  val md = ramp(15, 20, 0.0, 400)
}

/** The colour roles, light theme (Bloom's default seed). */
object Colors {
  val foreground = Color(0xFF0F1419)
  val muted = Color(0xFF536471)
  val textTertiary = Color(0xFF8B98A5)
  val primary = Color(0xFF1D9BF0)
  val onPrimary = Color(0xFFFFFFFF)
  val background = Color(0xFFFFFFFF)
  val surface = Color(0xFFF7F9F9)
  val card = Color(0xFFFFFFFF)
  val border = Color(0xFFEFF3F4)
  val mutedFill = Color(0xFFEFF3F4)
  val success = Color(0xFF00BA7C)
  val warning = Color(0xFFFFAD1F)
  val error = Color(0xFFF91880)
  val info = Color(0xFF1D9BF0)
  val white = Color(0xFFFFFFFF)
  val black = Color(0xFF000000)
  val transparent = Color(0x00000000)
}

/** A control's tone (`.tint`): its colour. */
enum class Tone(val color: Color) {
  primary(Colors.primary), vivid(Colors.primary), secondary(Colors.muted), tertiary(Colors.textTertiary),
  success(Colors.success), warning(Colors.warning), error(Colors.error), info(Colors.info),
  neutral(Colors.foreground), accent(Colors.primary), danger(Colors.error),
}
