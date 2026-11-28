package so.oxy.bloom.glassmenu.field

import android.graphics.RectF
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.sqrt

// One shape of the field (a rounded rect) or several blended into one (GlassShapes): the distance and gradient at a
// point, sampled into [distance], [gradientX] and [gradientY].
class RoundedUnion {
  private val shapes = Array(GlassShapes.Capacity) { RoundedField() }
  private var count = 0
  private var blend = 0f
  val bounds = RectF()
  var distance = 0f
    private set
  var gradientX = 0f
    private set
  var gradientY = 0f
    private set

  fun set(rect: RectF, radiusX: Float, radiusY: Float) {
    shapes[0].set(rect, radiusX, radiusY)
    count = 1
    bounds.set(rect)
  }

  fun set(members: GlassShapes) {
    count = members.count
    blend = members.blend
    for (index in 0 until count) shapes[index].set(members.rects[index], members.radii[index], members.radii[index])
    members.bounds(bounds)
  }

  fun sample(x: Float, y: Float) {
    val first = shapes[0]
    distance = first.distance(x, y)
    first.gradient(x, y)
    gradientX = first.gradientX
    gradientY = first.gradientY
    for (index in 1 until count) {
      val shape = shapes[index]
      val d = shape.distance(x, y)
      shape.gradient(x, y)
      blendWith(d, shape.gradientX, shape.gradientY, blend)
    }
    // Several shapes: a unit normal where they meet, as the shader's (liquidMemberField).
    if (count > 1) {
      val length = sqrt(gradientX * gradientX + gradientY * gradientY)
      if (length > 0.000001f) {
        gradientX /= length
        gradientY /= length
      }
    }
  }

  // The smooth union of this sample with another shape's, within [smoothing] px: the closer two surfaces face each
  // other, the more they flow together (none where their normals agree).
  fun blendWith(b: Float, bx: Float, by: Float, smoothing: Float) {
    val a = distance
    val ax = gradientX
    val ay = gradientY
    if (abs(a - b) >= smoothing) {
      val first = a <= b
      distance = min(a, b)
      gradientX = if (first) ax else bx
      gradientY = if (first) ay else by
      return
    }
    val alignment = ax * bx + ay * by
    val radius = smoothing * (0.5f - 0.5f * alignment).coerceIn(0f, 1f)
    val weight = if (radius <= 0.000001f) {
      if (a <= b) 0f else 1f
    } else {
      (0.5f + 0.5f * (a - b) / radius).coerceIn(0f, 1f)
    }
    distance = a + (b - a) * weight - radius * weight * (1f - weight)
    gradientX = ax + (bx - ax) * weight
    gradientY = ay + (by - ay) * weight
  }
}
