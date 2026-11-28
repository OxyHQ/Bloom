package so.oxy.bloom.glassmenu.field

import android.graphics.RectF
import kotlin.math.min

// A glass that is several shapes (a group of glasses on one base): each shape's rect and corner radius, in the
// surface's pixels, blended into one another within [blend] px (a smooth union: shapes closer than it flow together,
// and 0 joins them only where they overlap). Empty, the glass is its one rect, as every glass but a group's is.
class GlassShapes {
  val rects = Array(Capacity) { RectF() }
  val radii = FloatArray(Capacity)
  var count = 0
    private set
  var blend = 0f

  fun clear() {
    count = 0
  }

  // A shape; its radius is capped at a capsule's. Shapes past Capacity are not drawn.
  fun add(rect: RectF, radius: Float) {
    if (count == Capacity) return
    rects[count].set(rect)
    radii[count] = min(radius, min(rect.width(), rect.height()) / 2f)
    count += 1
  }

  fun bounds(out: RectF) {
    out.setEmpty()
    for (index in 0 until count) out.union(rects[index])
  }

  companion object {
    // The shader's: its first shape and seven more (GlassShaders, MemberCapacity).
    const val Capacity = 8
  }
}
