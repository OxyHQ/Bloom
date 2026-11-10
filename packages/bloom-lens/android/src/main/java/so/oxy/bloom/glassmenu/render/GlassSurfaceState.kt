package so.oxy.bloom.glassmenu.render

import android.graphics.RectF
import so.oxy.bloom.glassmenu.records.GlassMenuConfigRecord
import so.oxy.bloom.glassmenu.records.GlassTriggerConfigRecord

internal class GlassSurfaceState {
  val incoming = RectF()
  val captureBounds = RectF()
  var lockedFieldStep = 0f
  var radiusX = 0f
  var radiusY = 0f
  val source = RectF()
  var hasSource = false
  var sourceRadius = 0f
  var smoothing = 0f
  var lensHeight = 0f
  var lensAmount = 0f
  var materialProgress = 0f
  var surfaceOpacity = 1f
  var dark = true
  var pressX = 0f
  var pressY = 0f
  var pressRadius = 1f
  var poolGain = 0f
  var pressLift = 0f
  var rimLift = 0f
  var refractionScale = 1f
  var config = GlassMenuConfigRecord()
  var trigger = GlassTriggerConfigRecord()
}
