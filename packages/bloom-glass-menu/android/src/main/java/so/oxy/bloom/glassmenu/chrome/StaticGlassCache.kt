package so.oxy.bloom.glassmenu.chrome

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorSpace
import android.graphics.PixelFormat
import android.graphics.PorterDuff
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.os.Build

// A rasterized copy of the static glass of the chrome (the bar container and the create circle), in a hardware buffer.
// While the pill is dragged the static glass is drawn from this texture instead of being recorded every frame: the
// glass keeps its material (the texture is the output of the same GlassRenderer draw), and only the pill is live.
// It is rendered again only when its key changes (size, backdrop version, search progress, inset): never per frame.
internal class StaticGlassCache {
  private var reader: ImageReader? = null
  private var image: android.media.Image? = null
  private var textureBitmap: Bitmap? = null
  val bitmap: Bitmap? get() = textureBitmap
  private var width = 0
  private var height = 0
  var key: String? = null
    private set

  val isSupported: Boolean get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q

  // Renders [draw] into a hardware buffer of width x height px. Returns the wrapped bitmap, or null if unsupported.
  fun render(newKey: String, w: Int, h: Int, draw: (Canvas) -> Unit): Bitmap? {
    if (!isSupported || w <= 0 || h <= 0) return null
    if (w != width || h != height || reader == null) {
      release()
      reader = ImageReader.newInstance(
        w, h, PixelFormat.RGBA_8888, 2,
        HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE or HardwareBuffer.USAGE_GPU_COLOR_OUTPUT,
      )
      width = w
      height = h
    }
    val surface = reader?.surface ?: return null
    val canvas = surface.lockHardwareCanvas() ?: return null
    try {
      canvas.drawColor(0, PorterDuff.Mode.CLEAR)
      draw(canvas)
    } finally {
      surface.unlockCanvasAndPost(canvas)
    }
    val next = reader?.acquireLatestImage() ?: return bitmap
    val buffer = next.hardwareBuffer
    if (buffer == null) {
      next.close()
      return textureBitmap
    }
    val wrapped = Bitmap.wrapHardwareBuffer(buffer, ColorSpace.get(ColorSpace.Named.SRGB))
    buffer.close()
    image?.close()
    image = next
    textureBitmap = wrapped
    key = newKey
    return wrapped
  }

  fun release() {
    textureBitmap = null
    image?.close()
    image = null
    reader?.close()
    reader = null
    width = 0
    height = 0
    key = null
  }
}
