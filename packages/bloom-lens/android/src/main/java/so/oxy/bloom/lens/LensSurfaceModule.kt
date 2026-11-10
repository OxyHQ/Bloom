package so.oxy.bloom.lens

import android.graphics.Color
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LensSurfaceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BloomLensSurface")

    View(LensSurfaceView::class) {
      Prop("tint") { view: LensSurfaceView, tint: Color? -> view.tint = tint?.toArgb() ?: android.graphics.Color.TRANSPARENT }
      Prop("tintOpacity") { view: LensSurfaceView, value: Float? -> view.tintOpacity = value ?: 0.96f }
      Prop("radius") { view: LensSurfaceView, value: Float? -> view.radiusDp = value ?: -1f }
      Prop("dark") { view: LensSurfaceView, value: Boolean? -> view.dark = value ?: true }
      Prop("page") { view: LensSurfaceView, value: Color? -> view.page = value?.toArgb() ?: android.graphics.Color.BLACK }
    }
  }
}
