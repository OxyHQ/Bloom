package so.oxy.bloom.glassmenu.field

import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.ColorSpace
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import android.util.Half
import androidx.annotation.RequiresApi
import java.nio.ByteBuffer
import java.nio.ByteOrder

@RequiresApi(Build.VERSION_CODES.TIRAMISU)
internal class GlassFieldTexture {
  private class Buffer(val bitmap: Bitmap) {
    val shader = BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP).apply {
      filterMode = BitmapShader.FILTER_MODE_LINEAR
    }
  }

  private val buffers = ArrayList<Buffer>(RingSize)
  private var slot = -1
  private var current: Buffer? = null
  private var field: GlassGaussianField? = null
  private var generation = Long.MIN_VALUE
  private var upload: ByteBuffer? = null
  private val empty = BitmapShader(Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888), Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)

  fun preallocate() {
    while (buffers.size < RingSize) buffers.add(createBuffer(PreparedSize, PreparedSize))
    if (upload == null) {
      upload = ByteBuffer.allocateDirect(buffers[0].bitmap.byteCount).order(ByteOrder.nativeOrder())
    }
  }

  private fun createBuffer(width: Int, height: Int): Buffer = Buffer(
    Bitmap.createBitmap(
      width, height, Bitmap.Config.RGBA_F16, false,
      ColorSpace.get(ColorSpace.Named.LINEAR_EXTENDED_SRGB),
    ).apply { isPremultiplied = false },
  )

  fun update(value: GlassGaussianField?) {
    field = value
    if (value == null) {
      current = null
      generation = Long.MIN_VALUE
      return
    }
    if (generation == value.generation) return
    generation = value.generation
    slot = (slot + 1) % RingSize
    var buffer = buffers.getOrNull(slot)
    if (buffer == null || buffer.bitmap.width < value.width || buffer.bitmap.height < value.height) {
      buffer = createBuffer((value.width + 63) / 64 * 64, (value.height + 63) / 64 * 64)
      if (slot < buffers.size) buffers[slot] = buffer else buffers.add(buffer)
    }
    current = buffer
    val size = buffer.bitmap.byteCount
    val bytes = upload?.takeIf { it.capacity() >= size }
      ?: ByteBuffer.allocateDirect(size).order(ByteOrder.nativeOrder()).also { upload = it }
    bytes.clear()
    val stride = buffer.bitmap.rowBytes
    val source = value.rgba
    for (row in 0 until value.height) {
      bytes.position(row * stride)
      val start = row * value.width * 4
      for (index in start until start + value.width * 4) bytes.putShort(Half.toHalf(source[index]))
    }
    bytes.rewind()
    buffer.bitmap.copyPixelsFromBuffer(bytes)
  }

  fun bindPrepared(shader: RuntimeShader) {
    shader.setInputBuffer("smoothedField", buffers[0].shader)
    shader.setFloatUniform("smoothedFieldEnabled", 1f)
    shader.setFloatUniform("fieldCoordinateScale", 1f, 1f)
    shader.setFloatUniform("fieldCoordinateOffset", .5f, .5f)
    shader.setFloatUniform("fieldExtent", PreparedSize.toFloat(), PreparedSize.toFloat())
  }

  fun bind(shader: RuntimeShader) {
    val value = field
    val input = if (value != null) current?.shader else null
    shader.setInputBuffer("smoothedField", input ?: empty)
    shader.setFloatUniform("smoothedFieldEnabled", if (input != null) 1f else 0f)
    val step = value?.step ?: 1f
    shader.setFloatUniform("fieldCoordinateScale", 1f / step, 1f / step)
    shader.setFloatUniform(
      "fieldCoordinateOffset",
      -(value?.originX ?: 0f) / step + 0.5f,
      -(value?.originY ?: 0f) / step + 0.5f,
    )
    shader.setFloatUniform("fieldExtent", (value?.width ?: 1).toFloat(), (value?.height ?: 1).toFloat())
  }

  private companion object {
    const val RingSize = 4
    const val PreparedSize = 128
  }
}
