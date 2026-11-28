package so.oxy.bloom.ui

import android.graphics.RectF
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.innerShadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import so.oxy.bloom.glassmenu.motion.GlassJelly
import so.oxy.bloom.glassmenu.overlay.GlassFeedback

/**
 * `.glass(value)`: the material a glass value names (`regular`, the default, or `clear`), a tint
 * (a colour role at a glass opacity), dimmed, and interactive (it answers a press). The language's
 * `GlassValue` (spec `glassValue`).
 */
@Immutable
data class GlassValue(
  val material: GlassMaterial = GlassMaterial.regular,
  val tint: Color? = null,
  val tintOpacity: GlassOpacity? = null,
  val dimmed: Boolean = false,
  val interactive: Boolean = false,
) {
  fun tint(color: Color, opacity: GlassOpacity? = null): GlassValue = copy(tint = color, tintOpacity = opacity)

  fun dimmed(): GlassValue = copy(dimmed = true)

  fun interactive(on: Boolean = true): GlassValue = copy(interactive = on)

  companion object {
    val regular = GlassValue()
    val clear = GlassValue(GlassMaterial.clear)
  }
}

/**
 * BloomMaterial: the ONE material of the native runtime. Every surface (`.glass()`, `.blur()`, a
 * button's glass styles, a grouped section's card) draws through it, and no other file of the
 * runtime blurs, stretches or vibrates (`tests/material_gate.rs`).
 *
 * In the page it is Bloom's Surface as Android draws it today (ADR 0003; the surface material
 * study's `tint` rendition): an opaque body, then the native edge, a 1px rim line at the top and
 * the bottom and the sheen's two inset glows, the numbers Surface writes as React Native
 * `boxShadow`s (`MaterialEdges`, generated from `src/surface/native-edge.ts`). A pressable surface
 * answers with the lens engine's jelly (bloom-lens `GlassJelly`: the swell, and the stretch and
 * lean toward the finger) and its haptic tick (`GlassFeedback`), the motion of Bloom's lens
 * controls.
 */
fun Modifier.bloomMaterial(
  shape: Shape,
  fill: Color?,
  sheen: Boolean = true,
  rim: Boolean = true,
  pressable: Boolean = false,
): Modifier = composed {
  val edge = if (LocalDark.current) MaterialEdges.dark else MaterialEdges.light
  val jelly = if (pressable) rememberMaterialPress() else null
  var m: Modifier = this
  if (jelly != null) m = m.then(jelly.modifier)
  if (fill != null) m = m.background(fill, shape)
  if (rim) {
    val line = Color.White.copy(alpha = edge.rimLine)
    m = m
      .innerShadow(shape, Shadow(radius = 0.dp, color = line, offset = DpOffset(0.dp, 1.dp)))
      .innerShadow(shape, Shadow(radius = 0.dp, color = line, offset = DpOffset(0.dp, (-1).dp)))
  }
  if (sheen) {
    val glow = Color.White.copy(alpha = edge.sheenGain)
    val blur = edge.sheenBlur.dp
    // `inset 0 ±reach blur -blur`: the glow along the top and the bottom edges.
    for (sign in intArrayOf(1, -1)) {
      m = m.innerShadow(
        shape,
        Shadow(radius = blur, color = glow, spread = -blur, offset = DpOffset(0.dp, (edge.sheenReach * sign).dp)),
      )
    }
  }
  m
}

/**
 * `.glass(value)`: a glass value's material. Regular glass paints the edge's sheen over the
 * surface in scope (its own body only when tinted); clear glass paints the surface fill at its
 * opacity, with no sheen. `.dimmed()` darkens the body as Apple's dimming layer does.
 */
fun Modifier.bloomGlass(value: GlassValue = GlassValue.regular, corner: Dp = Dp.Infinity): Modifier = composed {
  val material = value.material
  val opacity = (value.tintOpacity ?: material.tintOpacity)?.value
  val fill = when {
    value.tint != null -> value.tint.copy(alpha = opacity ?: value.tint.alpha)
    material.fillsSurface -> Colors.surface.copy(alpha = opacity ?: 1f)
    else -> Colors.surface
  }
  val body = if (value.dimmed) dim(fill) else fill
  bloomMaterial(materialShape(corner), body, sheen = material.sheen, pressable = value.interactive)
}

/**
 * `.blur()`: the view floats over the content as an island (Bloom's `BlurIsland`): the material's
 * body over the floating level's fill, a capsule unless a `corner` names its radius.
 */
fun Modifier.bloomBlur(corner: Dp = Dp.Infinity): Modifier = composed {
  bloomMaterial(materialShape(corner), Colors.popover)
}

/** A capsule (`Dp.Infinity`) or a rounded rectangle. */
fun materialShape(corner: Dp): Shape = if (corner == Dp.Infinity) RoundedCornerShape(50) else RoundedCornerShape(corner)

/** `.dimmed()`: the glass's body under Apple's dimming layer (35% black, `GlassOpacity.dim`). */
private fun dim(color: Color): Color {
  val a = GlassOpacity.dim.value
  return Color(
    red = color.red * (1f - a),
    green = color.green * (1f - a),
    blue = color.blue * (1f - a),
    alpha = color.alpha + (1f - color.alpha) * a,
  )
}

/** A surface's press: the engine's jelly, run each frame while it moves, and the press's haptic. */
private class MaterialPress(val modifier: Modifier)

@Composable
private fun rememberMaterialPress(): MaterialPress {
  val view = LocalView.current
  val density = LocalDensity.current.density
  val jelly = remember { GlassJelly() }
  var frame by remember { mutableIntStateOf(0) }
  var moving by remember { mutableIntStateOf(0) }
  LaunchedEffect(moving) {
    if (moving == 0) return@LaunchedEffect
    var last = 0L
    while (true) {
      val now = withFrameNanos { it }
      if (last != 0L) jelly.advance(((now - last) / 1e9f).coerceAtMost(1f / 30f))
      last = now
      frame++
      if (jelly.isSettled) break
    }
  }
  val rect = remember { RectF() }
  val modifier = Modifier
    .pointerInput(Unit) {
      awaitEachGesture {
        val down = awaitFirstDown(requireUnconsumed = false)
        jelly.down(down.position.x, down.position.y)
        GlassFeedback.tick(view)
        moving++
        while (true) {
          val event = awaitPointerEvent()
          val change = event.changes.firstOrNull { it.id == down.id } ?: break
          if (!change.pressed) break
          jelly.move(change.position.x, change.position.y)
        }
        jelly.release()
        moving++
      }
    }
    .graphicsLayer {
      // Read each frame of the jelly: the layer is drawn again, never measured again.
      frame.let { }
      val w = size.width
      val h = size.height
      if (w <= 0f || h <= 0f) return@graphicsLayer
      rect.set(0f, 0f, w, h)
      jelly.deformControl(rect, density, 1f)
      scaleX = rect.width() / w
      scaleY = rect.height() / h
      translationX = rect.centerX() - w / 2f
      translationY = rect.centerY() - h / 2f
      transformOrigin = TransformOrigin.Center
    }
  return remember(modifier) { MaterialPress(modifier) }
}
