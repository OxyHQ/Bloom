package so.oxy.bloom.glassmenu.render

import android.graphics.Bitmap
import android.graphics.ColorSpace
import android.graphics.HardwareRenderer
import android.graphics.PixelFormat
import android.graphics.RecordingCanvas
import android.graphics.RenderNode
import android.hardware.HardwareBuffer
import android.media.Image
import android.media.ImageReader
import android.os.Handler
import android.os.Looper

// Glass drawn once into a hardware buffer, by a renderer of its own, and drawn from then on as a bitmap: no layer is
// kept for it in the window, and nothing in it is rendered again while what it shows stays the same. The same pixels
// as a live drawing: the same nodes, on the same RenderThread, at whole pixels. The bitmap arrives on the main thread,
// after the render, in [ready]; until then the caller draws live.
internal class GlassStill(val width: Int, val height: Int, private val ready: (Bitmap) -> Unit) :
  ImageReader.OnImageAvailableListener {
  private val reader = ImageReader.newInstance(
    width, height, PixelFormat.RGBA_8888, 2,
    HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE or HardwareBuffer.USAGE_GPU_COLOR_OUTPUT,
  )
  private val root = RenderNode("GlassStill")
  private val renderer = HardwareRenderer()
  private var image: Image? = null
  private var bitmap: Bitmap? = null

  init {
    reader.setOnImageAvailableListener(this, Handler(Looper.getMainLooper()))
    root.setPosition(0, 0, width, height)
    renderer.setSurface(reader.surface)
    renderer.setContentRoot(root)
    renderer.isOpaque = false
  }

  // Renders what [record] draws, in the still's pixels.
  fun render(record: (RecordingCanvas) -> Unit) {
    val canvas = root.beginRecording(width, height)
    try {
      record(canvas)
    } finally {
      root.endRecording()
    }
    renderer.createRenderRequest().syncAndDraw()
  }

  override fun onImageAvailable(source: ImageReader) {
    val next = try { source.acquireNextImage() } catch (_: IllegalStateException) { null } ?: return
    val buffer = next.hardwareBuffer
    val bitmap = buffer?.let { Bitmap.wrapHardwareBuffer(it, ColorSpace.get(ColorSpace.Named.SRGB)) }
    buffer?.close()
    if (bitmap == null) {
      next.close()
      return
    }
    // The previous image is closed only now: its bitmap is not drawn once the next one is handed over.
    this.bitmap?.recycle()
    image?.close()
    image = next
    this.bitmap = bitmap
    ready(bitmap)
  }

  // Released once nothing records the bitmap any more: its buffer is freed now, not when the bitmap is collected (a
  // frame already recorded holds its own image of it).
  fun release() {
    renderer.destroy()
    bitmap?.recycle()
    bitmap = null
    reader.close()
    image = null
    root.discardDisplayList()
  }
}

// Stills shared by what they show: every trigger that rests with the same look (a feed's ⋯ on every row) draws the one
// bitmap of that look, so the glass at rest costs one texture per look, not a layer per trigger.
internal object SharedStills {
  private class Entry(width: Int, height: Int, record: (RecordingCanvas) -> Unit) {
    var bitmap: Bitmap? = null
    var users = 0
    val waiting = ArrayList<java.lang.ref.WeakReference<android.view.View>>()
    val still = GlassStill(width, height) { arrived ->
      bitmap = arrived
      for (view in waiting) view.get()?.invalidate()
      waiting.clear()
    }.also { it.render(record) }
  }

  private val entries = HashMap<Any, Entry>()

  // One more user of [look]; the first one renders it with [record], at [width] x [height] px.
  fun acquire(look: Any, width: Int, height: Int, record: (RecordingCanvas) -> Unit) {
    entries.getOrPut(look) { Entry(width, height, record) }.users += 1
  }

  fun release(look: Any) {
    val entry = entries[look] ?: return
    entry.users -= 1
    if (entry.users <= 0) {
      entries.remove(look)
      entry.still.release()
    }
  }

  // The bitmap of [look], or null until it has arrived (then [view] is invalidated).
  fun bitmap(look: Any, view: android.view.View): Bitmap? {
    val entry = entries[look] ?: return null
    entry.bitmap?.let { return it }
    entry.waiting.add(java.lang.ref.WeakReference(view))
    return null
  }
}
