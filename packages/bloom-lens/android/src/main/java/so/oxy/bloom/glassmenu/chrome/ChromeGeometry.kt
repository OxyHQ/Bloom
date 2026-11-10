package so.oxy.bloom.glassmenu.chrome

import kotlin.math.max
import kotlin.math.min

// Mirrors modules/glass-menu-android/src/components/chrome/compositor-geometry.ts. Same constants, same
// formulas, dp units. The view scales its canvas by the display density, so these values are drawn in dp.
internal data class ChromeShape(
  val id: String,
  val group: String,
  val x0: Float,
  val y0: Float,
  val x1: Float,
  val y1: Float,
  val radius: Float,
)

internal data class ChromeLayer(val key: String, val x: Float, val y: Float, val width: Float, val height: Float)

internal object ChromeGeometry {
  const val TAB_HEIGHT = 64f
  const val REST_GAP = 16f
  const val SIDE_MARGIN = 16f
  const val MAX_WIDTH = 360f
  const val BOTTOM = 24f
  const val FAB_SIZE = 56f
  const val FAB_GAP = 16f
  const val MERGE_RADIUS = 12f
  const val SMOOTH_BLEND = MERGE_RADIUS
  const val PILL_INSET = 4f
  const val LAYER_PAD = MERGE_RADIUS
  const val MAX_SHADER_SHAPES = 8
  const val FIELD_SIDE = 16f
  const val FIELD_ICON = 18f
  const val FIELD_GAP = 8f

  fun tabBarWidth(windowWidth: Float): Float = min(windowWidth - 2f * SIDE_MARGIN, MAX_WIDTH)

  // Same as tabBarShapes in compositor-geometry.ts. p in [0, 1]: search morph progress.
  fun tabBarShapes(windowWidth: Float, windowHeight: Float, bottomInset: Float, p: Float): List<ChromeShape> {
    val width = tabBarWidth(windowWidth)
    val left = (windowWidth - width) / 2f
    val top = windowHeight - bottomInset - BOTTOM - TAB_HEIGHT
    val h = TAB_HEIGHT
    val radius = h / 2f
    val capsuleRight = left + (width - h - REST_GAP) + REST_GAP * p
    val circleLeft = left + width - h
    val fabRadius = (FAB_SIZE / 2f) * max(0f, 1f - p)
    val fabCx = left + width - FAB_SIZE / 2f
    val fabCy = top - FAB_GAP - FAB_SIZE / 2f
    return listOf(
      ChromeShape("tabs", "bar", left, top, capsuleRight, top + h, radius),
      ChromeShape("search", "bar", circleLeft, top, left + width, top + h, radius),
      ChromeShape("fab", "fab", fabCx - fabRadius, fabCy - fabRadius, fabCx + fabRadius, fabCy + fabRadius, fabRadius),
    )
  }

  // Width of one tab slot inside the capsule at rest (same as itemWidth in ios-tab-bar-view.web.tsx).
  fun itemWidth(windowWidth: Float, itemCount: Int): Float {
    val restCapsule = tabBarWidth(windowWidth) - TAB_HEIGHT - REST_GAP
    return (restCapsule - 2f * PILL_INSET) / itemCount
  }

  // Layer rectangle from the members' bounds plus the pad (same as layerFor in ios-tab-bar-view.web.tsx).
  fun layerFor(key: String, shapes: List<ChromeShape>): ChromeLayer {
    val members = shapes.filter { it.group == key }
    val x0 = members.minOf { it.x0 }
    val y0 = members.minOf { it.y0 }
    val x1 = members.maxOf { it.x1 }
    val y1 = members.maxOf { it.y1 }
    return ChromeLayer(key, x0 - LAYER_PAD, y0 - LAYER_PAD, x1 - x0 + 2f * LAYER_PAD, y1 - y0 + 2f * LAYER_PAD)
  }
}
