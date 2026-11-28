// BloomUI's universal modifiers for Compose: `.padding`, `.frame`, `.background`, `.corner`…
// as `Modifier` extensions. Bloom's chain wraps outward and Compose's runs inward, so the
// emitter writes them in reverse order.
package so.oxy.bloom.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

fun Modifier.bloomPadding(edge: Edge, value: Dp): Modifier = when (edge) {
  Edge.all -> padding(value)
  Edge.horizontal -> padding(horizontal = value)
  Edge.vertical -> padding(vertical = value)
  Edge.top -> padding(top = value)
  Edge.bottom -> padding(bottom = value)
  Edge.leading -> padding(start = value)
  Edge.trailing -> padding(end = value)
}

fun Modifier.bloomPadding(value: Dp): Modifier = padding(value)

/** Points the view computes as it renders (`.padding(.top, inset)`). */
fun Modifier.bloomPadding(edge: Edge, value: Double): Modifier = bloomPadding(edge, value.dp)

fun Modifier.bloomPadding(value: Double): Modifier = padding(value.dp)

/** A length: a token (`Dp`, `Length.full`) or points computed as the view renders. */
private fun length(value: Any?): Dp? = when (value) {
  null -> null
  is Dp -> value
  is Double -> value.dp
  is Long -> value.toInt().dp
  is Int -> value.dp
  is Float -> value.dp
  else -> null
}

/**
 * `.frame(width:height:minWidth:maxWidth:minHeight:maxHeight:)`: each a token or points.
 * `Length.full` fills the parent; `Length.auto` is the content's own.
 */
fun Modifier.bloomFrame(
  width: Any? = null,
  height: Any? = null,
  minWidth: Any? = null,
  maxWidth: Any? = null,
  minHeight: Any? = null,
  maxHeight: Any? = null,
): Modifier {
  var m = this
  val w = length(width)
  val h = length(height)
  if (minWidth != null || maxWidth != null) {
    m = m.widthIn(min = length(minWidth) ?: Dp.Unspecified, max = length(maxWidth) ?: Dp.Unspecified)
  }
  if (minHeight != null || maxHeight != null) {
    m = m.heightIn(min = length(minHeight) ?: Dp.Unspecified, max = length(maxHeight) ?: Dp.Unspecified)
  }
  if (w != null) m = if (w == Dp.Infinity) m.fillMaxWidth() else if (w != Dp.Unspecified) m.width(w) else m
  if (h != null) m = if (h == Dp.Infinity) m.fillMaxHeight() else if (h != Dp.Unspecified) m.height(h) else m
  return m
}

/** `.offset(x:y:)`: drawn shifted, its siblings keep their places. */
fun Modifier.bloomOffset(x: Any? = null, y: Any? = null): Modifier =
  offset(x = length(x) ?: 0.dp, y = length(y) ?: 0.dp)

/** A border's edge: every side, or one. */
enum class BorderEdge { all, top, bottom, leading, trailing, left, right }

/**
 * `.border(color, width, edge)`: on every side, rounded as the view's `.corner` (`corner`, which
 * the emitter passes when the view has one), or a line along one side, drawn behind the content.
 */
fun Modifier.bloomBorder(color: Color, width: Dp = Dp.Hairline, edge: BorderEdge = BorderEdge.all, corner: Dp = 0.dp): Modifier {
  if (edge == BorderEdge.all) return border(width, color, RoundedCornerShape(corner))
  return drawBehind {
    val stroke = if (width == Dp.Hairline) 1f else width.toPx()
    val half = stroke / 2
    val rtl = layoutDirection == androidx.compose.ui.unit.LayoutDirection.Rtl
    when (edge) {
      BorderEdge.top -> drawLine(color, Offset(0f, half), Offset(size.width, half), stroke)
      BorderEdge.bottom -> drawLine(color, Offset(0f, size.height - half), Offset(size.width, size.height - half), stroke)
      BorderEdge.left -> drawLine(color, Offset(half, 0f), Offset(half, size.height), stroke)
      BorderEdge.right -> drawLine(color, Offset(size.width - half, 0f), Offset(size.width - half, size.height), stroke)
      BorderEdge.leading -> {
        val x = if (rtl) size.width - half else half
        drawLine(color, Offset(x, 0f), Offset(x, size.height), stroke)
      }
      BorderEdge.trailing -> {
        val x = if (rtl) half else size.width - half
        drawLine(color, Offset(x, 0f), Offset(x, size.height), stroke)
      }
      BorderEdge.all -> Unit
    }
  }
}

fun Modifier.bloomBackground(color: Color): Modifier = background(color)

fun Modifier.bloomCorner(radius: Dp): Modifier = clip(RoundedCornerShape(radius))

fun Modifier.bloomOpacity(value: Double): Modifier = alpha(value.toFloat())

fun Modifier.bloomAspectRatio(ratio: Double): Modifier = aspectRatio(ratio.toFloat())

/** `.onPress { }`: a tap, with no ripple (Bloom's press feedback is the node's own). */
fun Modifier.bloomOnPress(action: () -> Unit): Modifier =
  clickable(interactionSource = null, indication = null, onClick = action)

/** Bloom's inherited `.disabled()`: a subtree's controls stop taking input. */
val LocalDisabled = androidx.compose.runtime.compositionLocalOf { false }

/** The built-in environment values (`@Environment(\.disabled)`). */
object Environment {
  val disabled: Boolean
    @androidx.compose.runtime.Composable get() = LocalDisabled.current
}
