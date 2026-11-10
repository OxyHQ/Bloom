package so.oxy.bloom.glassmenu.chrome

import so.oxy.bloom.glassmenu.records.GlassMenuConfigRecord
import so.oxy.bloom.glassmenu.records.GlassTriggerConfigRecord
import so.oxy.bloom.glassmenu.render.GlassSurfaceState

// The ONE material configuration of the chrome (Android twin of chrome-material.web.ts). Every chrome surface
// (tab bar, search circle, create circle, headers, toolbars, circular buttons) goes through apply(): the menu's
// material (same records, same recipes, same shadow and rim) with refraction zeroed. The menu is not changed.
internal object ChromeMaterial {
  // Multiplies the menu's refraction in GlassRenderer.drawGlass. 0 = no lens, no outer displacement (option B).
  const val REFRACTION_SCALE = 0f

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

// The selection pill: the menu's resting-trigger material (the glass a pressable menu anchor shows at rest), with
// refraction on. Same records and recipe as the menu; the state follows GlassMenuOverlay.drawRestingAnchor.
internal fun ChromeMaterial.applyPill(state: GlassSurfaceState) {
  state.config = GlassMenuConfigRecord()
  state.trigger = GlassTriggerConfigRecord()
  state.dark = true
  state.refractionScale = 1f
  state.hasSource = false
  state.smoothing = 0f
  state.lensHeight = 0f
  state.lensAmount = 0f
  state.materialProgress = 0f
  state.surfaceOpacity = 1f
  state.rimLift = 0f
  state.pressLift = 0f
  state.poolGain = 0f
}
