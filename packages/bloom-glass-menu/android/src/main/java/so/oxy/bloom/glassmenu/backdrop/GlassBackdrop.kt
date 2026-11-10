package so.oxy.bloom.glassmenu.backdrop

import android.graphics.RenderNode
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import java.util.WeakHashMap

// The window backdrop: the page behind every glass surface of the window (menus, tab bar, search, create circle).
// One per window root. It is recorded in the root's preDraw, never inside a surface's own draw, so a surface that is
// a descendant of the recorded page cannot record itself (that recursion overflowed RenderThread).
//
// Consumers call register(view, baseColor) and unregister(view). A registered view that is a direct child of the root
// (the menu overlay) is left out of the recording. Surfaces that live inside the page skip their own drawing while
// `recording` is true (dispatchDraw / onDraw check it), so they are not recorded into the backdrop.
internal class GlassBackdrop private constructor(private val root: ViewGroup) : ViewTreeObserver.OnPreDrawListener {
  val node = RenderNode("GlassBackdrop")

  private val excluded = HashSet<View>()
  private var baseColor: () -> Int = { android.graphics.Color.BLACK }
  private var users = 0
  private var recorded = false

  // Bumped each time the page is recorded: consumers that cache the backdrop regenerate when it changes.
  var version: Int = 0
    private set

  fun register(view: View, color: () -> Int) {
    excluded.add(view)
    baseColor = color
    users += 1
    if (users == 1) root.viewTreeObserver.addOnPreDrawListener(this)
  }

  fun unregister(view: View) {
    excluded.remove(view)
    users -= 1
    if (users <= 0) {
      users = 0
      if (root.viewTreeObserver.isAlive) root.viewTreeObserver.removeOnPreDrawListener(this)
      recorded = false
    }
  }

  override fun onPreDraw(): Boolean {
    if (!recorded || anyChildDirty()) record()
    return true
  }

  private fun anyChildDirty(): Boolean {
    for (index in 0 until root.childCount) if (root.getChildAt(index).isDirty) return true
    return false
  }

  private fun record() {
    val width = root.width
    val height = root.height
    if (width <= 0 || height <= 0) return
    node.setPosition(0, 0, width, height)
    // Consumers below the root (the tab bar) are hidden while the page is recorded: ViewGroup does not draw invisible
    // children, so their display lists are not re-recorded inside this recording (that recursed until RenderThread
    // overflowed). Direct children of the root (the menu overlay) are excluded from the loop instead.
    val hidden = ArrayList<View>()
    for (view in excluded) {
      if (view.parent !== root && view.visibility == View.VISIBLE) {
        view.visibility = View.INVISIBLE
        hidden.add(view)
      }
    }
    recording = true
    try {
      val canvas = node.beginRecording(width, height)
      canvas.drawColor(baseColor())
      root.background?.draw(canvas)
      for (index in 0 until root.childCount) {
        val child = root.getChildAt(index)
        if (child in excluded || child.visibility != View.VISIBLE) continue
        if (child.id == android.R.id.statusBarBackground || child.id == android.R.id.navigationBarBackground) continue
        child.draw(canvas)
      }
      node.endRecording()
    } finally {
      recording = false
      for (view in hidden) view.visibility = View.VISIBLE
    }
    recorded = true
    version += 1
  }

  companion object {
    private val byRoot = WeakHashMap<ViewGroup, GlassBackdrop>()

    // True while a backdrop is being recorded. Surfaces inside the page must not draw then.
    @Volatile
    var recording: Boolean = false
      private set

    fun forRoot(root: ViewGroup): GlassBackdrop = byRoot.getOrPut(root) { GlassBackdrop(root) }
  }
}
