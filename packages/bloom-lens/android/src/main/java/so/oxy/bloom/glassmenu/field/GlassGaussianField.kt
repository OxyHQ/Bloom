package so.oxy.bloom.glassmenu.field

import android.graphics.RectF
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.exp
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

internal class GlassGaussianField(private val minimumStep: Float) {
  var originX = 0f
    private set
  var originY = 0f
    private set
  var step = 1f
    private set
  var width = 0
    private set
  var height = 0
    private set
  var rgba = FloatArray(0)
    private set
  var generation = 0L
    private set

  private var raw = FloatArray(0)
  private var horizontal = FloatArray(0)
  private val weights = FloatArray(17)
  private val incoming = RoundedField()
  private val outgoing = RoundedField()
  private var hasOutgoing = false
  private var blend = 0f

  fun update(
    incomingRect: RectF, radiusX: Float, radiusY: Float,
    outgoingRect: RectF?, outgoingRadius: Float, smoothing: Float, lockedStep: Float = 0f,
  ): Boolean {
    val sigma = max(smoothing, 0f)
    if (sigma <= 0.000001f) return false
    var left = incomingRect.left
    var top = incomingRect.top
    var right = incomingRect.right
    var bottom = incomingRect.bottom
    if (outgoingRect != null) {
      left = min(left, outgoingRect.left)
      top = min(top, outgoingRect.top)
      right = max(right, outgoingRect.right)
      bottom = max(bottom, outgoingRect.bottom)
    }
    val grow = if (outgoingRect != null) sigma * 0.25f * max(radiusX, radiusY) / max(min(radiusX, radiusY), 0.01f) else 0f
    left -= grow
    top -= grow
    right += grow
    bottom += grow
    step = if (lockedStep > 0f) {
      max(lockedStep, minimumStep)
    } else {
      max(max(minimumStep, sigma / 4f), max(right - left, bottom - top) / MaximumCells)
    }
    val localSigma = sigma / step
    val maximumRadius = min(ceil(localSigma * 4f).toInt(), weights.lastIndex)
    var sum = 0f
    for (index in 0..maximumRadius) {
      val value = exp(-index * index / (2f * localSigma * localSigma))
      weights[index] = value
      sum += if (index == 0) value else value * 2f
    }
    for (index in 0..maximumRadius) weights[index] /= sum
    var radius = maximumRadius
    while (radius > 0 && weights[radius] < 0.002f) radius--
    if (radius == 0) return false
    sum = weights[0]
    for (index in 1..radius) sum += weights[index] * 2f
    for (index in 0..radius) weights[index] /= sum

    incoming.set(incomingRect, radiusX, radiusY)
    hasOutgoing = outgoingRect != null
    if (outgoingRect != null) outgoing.set(outgoingRect, outgoingRadius, outgoingRadius)
    blend = sigma
    originX = floor(left / step) * step - step
    originY = floor(top / step) * step - step
    width = max(2, ceil((right - originX) / step).toInt() + 2)
    height = max(2, ceil((bottom - originY) / step).toInt() + 2)
    val paddedWidth = width + radius * 2
    val paddedHeight = height + radius * 2
    if (rgba.size < width * height * 4) rgba = FloatArray(width * height * 4 + 4096)
    if (raw.size < paddedWidth * paddedHeight * 3) raw = FloatArray(paddedWidth * paddedHeight * 3 + 4096)
    if (horizontal.size < width * paddedHeight * 3) horizontal = FloatArray(width * paddedHeight * 3 + 4096)

    for (row in 0 until paddedHeight) {
      val y = originY + (row - radius) * step
      for (column in 0 until paddedWidth) {
        sample(originX + (column - radius) * step, y, (row * paddedWidth + column) * 3)
      }
    }
    for (row in 0 until paddedHeight) {
      for (column in 0 until width) {
        val center = (row * paddedWidth + column + radius) * 3
        var distance = raw[center] * weights[0]
        var nx = raw[center + 1] * weights[0]
        var ny = raw[center + 2] * weights[0]
        for (offset in 1..radius) {
          val a = center - offset * 3
          val b = center + offset * 3
          val weight = weights[offset]
          distance += (raw[a] + raw[b]) * weight
          nx += (raw[a + 1] + raw[b + 1]) * weight
          ny += (raw[a + 2] + raw[b + 2]) * weight
        }
        val output = (row * width + column) * 3
        horizontal[output] = distance
        horizontal[output + 1] = nx
        horizontal[output + 2] = ny
      }
    }
    for (row in 0 until height) {
      for (column in 0 until width) {
        val center = ((row + radius) * width + column) * 3
        var distance = horizontal[center] * weights[0]
        var nx = horizontal[center + 1] * weights[0]
        var ny = horizontal[center + 2] * weights[0]
        for (offset in 1..radius) {
          val a = center - offset * width * 3
          val b = center + offset * width * 3
          val weight = weights[offset]
          distance += (horizontal[a] + horizontal[b]) * weight
          nx += (horizontal[a + 1] + horizontal[b + 1]) * weight
          ny += (horizontal[a + 2] + horizontal[b + 2]) * weight
        }
        val length = sqrt(nx * nx + ny * ny)
        val output = (row * width + column) * 4
        rgba[output] = distance
        rgba[output + 1] = if (length > 0.000001f) nx / length else 0f
        rgba[output + 2] = if (length > 0.000001f) ny / length else 0f
        rgba[output + 3] = 1f
      }
    }
    generation++
    return true
  }

  private companion object {
    const val MaximumCells = 64f
  }

  private fun sample(x: Float, y: Float, index: Int) {
    val a = incoming.distance(x, y)
    incoming.gradient(x, y)
    val ax = incoming.gradientX
    val ay = incoming.gradientY
    if (!hasOutgoing) {
      raw[index] = a
      raw[index + 1] = ax
      raw[index + 2] = ay
      return
    }
    val b = outgoing.distance(x, y)
    outgoing.gradient(x, y)
    val bx = outgoing.gradientX
    val by = outgoing.gradientY
    if (abs(a - b) >= blend) {
      val first = a <= b
      raw[index] = min(a, b)
      raw[index + 1] = if (first) ax else bx
      raw[index + 2] = if (first) ay else by
      return
    }
    val alignment = ax * bx + ay * by
    val radius = blend * (0.5f - 0.5f * alignment).coerceIn(0f, 1f)
    val weight = if (radius <= 0.000001f) {
      if (a <= b) 0f else 1f
    } else {
      (0.5f + 0.5f * (a - b) / radius).coerceIn(0f, 1f)
    }
    raw[index] = a + (b - a) * weight - radius * weight * (1f - weight)
    raw[index + 1] = ax + (bx - ax) * weight
    raw[index + 2] = ay + (by - ay) * weight
  }
}
