package so.oxy.bloom.glassmenu.chrome

import android.graphics.Color
import android.view.ViewGroup
import android.widget.FrameLayout
import so.oxy.bloom.glassmenu.backdrop.GlassBackdrop
import so.oxy.bloom.glassmenu.overlay.GlassDevGuard
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

// Expo host of the chrome: an empty view in the React tree. Its drawing and touches live in GlassChromeView, which is
// attached to the window root as an overlay (see GlassChromeView). Props are forwarded; events go back to React.
class GlassChromeHost(context: android.content.Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onTabSelect by EventDispatcher<Map<String, Any?>>()
  private val onSearchChange by EventDispatcher<Map<String, Any?>>()
  private val onCreate by EventDispatcher<Map<String, Any?>>()

  private val overlay = GlassChromeView(context).apply {
    emit = { name, payload ->
      when (name) {
        "onTabSelect" -> onTabSelect(payload)
        "onSearchChange" -> onSearchChange(payload)
        else -> onCreate(payload)
      }
    }
  }
  private var attachedRoot: ViewGroup? = null

  var labels: List<String>
    get() = overlay.labels
    set(value) {
      overlay.labels = value
    }
  var icons: List<String>
    get() = overlay.icons
    set(value) {
      overlay.icons = value
    }
  var selectedIndex: Int
    get() = overlay.selectedIndex
    set(value) {
      overlay.selectedIndex = value
    }
  var bottomInset: Float
    get() = overlay.bottomInset
    set(value) {
      overlay.bottomInset = value
    }
  var searchPlaceholder: String
    get() = overlay.searchPlaceholder
    set(value) {
      overlay.searchPlaceholder = value
    }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val root = rootView as? ViewGroup ?: return
    attachedRoot = root
    GlassDevGuard.warnIfInOverscrollScroll(this)
    if (overlay.parent == null) {
      root.addView(overlay, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    }
    GlassBackdrop.forRoot(root).register(overlay) { Color.BLACK }
  }

  override fun onDetachedFromWindow() {
    attachedRoot?.let { GlassBackdrop.forRoot(it).unregister(overlay) }
    (overlay.parent as? ViewGroup)?.removeView(overlay)
    attachedRoot = null
    super.onDetachedFromWindow()
  }
}
