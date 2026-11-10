package so.oxy.bloom.glassmenu.chrome

import android.view.ViewGroup
import android.widget.FrameLayout
import so.oxy.bloom.glassmenu.backdrop.GlassBackdrop
import com.facebook.react.R
import so.oxy.bloom.glassmenu.overlay.GlassDevGuard
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

// Expo host of a node layer: an empty view in the React tree. Drawing and touches live in SurfaceNodesView, attached to
// the window root as an overlay (same arrangement as GlassChromeHost). Props are forwarded; events go back to React.
class SurfaceNodesHost(context: android.content.Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onNodePress by EventDispatcher<Map<String, Any?>>()
  private val onFieldText by EventDispatcher<Map<String, Any?>>()
  private val onFieldFocus by EventDispatcher<Map<String, Any?>>()

  private val overlay = SurfaceNodesView(context).apply {
    emit = { name, payload ->
      when (name) {
        "onNodePress" -> onNodePress(payload)
        "onFieldText" -> onFieldText(payload)
        else -> onFieldFocus(payload)
      }
    }
  }
  private var attachedRoot: ViewGroup? = null

  // The icon host is the child tagged with ICON_HOST_ID (a React view of the `icons` prop, set by SurfaceNodes).
  private fun findIconHost(): ViewGroup? {
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child.getTag(R.id.view_tag_native_id) == ICON_HOST_ID) return child as? ViewGroup
    }
    return null
  }

  var focusedField: String?
    get() = overlay.focusedField
    set(value) {
      overlay.focusedField = value
    }

  internal var nodes: List<SurfaceNode>
    get() = overlay.nodes
    set(value) {
      overlay.nodes = value
    }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val root = rootView as? ViewGroup ?: return
    attachedRoot = root
    GlassDevGuard.warnIfInOverscrollScroll(this)
    overlay.iconHost = { findIconHost() }
    if (overlay.parent == null) {
      root.addView(overlay, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    }
  }

  companion object {
    const val ICON_HOST_ID = "glass-surface-icons"
  }

  override fun onDetachedFromWindow() {
    (overlay.parent as? ViewGroup)?.removeView(overlay)
    attachedRoot = null
    super.onDetachedFromWindow()
  }
}
