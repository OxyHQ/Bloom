package so.oxy.bloom.glassmenu.motion

import android.graphics.RectF

internal class GlassMorphFrame {
  val bounds = RectF()
  var radiusX = 0f
  var radiusY = 0f
  var contentProgress = 0f
  var rowsOpacity = 0f
  val sourceLobe = RectF()
  var sourceRadius = 0f
  var smoothing = 0f
  var sourceOpacity = 1f
  var sourceBlur = 0f
  var sourceZoom = 1f
  var contentBlur = 0f
  var contentZoom = 1f
  var portalBlur = 0f
  var lensHeight = 0f
  var lensAmount = 0f
}
