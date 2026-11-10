package so.oxy.bloom.lens

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.min

// The material under a control, drawn inside the page from the shared texture (LensSurfaceCache).
// It has no children and takes no touches: the control above it handles the press.
class LensSurfaceView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val density = resources.displayMetrics.density
  var tint: Int = Color.TRANSPARENT
    set(value) { field = value; invalidate() }
  var tintOpacity: Float = 0.96f
    set(value) { field = value; invalidate() }
  var radiusDp: Float = -1f
    set(value) { field = value; invalidate() }
  var dark: Boolean = true
    set(value) { field = value; invalidate() }
  var page: Int = Color.BLACK
    set(value) { field = value; invalidate() }

  init {
    setWillNotDraw(false)
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    invalidate()
  }

  override fun onDraw(canvas: Canvas) {
    val capsule = min(width, height) / 2f
    val radius = if (radiusDp < 0f) capsule else min(radiusDp * density, capsule)
    val bitmap = LensSurfaceCache.bitmap(
      LensSurfaceSpec(width, height, radius, tint, tintOpacity, dark, page, density),
    )
    if (bitmap == null) {
      // The engine hands the rendered texture over asynchronously: ask again next frame, a few times.
      if (LensSurfaceCache.supported() && attempts++ < MAX_ATTEMPTS) postInvalidateOnAnimation()
      return
    }
    attempts = 0
    canvas.drawBitmap(bitmap, 0f, 0f, null)
  }

  private var attempts = 0

  private companion object {
    const val MAX_ATTEMPTS = 8
  }
}
