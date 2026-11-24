package so.oxy.bloom.glassmenu.render

import android.graphics.Bitmap
import android.graphics.ColorSpace
import android.graphics.HardwareBufferRenderer
import android.graphics.HardwareRenderer
import android.graphics.PixelFormat
import android.graphics.RecordingCanvas
import android.graphics.RenderNode
import android.hardware.HardwareBuffer
import android.media.Image
import android.media.ImageReader
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.annotation.RequiresApi
import java.util.concurrent.Executor
import java.util.concurrent.Executors

// Glass drawn once into a hardware buffer, by a renderer of its own, and drawn from then on as a bitmap: no layer is
// kept for it in the window, and nothing in it is rendered again while what it shows stays the same. The same pixels
// as a live drawing: the same nodes, on the same RenderThread, at whole pixels. The bitmap arrives on the main thread,
// after the render, in [ready]; until then the caller draws live.
//
// On Android 14 and later the still is one buffer drawn by a HardwareBufferRenderer, with no surface. A renderer that
// draws to a surface (Android 13: an ImageReader's) lets go of it by waiting, on RenderThread, until the GPU has
// finished everything queued (Vulkan's destroySurface waits for the queue to go idle): a still let go as a menu
// closed held RenderThread 7 to 20 ms while the window's frames waited for buffers behind it.
internal class GlassStill(val width: Int, val height: Int, private val ready: (Bitmap) -> Unit) {
  private val root = RenderNode("GlassStill")
  private val target: Target =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) BufferTarget() else ReaderTarget()

  init {
    root.setPosition(0, 0, width, height)
  }

  // Renders what [record] draws, in the still's pixels.
  fun render(record: (RecordingCanvas) -> Unit) {
    val canvas = root.beginRecording(width, height)
    try {
      record(canvas)
    } finally {
      root.endRecording()
    }
    target.draw()
  }

  // Released once nothing records the bitmap any more: its buffer is freed now, not when the bitmap is collected (a
  // frame already recorded holds its own image of it).
  fun release() {
    target.release()
    root.discardDisplayList()
  }

  private interface Target {
    fun draw()
    fun release()
  }

  // One buffer, drawn with no surface; the bitmap is handed over once the GPU has finished drawing it.
  @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  private inner class BufferTarget : Target {
    private val buffer = HardwareBuffer.create(
      width, height, HardwareBuffer.RGBA_8888, 1,
      HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE or HardwareBuffer.USAGE_GPU_COLOR_OUTPUT,
    )
    private val renderer = HardwareBufferRenderer(buffer).also { it.setContentRoot(root) }
    private var bitmap: Bitmap? = null
    private var released = false

    override fun draw() {
      renderer.obtainRenderRequest().setColorSpace(SRGB).draw(fences) { result ->
        if (result.status != HardwareBufferRenderer.RenderResult.SUCCESS) return@draw
        result.fence.awaitForever()
        main.post {
          if (released) return@post
          val next = Bitmap.wrapHardwareBuffer(buffer, SRGB) ?: return@post
          bitmap?.recycle()
          bitmap = next
          ready(next)
        }
      }
    }

    override fun release() {
      released = true
      renderer.close()
      bitmap?.recycle()
      bitmap = null
      buffer.close()
    }
  }

  // Android 13: an ImageReader's surface, drawn by a HardwareRenderer.
  private inner class ReaderTarget : Target, ImageReader.OnImageAvailableListener {
    private val reader = ImageReader.newInstance(
      width, height, PixelFormat.RGBA_8888, 2,
      HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE or HardwareBuffer.USAGE_GPU_COLOR_OUTPUT,
    )
    private val renderer = HardwareRenderer()
    private var image: Image? = null
    private var bitmap: Bitmap? = null

    init {
      reader.setOnImageAvailableListener(this, main)
      renderer.setSurface(reader.surface)
      renderer.setContentRoot(root)
      renderer.isOpaque = false
    }

    override fun draw() {
      renderer.createRenderRequest().syncAndDraw()
    }

    override fun onImageAvailable(source: ImageReader) {
      val next = try { source.acquireNextImage() } catch (_: IllegalStateException) { null } ?: return
      val buffer = next.hardwareBuffer
      val bitmap = buffer?.let { Bitmap.wrapHardwareBuffer(it, SRGB) }
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

    override fun release() {
      renderer.destroy()
      bitmap?.recycle()
      bitmap = null
      reader.close()
      image = null
    }
  }

  private companion object {
    val SRGB: ColorSpace = ColorSpace.get(ColorSpace.Named.SRGB)
    val main = Handler(Looper.getMainLooper())
    // Waits for each still's GPU fence off the main thread: one thread for every still in the process.
    val fences: Executor by lazy {
      Executors.newSingleThreadExecutor { Thread(it, "GlassStill.fence").apply { isDaemon = true } }
    }
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
