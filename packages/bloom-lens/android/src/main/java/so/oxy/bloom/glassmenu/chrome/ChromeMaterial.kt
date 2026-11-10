package so.oxy.bloom.glassmenu.chrome

import so.oxy.bloom.glassmenu.records.GlassMenuConfigRecord
import so.oxy.bloom.glassmenu.records.GlassTriggerConfigRecord
import so.oxy.bloom.glassmenu.motion.GlassJelly
import so.oxy.bloom.glassmenu.render.GlassSurfaceState
import android.graphics.RectF
import so.oxy.bloom.glassmenu.GlassMenuAndroidView

// The ONE material configuration of the chrome (Android twin of chrome-material.web.ts). Every chrome surface
// (tab bar, search circle, create circle, headers, toolbars, circular buttons) goes through apply(): the menu's
// material (same records, same recipes, same shadow and rim) with refraction zeroed. The menu is not changed.
internal object ChromeMaterial {
  // Multiplies the menu's refraction in GlassRenderer.drawGlass. 0 = no lens, no outer displacement (option B).
  const val REFRACTION_SCALE = 0f

  // Magnification of the content under the selection lens (convex centre). Same value as chrome-material.web.ts.
  const val PILL_MAGNIFY = 1.12f

  // Refraction band of the selection lens (dp): the rim only. Same value as chrome-material.web.ts.
  const val PILL_LENS_BAND = 6f

  fun apply(state: GlassSurfaceState) {
    state.config = GlassMenuConfigRecord()
    state.trigger = GlassTriggerConfigRecord()
    state.dark = true
    state.refractionScale = REFRACTION_SCALE
    state.lensHeight = 0f
    state.lensAmount = 0f
    state.materialProgress = 1f
    state.surfaceOpacity = 1f
    state.pressX = 0f
    state.pressY = 0f
    state.poolGain = 0f
    state.pressLift = 0f
    state.rimLift = 0f
  }
}

// The selection pill: the same material as the menu's resting trigger (the "Prueba" button): the same records
// (GlassMenuConfigRecord and GlassTriggerConfigRecord defaults, which are the ones GlassMenuAndroidView uses unless the
// app sets them), the same recipe, and the same light as GlassMenuAndroidView.applyLight with the pill's jelly and rect.
// Refraction is on (refractionScale 1). The state is the one GlassMenuOverlay.drawRestingAnchor uses.
// `pill` is the pill rectangle in dp; ox and oy are the chrome's window offset in px.
internal fun ChromeMaterial.applyPill(
  state: GlassSurfaceState,
  jelly: GlassJelly,
  pill: RectF,
  ox: Float,
  oy: Float,
  density: Float,
) {
  state.config = GlassMenuConfigRecord()
  state.trigger = GlassTriggerConfigRecord()
  state.dark = true
  state.refractionScale = 1f
  state.magnify = PILL_MAGNIFY
  state.lensBand = PILL_LENS_BAND
  state.hasSource = false
  state.smoothing = 0f
  state.lensHeight = 0f
  state.lensAmount = 0f
  state.materialProgress = 0f
  state.surfaceOpacity = 1f
  // applyLight(state, origin, opacity = 1) of GlassMenuAndroidView, with the pill's jelly. The jelly works in dp here,
  // so its light position is converted to px and offset to the window.
  val glow = jelly.glowValue * state.trigger.shine
  state.pressX = ox + (pill.left + jelly.lightPositionX) * density
  state.pressY = oy + (pill.top + jelly.lightPositionY) * density
  state.pressRadius = GlassMenuAndroidView.LightRadius * density
  state.poolGain = GlassMenuAndroidView.LightPool * glow
  state.pressLift = GlassMenuAndroidView.LightLift * glow
  state.rimLift = GlassMenuAndroidView.LightRimLift * glow
}
