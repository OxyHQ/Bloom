package so.oxy.bloom.glassmenu.overlay

import android.graphics.Canvas
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderNode
import so.oxy.bloom.glassmenu.GlassMenuAndroidView
import so.oxy.bloom.glassmenu.content.GlassMenuContent
import so.oxy.bloom.glassmenu.content.GlassRow
import so.oxy.bloom.glassmenu.motion.GlassSpring
import so.oxy.bloom.glassmenu.motion.GlassSpringSpec
import so.oxy.bloom.glassmenu.render.GlassRenderer
import so.oxy.bloom.glassmenu.render.GlassSurfaceState
import kotlin.math.max
import kotlin.math.min

// The submenu panel: a second glass surface stacked over the root. It is one continuous transform of one
// panel: a single progress value (0 = the tapped row, 1 = the panel) drives its rect, corner radius and
// rows. There is no source lobe, no lens and no second morph, so no extra shape can appear during the
// transition. Opening and closing run the same transform in both directions.
internal class GlassSubmenuLayer(
  private val anchor: GlassMenuAndroidView,
  private val density: Float,
  val content: GlassMenuContent,
  private val rowsNode: RenderNode?,
  private val plateNode: RenderNode?,
  // This panel's own renderer (its own RenderNodes): nothing is shared with the root.
  private val renderer: GlassRenderer,
) {
  private val state = GlassSurfaceState()
  // Draws the parent's own row (the header) at its place: set by the session, which owns that row.
  var drawHeader: ((Canvas, Float) -> Unit)? = null
  val target = RectF()
  private val row = RectF()
  private val shown = RectF()
  private val captureBounds = RectF()
  private val plateRect = RectF()
  private val progress = GlassSpring(ProgressTolerance, ProgressVelocity)
  private var rowsDirty = true
  private var plateVisible = false
  private var activeRow: GlassRow? = null
  private val plateTop = GlassSpring(.25f, 8f)
  private val plateHeight = GlassSpring(.25f, 8f)
  // Horizontal extent of the plate: a list row spans the plate inset; an action cell its column (plateSpan).
  private val plateLeft = GlassSpring(.25f, 8f)
  private val plateRight = GlassSpring(.25f, 8f)
  private val plateAlpha = GlassSpring(.004f, .05f)
  var closing = false
    private set

  // The transform's progress (1 = the panel, 0 = the row): the root recedes with it.
  val progressValue: Float get() = progress.value.coerceIn(0f, 1f)

  // Fully open: the transform has arrived at the panel and no close is pending.
  val isOpen: Boolean
    get() = !closing && progress.isSettled && progress.value >= 1f - ProgressTolerance

  val needsFrame: Boolean
    get() = !progress.isSettled || !plateAlpha.isSettled || !plateTop.isSettled || !plateHeight.isSettled || !plateLeft.isSettled || !plateRight.isSettled

  // Opens from the row rect (screen px) to the panel rect (screen px).
  fun open(rowRect: RectF, panel: RectF) {
    row.set(rowRect)
    target.set(panel)
    closing = false
    progress.reset(0f)
    progress.target(1f, Spec)
    captureBounds.set(row)
    captureBounds.union(target)
    captureBounds.inset(-CaptureMargin * density, -CaptureMargin * density)
    plateAlpha.reset(0f)
    plateTop.reset(0f)
    plateHeight.reset(0f)
    plateLeft.reset(0f)
    plateRight.reset(0f)
    plateVisible = false
    activeRow = null
    rowsDirty = true
  }

  // Predictive back: the layer follows the gesture (progress 1 = open, 0 = in the row), no spring.
  fun dragTo(progress: Float) {
    closing = true
    this.progress.reset(progress)
    rowsDirty = true
  }

  // Cancelled gesture, or a release below the commit point: the layer opens again.
  fun reopen() {
    closing = false
    progress.target(1f, Spec)
    rowsDirty = true
  }

  // Closes back into the row: the same transform, reversed.
  fun close() {
    closing = true
    // The press/hover plate of the header ends with the close, at once: it must not fade out over the collapse.
    plateVisible = false
    activeRow = null
    plateAlpha.reset(0f)
    progress.target(0f, Spec)
    rowsDirty = true
  }

  // Advances the transform. Returns true when a closing layer has reached the row (it can be removed).
  fun tick(seconds: Float): Boolean {
    progress.advance(seconds)
    plateTop.advance(seconds)
    plateLeft.advance(seconds)
    plateRight.advance(seconds)
    plateHeight.advance(seconds)
    plateAlpha.advance(seconds)
    rowsDirty = true
    // Closed once the panel is at the row: the glass has already faded out there, so nothing is left behind.
    return closing && progress.value <= CloseDone
  }

  fun draw(canvas: Canvas, backdrop: RenderNode, limits: Rect) {
    val p = progress.value.coerceIn(0f, 1f)
    lerp(row, target, p, shown)
    val rowRadius = min(row.width(), row.height()) / 2f
    val panelRadius = CornerRadius * density
    val radius = min(lerpF(rowRadius, panelRadius, p), min(shown.width(), shown.height()) / 2f)
    state.incoming.set(shown)
    state.captureBounds.set(captureBounds)
    state.lockedFieldStep = max(NeckSigma * density / FieldCellsPerSigma, max(captureBounds.width(), captureBounds.height()) / FieldCells)
    state.radiusX = radius
    state.radiusY = radius
    state.hasSource = false
    state.sourceRadius = radius
    state.smoothing = 0f
    state.lensHeight = 0f
    state.lensAmount = 0f
    // The glass fades out before it reaches the row (and in while opening): no thin residual shape at the row.
    state.materialProgress = ((p - GlassFadeStart) / (GlassFadeEnd - GlassFadeStart)).coerceIn(0f, 1f)
    // The shadow follows the material: once the glass has faded out, no shadow (or edge) is left at the row.
    state.surfaceOpacity = state.materialProgress
    state.dark = content.dark
    state.config = anchor.config
    state.trigger = anchor.triggerConfig
    // No anchor light: the anchor's press light grows as the panel shrinks into the row, which read as a white flash.
    if (state.materialProgress > 0f) {
      renderer.prepare(state)
      renderer.drawGlass(canvas, backdrop, state, limits)
    }

    val rowsAlpha = ((p - RowsFadeStart) / RowsFadeSpan).coerceIn(0f, 1f)
    val rows = recordRows()
    if (rows != null && rowsAlpha > 0f) {
      rows.setPivotX(0f)
      rows.setPivotY(0f)
      // Uniform scale: the rows keep their proportions while the panel narrows into the row.
      val scale = shown.width() / target.width()
      rows.setScaleX(scale)
      rows.setScaleY(scale)
      rows.setTranslationX(shown.left)
      rows.setTranslationY(shown.top)
      rows.setAlpha(rowsAlpha)
      rows.setRenderEffect(null)
    }
    val plate = recordPlate()
    if (plate != null && rows != null) {
      plate.setPivotX(0f)
      plate.setPivotY(0f)
      plate.setScaleX(rows.scaleX)
      plate.setScaleY(rows.scaleY)
      plate.setTranslationX(rows.translationX)
      plate.setTranslationY(rows.translationY)
      plate.setAlpha(rowsAlpha)
    }
    renderer.drawForeground(canvas, state, false, 0f) { recording ->
      if (rows != null && rowsAlpha > 0f) {
        // The rows are clipped to the panel: nothing of them is drawn outside the glass.
        recording.save()
        recording.clipRect(shown)
        if (plate != null) recording.drawRenderNode(plate)
        recording.drawRenderNode(rows)
        recording.restore()
      }
      // The header is the parent's row: it stays where it is and its chevron turns from right to down.
      drawHeader?.invoke(recording, BackChevronDown * p)
    }
  }

  private fun lerp(from: RectF, to: RectF, t: Float, out: RectF) {
    out.set(
      lerpF(from.left, to.left, t), lerpF(from.top, to.top, t),
      lerpF(from.right, to.right, t), lerpF(from.bottom, to.bottom, t),
    )
  }

  private fun lerpF(a: Float, b: Float, t: Float): Float = a + (b - a) * t

  private fun recordRows(): RenderNode? {
    val node = rowsNode ?: return null
    val width = target.width().toInt()
    val height = target.height().toInt()
    if (rowsDirty) {
      rowsDirty = false
      node.setPosition(0, 0, width, height)
      // The placeholder header row is not drawn here: the parent's own row is drawn as the header.
      content.draw(node.beginRecording(width, height), 0f) { it.back }
      node.endRecording()
    }
    return node
  }

  private fun recordPlate(): RenderNode? {
    val node = plateNode ?: return null
    if (plateAlpha.value <= .001f) return null
    val width = target.width().toInt()
    val height = target.height().toInt()
    node.setPosition(0, 0, width, height)
    val recording = node.beginRecording(width, height)
    plateRect.set(plateLeft.value, plateTop.value, plateRight.value, plateTop.value + plateHeight.value)
    content.drawPlate(recording, plateRect, plateAlpha.value, plateRect.centerX(), anchor.config.highlightOpacity, anchor.config.shine)
    node.endRecording()
    return node
  }

  // Touch: the row under the finger (panel-local coordinates), with the same highlight as the root.
  fun rowAt(x: Float, y: Float): GlassRow? = content.rowAt(x - target.left, y - target.top)

  fun nearestRow(x: Float, y: Float): GlassRow? = content.nearestRow(x - target.left, y - target.top, ScrubSlack * density)

  fun contains(x: Float, y: Float): Boolean = target.contains(x, y)

  // Horizontal extent of the plate for a row, in px: an action cell spans its column; a list row spans the plate inset.
  private fun plateSpan(row: GlassRow): Pair<Float, Float> =
    if (row.isAction) row.rect.left to row.rect.right
    else PlateInset * density to target.width() - PlateInset * density

  fun highlight(row: GlassRow?, immediate: Boolean) {
    if (row === activeRow) return
    val hadRow = activeRow != null
    activeRow = row
    if (row == null) {
      plateVisible = false
      plateAlpha.target(0f, PlateFade)
      return
    }
    val span = plateSpan(row)
    if (!plateVisible && !hadRow) {
      plateTop.reset(row.rect.top)
      plateHeight.reset(row.rect.height())
      plateLeft.reset(span.first)
      plateRight.reset(span.second)
    } else {
      plateTop.target(row.rect.top, PlateSlide)
      plateHeight.target(row.rect.height(), PlateSlide)
      plateLeft.target(span.first, PlateSlide)
      plateRight.target(span.second, PlateSlide)
    }
    plateVisible = true
    if (immediate) plateAlpha.reset(1f) else plateAlpha.target(1f, PlateFade)
    rowsDirty = true
  }

  fun release() {
    rowsNode?.discardDisplayList()
    plateNode?.discardDisplayList()
  }

  private companion object {
    const val NeckSigma = 20f
    const val FieldCellsPerSigma = 4f
    const val FieldCells = 64f
    const val CaptureMargin = 48f
    const val PlateInset = 8f
    const val ScrubSlack = 24f
    const val CornerRadius = 34f
    // Rows fade in over the second half of the transform (and out over the first half when closing).
    // One progress for the whole transition, in both directions. The rows are gone before the glass shrinks
    // (RowsFadeStart), the glass is gone before the panel reaches the row (GlassFadeStart), and the layer is removed
    // only at the row (CloseDone), where nothing of it is drawn. Nothing is fed to the rows that is outside the glass.
    const val RowsFadeStart = .45f
    const val RowsFadeSpan = .3f
    const val GlassFadeStart = .35f
    const val GlassFadeEnd = .5f
    const val CloseDone = .002f
    const val BackChevronDown = 90f
    const val ProgressTolerance = .002f
    const val ProgressVelocity = .01f
    val Spec = GlassSpringSpec(1f, .28f)
    val PlateSlide = GlassSpringSpec(.85f, .13f)
    val PlateFade = GlassSpringSpec(1f, .14f)
  }
}
