package so.oxy.bloom.glassmenu.backdrop

import android.graphics.Bitmap
import android.graphics.Rect
import android.graphics.RenderNode
import android.os.Build
import android.view.Choreographer
import android.os.SystemClock
import androidx.annotation.RequiresApi
import so.oxy.bloom.glassmenu.render.GlassStill

// What one glass surface samples of the page: the page itself, by reference, while anything behind the surface
// changes, and a still of the region behind it once that region has been quiet for a moment (StillAfterMs).
//
// Android draws a RenderNode reached from a second parent in the same frame as fully damaged: every glass that holds
// the page re-renders on every frame the window draws, for an animation anywhere on screen, and the page's tree is
// prepared once more for each of them. A lens that shows its still does not hold the page: its glass is not drawn
// again, and the page is prepared once. The still is the same pixels: the region of the same nodes (GlassStill).
//
// The backdrop tells each lens, before every frame, which window rects change in it (GlassBackdrop.onPreDraw); a lens
// whose region is touched shows the page again in that same frame. The region is the one the glass samples.
@RequiresApi(Build.VERSION_CODES.TIRAMISU)
class GlassLens(val page: GlassBackdrop) {
  val node = RenderNode("GlassLens")
  private val region = Rect()
  private var showsStill = false
  private var recorded = false
  private var quietSince = 0L
  // When the region was last moved or resized: a region that moves (a lens sliding with its header) takes no stills.
  private var placedAt = 0L
  // Bumped whenever the page is shown again: a still asked before then is dropped when it arrives.
  private var generation = 0
  private var askedGeneration = -1
  private var still: GlassStill? = null

  // The node the glass draws for [area] (window px): the region's still, or the page. A node whose display list hwui
  // dropped (it left every tree: the window stopped) is recorded again, not drawn empty.
  fun sample(area: Rect): RenderNode {
    if (area != region || !recorded || !node.hasDisplayList()) {
      val now = SystemClock.uptimeMillis()
      if (area != region) placedAt = now
      region.set(area)
      // A new region has been as quiet as the page behind it: a menu opening over a page that is still samples a still
      // of it once its region has settled, not the page for its first half second (the whole of its opening).
      showPage(page.lastChangeIn(region, now))
    }
    return node
  }

  // Before a frame: [dirt] are the window rects that change in it (null: the whole page changed).
  fun frame(dirt: List<Rect>?, now: Long) {
    if (!recorded || region.isEmpty) return
    if (dirt == null || dirt.any { Rect.intersects(it, region) }) {
      showPage(now)
    } else if (!showsStill && still == null && now - quietSince >= StillAfterMs && now - placedAt >= SettleMs) {
      askStill()
    }
  }

  // The page again, and the still let go: a lens holds a still only while it shows it (a menu's large region, a
  // region that changes now and then, would otherwise keep buffers it does not draw).
  private fun showPage(changedAt: Long) {
    quietSince = changedAt
    generation += 1
    letStillGo()
    if (!showsStill && recorded && node.hasDisplayList() && node.left == region.left && node.top == region.top &&
      node.width == region.width() && node.height == region.height()) return
    node.setPosition(region)
    val canvas = node.beginRecording(region.width(), region.height())
    canvas.translate(-region.left.toFloat(), -region.top.toFloat())
    canvas.drawRenderNode(page.node)
    node.endRecording()
    showsStill = false
    recorded = true
  }

  // The still is released after the next frame, once the node that drew it draws the page in its place. Released now,
  // its renderer would let go of the page while nothing else holds it (every other lens at rest on its own still), and
  // hwui drops the display list of a node that leaves every tree: the page would be empty, and the glass black.
  private fun letStillGo() {
    val old = still ?: return
    still = null
    Choreographer.getInstance().postFrameCallback { old.release() }
  }

  private fun askStill() {
    val target = GlassStill(region.width(), region.height(), ::showStill).also { still = it }
    askedGeneration = generation
    val left = region.left.toFloat()
    val top = region.top.toFloat()
    target.render { canvas ->
      canvas.translate(-left, -top)
      canvas.drawRenderNode(page.node)
    }
  }

  private fun showStill(bitmap: Bitmap) {
    if (askedGeneration != generation || bitmap.width != region.width() || bitmap.height != region.height()) return
    node.setPosition(region)
    val canvas = node.beginRecording(region.width(), region.height())
    canvas.drawBitmap(bitmap, 0f, 0f, null)
    node.endRecording()
    showsStill = true
  }

  fun release() {
    page.drop(this)
    still?.release()
    still = null
    node.discardDisplayList()
    recorded = false
    showsStill = false
  }

  companion object {
    // Longer than the gap between two frames of a video and than a press: a region that changes keeps the page.
    const val StillAfterMs = 500L
    // A region kept this long has stopped moving.
    const val SettleMs = 50L
  }
}
