package so.oxy.bloom.glassmenu.overlay

import android.content.pm.ApplicationInfo
import android.util.Log
import android.view.View
import android.view.ViewParent

// Development guard for glass controls (docs/design-system-ios.md, "Glass controls and scroll views"). A glass control
// inside a scroll view that overscrolls does not follow the stretch of the content, so it is a bug in the layout.
// Logs a warning in debuggable builds only. No reflection, no per-frame work: it runs once when the control attaches.
internal object GlassDevGuard {
  private const val TAG = "GlassMenu"

  fun warnIfInOverscrollScroll(view: View) {
    if ((view.context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) == 0) return
    var ancestor: ViewParent? = view.parent
    while (ancestor is View) {
      if (ancestor.javaClass.name.contains("ScrollView") || ancestor.javaClass.name.contains("ScrollContainer")) {
        if (ancestor.overScrollMode != View.OVER_SCROLL_NEVER) {
          Log.w(
            TAG,
            "A glass control (${view.javaClass.simpleName}) is inside a scroll view with overScrollMode != never. " +
              "It will not follow the overscroll stretch. Move it to a fixed header outside the scroll view.",
          )
        }
        return
      }
      ancestor = ancestor.parent
    }
  }
}
