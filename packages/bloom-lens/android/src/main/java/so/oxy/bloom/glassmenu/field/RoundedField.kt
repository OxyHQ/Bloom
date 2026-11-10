package so.oxy.bloom.glassmenu.field

import android.graphics.RectF
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

internal class RoundedField {
  private var centerX = 0f
  private var centerY = 0f
  private var inverseAxisX = 1f
  private var inverseAxisY = 1f
  private var halfWidth = 0f
  private var halfHeight = 0f
  private var radius = 0f
  private var expandedRadius = 0f
  private var curvatureX = 0f
  private var curvatureY = 0f
  private var baseRadius = 0f
  private var circular = false
  var gradientX = 0f
    private set
  var gradientY = 0f
    private set

  fun set(bounds: RectF, radiusXIn: Float, radiusYIn: Float) {
    centerX = bounds.centerX()
    centerY = bounds.centerY()
    val rx = max(radiusXIn, 0.01f)
    val ry = max(radiusYIn, 0.01f)
    radius = min(rx, ry)
    inverseAxisX = radius / rx
    inverseAxisY = radius / ry
    halfWidth = bounds.width() / 2f * inverseAxisX
    halfHeight = bounds.height() / 2f * inverseAxisY
    expandedRadius = radius * CornerExpansion
    curvatureX = (2.8915570351735034f - 1.4457785175867517f * (halfWidth * 2f) / expandedRadius).coerceIn(0f, 1f)
    curvatureY = (2.8915570351735034f - 1.4457785175867517f * (halfHeight * 2f) / expandedRadius).coerceIn(0f, 1f)
    baseRadius = radius * (CornerExpansion - CornerAdjustment * max(curvatureX, curvatureY))
    circular = curvatureX == 1f && curvatureY == 1f
  }

  fun distance(x: Float, y: Float): Float {
    val qx = abs((x - centerX) * inverseAxisX) - halfWidth
    val qy = abs((y - centerY) * inverseAxisY) - halfHeight
    val circularX = qx + baseRadius
    val circularY = qy + baseRadius
    val interior = min(max(circularX, circularY), 0f)
    if (circular) {
      val dx = max(circularX, 0f)
      val dy = max(circularY, 0f)
      return interior + sqrt(dx * dx + dy * dy) - radius
    }
    val ux = (qx + expandedRadius) / expandedRadius
    val uy = (qy + expandedRadius) / expandedRadius
    val zx = max(ux, 0f)
    val zy = max(uy, 0f)
    val maximum = max(zx, zy)
    val t = if (maximum > 0f) min(zx, zy) / maximum else 0f
    val length = sqrt(zx * zx + zy * zy)
    val polynomial = ((((-0.9260540008544922f * t + 3.1560099124908447f) * t -
      3.6412200927734375f) * t + 1.268030047416687f) * t + 0.2685309946537018f) * t * t
    val continuous = length + 1f - 1f / (1f - polynomial * min(length, 1f))
    val ax = max(CornerExpansion * ux - CornerAdjustment, 0f)
    val ay = max(CornerExpansion * uy - CornerAdjustment, 0f)
    val correction = 0.3458344340324402f - continuous + 0.6541655659675598f * sqrt(ax * ax + ay * ay)
    val weight = ((if (zx < zy) 1f else -1f) * (t - 1f) + 0.5f).coerceIn(0f, 1f)
    val corner = continuous - 1f + correction * (curvatureX + (curvatureY - curvatureX) * weight)
    return interior + expandedRadius * corner
  }

  fun gradient(x: Float, y: Float) {
    val localX = (x - centerX) * inverseAxisX
    val localY = (y - centerY) * inverseAxisY
    val qx = abs(localX) - halfWidth + baseRadius
    val qy = abs(localY) - halfHeight + baseRadius
    var nx = max(qx, 0f)
    var ny = max(qy, 0f)
    val cornerLength = sqrt(nx * nx + ny * ny)
    if (cornerLength > 0.000001f) {
      nx /= cornerLength
      ny /= cornerLength
    } else if (qx > qy) {
      nx = 1f
      ny = 0f
    } else {
      nx = 0f
      ny = 1f
    }
    if (localX < 0f) nx = -nx
    if (localY < 0f) ny = -ny
    var ovalX = localX
    var ovalY = localY * halfWidth / max(halfHeight, 0.000001f)
    val ovalLength = sqrt(ovalX * ovalX + ovalY * ovalY)
    if (ovalLength > 0.000001f) {
      ovalX /= ovalLength
      ovalY /= ovalLength
    } else {
      ovalX = nx
      ovalY = ny
    }
    nx += ovalX
    ny += ovalY
    val length = sqrt(nx * nx + ny * ny)
    if (length <= 0.000001f) {
      gradientX = 0f
      gradientY = 0f
      return
    }
    gradientX = nx / length * inverseAxisX
    gradientY = ny / length * inverseAxisY
  }

  private companion object {
    const val CornerExpansion = 1.5286649465560913f
    const val CornerAdjustment = 0.5286649465560913f
  }
}
