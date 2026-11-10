package so.oxy.bloom.lens

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Rect
import android.graphics.RenderNode
import android.os.Build
import android.util.LruCache
import so.oxy.bloom.glassmenu.chrome.StaticGlassCache
import so.oxy.bloom.glassmenu.records.GlassTriggerConfigRecord
import so.oxy.bloom.glassmenu.render.GlassRenderer
import so.oxy.bloom.glassmenu.render.GlassSurfaceState

// The lens material of a resting surface, rendered ONCE and shared.
//
// A control that is not animating needs no live sampling of the page: its material is the engine's
// own (GlassRenderer, the same shader and recipe as the menu and the fixed layer) over the colour
// of the page it sits on. So it is rendered into a texture keyed by what changes its look (size,
// radius, tint, scheme, page colour) and every surface with that key draws the same texture. Sixty
// buttons of three sizes are three renders, drawn as bitmaps inside the page: they follow the
// scroll and its overscroll stretch, keep their place in the draw order, and cost a blit each.
internal object LensSurfaceCache {
  private class Entry(val cache: StaticGlassCache)

  private val entries = object : LruCache<String, Entry>(MAX_ENTRIES) {
    override fun entryRemoved(evicted: Boolean, key: String, old: Entry, new: Entry?) = old.cache.release()
  }
  private val renderers = HashMap<Float, GlassRenderer>()

  fun supported(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU

  fun bitmap(spec: LensSurfaceSpec): Bitmap? {
    if (!supported() || spec.width <= 0 || spec.height <= 0) return null
    val key = spec.key()
    val entry = entries.get(key) ?: Entry(StaticGlassCache()).also { entries.put(key, it) }
    entry.cache.bitmap?.takeIf { entry.cache.key == key }?.let { return it }
    return render(entry.cache, key, spec)
  }

  private fun render(cache: StaticGlassCache, key: String, spec: LensSurfaceSpec): Bitmap? {
    val renderer = renderers.getOrPut(spec.density) { GlassRenderer(spec.density, spec.density * FIELD_STEP) }
    val state = GlassSurfaceState().apply {
      incoming.set(0f, 0f, spec.width.toFloat(), spec.height.toFloat())
      captureBounds.set(incoming)
      radiusX = spec.radius
      radiusY = spec.radius
      dark = spec.dark
      trigger = GlassTriggerConfigRecord().also {
        it.tintColor = Color.valueOf(spec.tint)
        it.tintOpacity = spec.tintOpacity
      }
    }
    val backdrop = RenderNode("LensSurface.backdrop").apply {
      setPosition(0, 0, spec.width, spec.height)
      val recording = beginRecording(spec.width, spec.height)
      recording.drawColor(spec.page)
      endRecording()
    }
    val limits = Rect(0, 0, spec.width, spec.height)
    return cache.render(key, spec.width, spec.height) { canvas ->
      renderer.prepare(state)
      renderer.drawGlass(canvas, backdrop, state, limits)
    }
  }

  private const val MAX_ENTRIES = 64
  private const val FIELD_STEP = 4f
}

// What changes the look of a resting surface. Sizes in px.
internal data class LensSurfaceSpec(
  val width: Int,
  val height: Int,
  val radius: Float,
  val tint: Int,
  val tintOpacity: Float,
  val dark: Boolean,
  val page: Int,
  val density: Float,
) {
  fun key() = "$width x $height r${radius.toInt()} t$tint o${(tintOpacity * 100).toInt()} d$dark p$page s$density"
}
