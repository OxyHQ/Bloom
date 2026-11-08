package so.oxy.bloom

import kotlin.math.ceil
import kotlin.math.exp
import kotlin.math.roundToInt

/** Separable Gaussian on premultiplied channels, only for one-shot software snapshots. */
internal fun blurSnapshotPixels(input: IntArray, width: Int, height: Int, sigma: Float): IntArray {
  if (sigma <= 0f) return input.copyOf()
  val radius = ceil(3f * sigma).toInt()
  val kernel = FloatArray(radius * 2 + 1) { index ->
    val distance = (index - radius).toFloat()
    exp(-distance * distance / (2f * sigma * sigma))
  }
  val total = kernel.sum()
  for (i in kernel.indices) kernel[i] /= total
  val source = FloatArray(input.size * 4)
  for (i in input.indices) {
    val color = input[i]
    val alpha = (color ushr 24).toFloat()
    source[i * 4] = alpha
    source[i * 4 + 1] = ((color ushr 16) and 255) * alpha / 255f
    source[i * 4 + 2] = ((color ushr 8) and 255) * alpha / 255f
    source[i * 4 + 3] = (color and 255) * alpha / 255f
  }
  val horizontal = FloatArray(source.size)
  val output = FloatArray(source.size)
  for (y in 0 until height) for (x in 0 until width) {
    val at = (y * width + x) * 4
    for (k in kernel.indices) {
      val nx = x + k - radius
      if (nx in 0 until width) for (c in 0..3)
        horizontal[at + c] += source[(y * width + nx) * 4 + c] * kernel[k]
    }
  }
  for (y in 0 until height) for (x in 0 until width) {
    val at = (y * width + x) * 4
    for (k in kernel.indices) {
      val ny = y + k - radius
      if (ny in 0 until height) for (c in 0..3)
        output[at + c] += horizontal[(ny * width + x) * 4 + c] * kernel[k]
    }
  }
  return IntArray(input.size) { i ->
    val at = i * 4
    val alpha = output[at]
    val a = alpha.roundToInt().coerceIn(0, 255)
    if (a == 0) 0 else {
      fun channel(c: Int) = (output[at + c] * 255f / alpha).roundToInt().coerceIn(0, 255)
      (a shl 24) or (channel(1) shl 16) or (channel(2) shl 8) or channel(3)
    }
  }
}
