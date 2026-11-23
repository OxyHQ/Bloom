package so.oxy.bloom.glassmenu.backdrop

import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderNode
import android.os.Build
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import androidx.annotation.RequiresApi
import java.util.WeakHashMap

// The window backdrop: the page behind every glass surface of the window (menus, tab bar, search, create circle).
// One per window root. It is recorded in the root's preDraw, never inside a surface's own draw, so a surface that is
// a descendant of the recorded page cannot record itself (that recursion overflowed RenderThread).
//
// Consumers call register(view, baseColor) and unregister(view). A registered view that is a direct child of the root
// (the menu overlay) is left out of the recording. Surfaces that live inside the page skip their own drawing while
// `recording` is true (dispatchDraw / onDraw check it), so they are not recorded into the backdrop.
//
// The recording holds the page by reference: drawing a child of the root draws each of its children as that view's own
// RenderNode, so whatever redraws in the page (a scroll, a video, an animation) reaches every glass surface through
// those nodes, and no surface records again for it. The recording itself changes only with the window's layout (its
// size and children), the registered surfaces and the base colour. Recorded again for any redraw in the page, it would
// make every surface record again too, at the page's frame rate, for an animation nowhere near the glass.
//
// A surface samples the page through a lens of its own (GlassLens), which holds the page only while the region behind
// the surface changes. Before each frame the backdrop finds what changed, in window rects, and tells every lens.
internal class GlassBackdrop private constructor(private val root: ViewGroup) :
  ViewTreeObserver.OnPreDrawListener, ViewTreeObserver.OnGlobalLayoutListener {
  val node = RenderNode("GlassBackdrop")

  private val excluded = HashSet<View>()
  private var baseColor: () -> Int = { android.graphics.Color.BLACK }
  private var users = 0
  private var stale = true
  private var recordedColor = 0
  private val lenses = ArrayList<GlassLens>()
  private val dirt = ArrayList<Rect>()
  private val dirtRect = RectF()
  // The place, transform, scroll, alpha and visibility of each view seen on a dirty path, as of the last frame.
  private val seen = WeakHashMap<View, FloatArray>()
  private val shape = FloatArray(ShapeSize)

  // Bumped each time the page is recorded: consumers that cache the backdrop regenerate when it changes.
  var version: Int = 0
    private set

  fun register(view: View, color: () -> Int) {
    excluded.add(view)
    baseColor = color
    users += 1
    stale = true
    if (users == 1) {
      root.viewTreeObserver.addOnPreDrawListener(this)
      root.viewTreeObserver.addOnGlobalLayoutListener(this)
    }
  }

  fun unregister(view: View) {
    excluded.remove(view)
    users -= 1
    stale = true
    if (users <= 0) {
      users = 0
      if (root.viewTreeObserver.isAlive) {
        root.viewTreeObserver.removeOnPreDrawListener(this)
        root.viewTreeObserver.removeOnGlobalLayoutListener(this)
      }
    }
  }

  override fun onGlobalLayout() {
    stale = true
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  fun lens(): GlassLens = GlassLens(this).also { lenses.add(it) }

  fun drop(lens: GlassLens) {
    lenses.remove(lens)
  }

  override fun onPreDraw(): Boolean {
    val color = baseColor()
    val whole = stale || color != recordedColor
    if (whole) record(color)
    if (lenses.isNotEmpty() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      dirt.clear()
      if (!whole && root.isDirty) collectDirt(root)
      val now = SystemClock.uptimeMillis()
      for (lens in lenses) lens.frame(if (whole) null else dirt, now)
    }
    return true
  }

  // What redraws in this frame, from the dirty flags Android keeps under hardware rendering (it keeps no dirty rects):
  // each dirty view none of whose children is dirty, and each child of a dirty view whose place, transform, scroll,
  // alpha or visibility changed (a change of those marks only its parent), with that parent, which holds where it was.
  // Left out: the glass surfaces, views drawn off the page (OffPage), views that show nothing (hidden or clear), and
  // views off the window. A pager's off-screen page is one: Compose draws an interop page only while it is on screen,
  // so the page's holder keeps the dirty flag it took when it moved away, frame after frame, with nothing under it
  // redrawing.
  private fun collectDirt(group: ViewGroup) {
    var dirtyChild = false
    for (index in 0 until group.childCount) {
      val child = group.getChildAt(index)
      if (child in excluded || (child as? OffPage)?.offPage == true) {
        dirtyChild = dirtyChild || child.isDirty
        continue
      }
      if (moved(child)) {
        addDirt(group)
        addDirt(child)
      }
      if (!child.isDirty) continue
      dirtyChild = true
      if (child.visibility != View.VISIBLE || child.alpha == 0f) continue
      if (child is ViewGroup) collectDirt(child) else addDirt(child)
    }
    if (!dirtyChild) addDirt(group)
  }

  // A view in the page whose drawing is not part of it while [offPage] (a trigger whose lens and content the menu
  // overlay draws): what redraws in it does not change what the glass samples.
  interface OffPage {
    val offPage: Boolean
  }

  private fun moved(view: View): Boolean {
    shape[0] = view.left.toFloat()
    shape[1] = view.top.toFloat()
    shape[2] = view.right.toFloat()
    shape[3] = view.bottom.toFloat()
    shape[4] = view.scrollX.toFloat()
    shape[5] = view.scrollY.toFloat()
    shape[6] = view.translationX
    shape[7] = view.translationY
    shape[8] = view.scaleX
    shape[9] = view.scaleY
    shape[10] = view.rotation
    shape[11] = view.alpha
    shape[12] = view.visibility.toFloat()
    val last = seen[view]
    if (last != null && last.contentEquals(shape)) return false
    if (last == null) seen[view] = shape.copyOf() else shape.copyInto(last)
    return true
  }

  // The view's bounds in the root's coordinates (the backdrop's), through every transform and scroll above it.
  private fun addDirt(view: View) {
    dirtRect.set(0f, 0f, view.width.toFloat(), view.height.toFloat())
    var current = view
    while (current !== root) {
      if (!current.matrix.isIdentity) current.matrix.mapRect(dirtRect)
      dirtRect.offset(current.left.toFloat(), current.top.toFloat())
      val parent = current.parent as? View ?: return
      dirtRect.offset(-parent.scrollX.toFloat(), -parent.scrollY.toFloat())
      current = parent
    }
    if (!dirtRect.intersects(0f, 0f, root.width.toFloat(), root.height.toFloat())) return
    val rect = Rect()
    dirtRect.roundOut(rect)
    dirt.add(rect)
  }

  private fun record(color: Int) {
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
      canvas.drawColor(color)
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
    stale = false
    recordedColor = color
    version += 1
  }

  companion object {
    private val byRoot = WeakHashMap<ViewGroup, GlassBackdrop>()
    private const val ShapeSize = 13

    // True while a backdrop is being recorded. Surfaces inside the page must not draw then.
    @Volatile
    var recording: Boolean = false
      private set

    fun forRoot(root: ViewGroup): GlassBackdrop = byRoot.getOrPut(root) { GlassBackdrop(root) }
  }
}
