// BloomUI's universal modifiers for Compose: `.padding`, `.frame`, `.background`, `.corner`…
// as `Modifier` extensions. Bloom's chain wraps outward and Compose's runs inward, so the
// emitter writes them in reverse order.
package so.oxy.bloom.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp

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

fun Modifier.bloomFrame(width: Dp? = null, height: Dp? = null): Modifier {
  var m = this
  if (width != null) m = if (width == Dp.Infinity) m.fillMaxWidth() else if (width != Dp.Unspecified) m.width(width) else m
  if (height != null) m = if (height == Dp.Infinity) m.fillMaxHeight() else if (height != Dp.Unspecified) m.height(height) else m
  return m
}

fun Modifier.bloomBackground(color: Color): Modifier = background(color)

fun Modifier.bloomCorner(radius: Dp): Modifier = clip(RoundedCornerShape(radius))

fun Modifier.bloomOpacity(value: Double): Modifier = alpha(value.toFloat())

fun Modifier.bloomAspectRatio(ratio: Double): Modifier = aspectRatio(ratio.toFloat())

fun Modifier.bloomOnPress(action: () -> Unit): Modifier = clickable(onClick = action)

/** Bloom's inherited `.disabled()`: a subtree's controls stop taking input. */
val LocalDisabled = androidx.compose.runtime.compositionLocalOf { false }

/** The built-in environment values (`@Environment(\.disabled)`). */
object Environment {
  val disabled: Boolean
    @androidx.compose.runtime.Composable get() = LocalDisabled.current
}
