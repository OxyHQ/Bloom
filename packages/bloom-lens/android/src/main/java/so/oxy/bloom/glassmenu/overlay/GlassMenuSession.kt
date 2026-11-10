package so.oxy.bloom.glassmenu.overlay

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.view.MotionEvent
import so.oxy.bloom.glassmenu.GlassMenuAndroidView
import so.oxy.bloom.glassmenu.content.GlassMenuContent
import so.oxy.bloom.glassmenu.content.GlassRow
import so.oxy.bloom.glassmenu.motion.GlassJelly
import so.oxy.bloom.glassmenu.motion.GlassMorphTuning
import so.oxy.bloom.glassmenu.motion.GlassMotion
import so.oxy.bloom.glassmenu.motion.GlassSpring
import so.oxy.bloom.glassmenu.motion.GlassSpringSpec
import so.oxy.bloom.glassmenu.records.GlassMenuItemRecord
import so.oxy.bloom.glassmenu.render.GlassSurfaceState
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

// Stacked submenu panels (iOS-style): the submenu is a second glass surface over the root, with its own
// renderer and GlassMotion. Off until the stacked model is verified; the navigation model is the default.
internal const val GLASS_SUBMENU_LAYERS = true

internal class GlassMenuSession(
  private val overlay: GlassMenuOverlay,
  val anchor: GlassMenuAndroidView,
  private val density: Float,
  private val supportsGlass: Boolean,
  through: RectF?,
  windowWidth: Int,
  windowHeight: Int,
  insets: Rect,
) {
  private val motion = GlassMotion()
  private val content = GlassMenuContent(overlay.context, density) { slot -> anchor.iconView(slot) }
  private val target = RectF()
  private val source = RectF()
  private val throughRect = RectF()
  private val state = GlassSurfaceState()
  private val rowsNode: RenderNode? = if (supportsGlass) RenderNode("GlassMenu.rows") else null
  private var rowsDirty = true
  private val shown = RectF()
  private val captureBounds = RectF()
  private var lockedFieldStep = 0f

  private val plateTop = GlassSpring(.25f, 8f)
  private val plateHeight = GlassSpring(.25f, 8f)
  // Horizontal extent of the plate: a list row spans the plate inset; an action cell its column (plateSpan).
  private val plateLeft = GlassSpring(.25f, 8f)
  private val plateRight = GlassSpring(.25f, 8f)
  private val plateAlpha = GlassSpring(.004f, .05f)
  private val jelly = GlassJelly()
  private val scrub = GlassScrub(jelly)
  private val plateRect = RectF()
  private val plateNode: RenderNode? = if (supportsGlass) RenderNode("GlassMenu.plate") else null
  private var plateVisible = false
  private var activeRow: GlassRow? = null

  private var scroll = 0f
  private var maximumScroll = 0f
  private var touchStartX = 0f
  private var touchStartY = 0f
  private var touchStartScroll = 0f
  private var scrolling = false
  private var touchInside = false
  private var animating = true
  private var dismissOnUp = false
  // Submenu navigation: the submenu panel being shown (null at the root), and the content reveal.
  private var levelItems: GlassMenuItemRecord? = null
  private val nav = GlassSpring(0.001f, 0.01f)
  // Stacked submenu (flag GLASS_SUBMENU_LAYERS): the panel over the root, and the root's recede amount.
  private var child: GlassSubmenuLayer? = null
  // The root row that opened the submenu: it is drawn by the submenu (as its header), not by the root.
  private var openedRow: GlassRow? = null
  // A tap that arrived during a submenu transition, run when it ends.
  private var hasPendingUp = false
  private var pendingUpX = 0f
  private var pendingUpY = 0f
  private val parentDim = GlassSpring(0.001f, 0.01f)
  private val availableWidth: Float
  private val maximumHeight: Float
  private val opensAbove: Boolean
  private val opensFromRight: Boolean

  var expanded = true
    private set
  val needsFrame: Boolean
    get() = animating || !plateAlpha.isSettled || !plateTop.isSettled || !plateHeight.isSettled || !plateLeft.isSettled || !plateRight.isSettled ||
      !jelly.isSettled || !nav.isSettled || !parentDim.isSettled || child?.needsFrame == true

  init {
    val margin = 16f * density
    availableWidth = windowWidth - margin * 2f
    content.dark = anchor.isDark()
    content.ink = anchor.config
    levelItems = null
    nav.reset(1f)
    parentDim.reset(0f)
    content.contentAlpha = 1f
    content.setItems(anchor.items, anchor.menuWidth, availableWidth, anchor.fontFamily)
    overlay.anchorRect(anchor, source)
    throughRect.set(through ?: source)

    val top = insets.top.toFloat()
    val bottom = windowHeight - insets.bottom.toFloat()
    maximumHeight = bottom - top - margin
    val height = min(content.height, maximumHeight)
    maximumScroll = max(content.height - height, 0f)
    val width = content.width
    val alignment = anchor.alignment
    opensFromRight = alignment == "end" || alignment == "auto" && throughRect.centerX() > windowWidth / 2f
    val left = when {
      alignment == "center" -> throughRect.centerX() - width / 2f
      opensFromRight -> source.right - width
      else -> source.left
    }.coerceIn(margin, max(windowWidth - width - margin, margin))
    val roomBelow = bottom - source.top
    val roomAbove = source.bottom - top
    opensAbove = roomBelow < height && roomAbove > roomBelow
    val menuTop = (if (opensAbove) source.bottom - height else source.top)
      .coerceIn(top, max(bottom - height, top))
    target.set(left, menuTop, left + width, menuTop + height)
    updateCaptureBounds()

    motion.initialize(
      source, target, CornerRadius * density, density, throughRect, anchor.followsPress,
      GlassMorphTuning(anchor.triggerConfig.shrink, anchor.triggerConfig.absorb))
    motion.retarget(true)
    plateAlpha.reset(0f)
    plateTop.reset(0f)
    plateHeight.reset(0f)
    plateLeft.reset(0f)
    plateRight.reset(0f)
  }

  fun refreshItems() {
    if (!expanded) return
    content.setItems(levelItems?.items ?: anchor.items, anchor.menuWidth, availableWidth, anchor.fontFamily, levelItems)
    val height = min(content.height, maximumHeight)
    maximumScroll = max(content.height - height, 0f)
    scroll = min(scroll, maximumScroll)
    activeRow = null
    plateVisible = false
    plateAlpha.reset(0f)
    rowsDirty = true
    if (height != target.height() || content.width != target.width()) {
      val left = if (opensFromRight) target.right - content.width else target.left
      val top = if (opensAbove) target.bottom - height else target.top
      target.set(left, top, left + content.width, top + height)
      updateCaptureBounds()
      motion.updateTarget(target, CornerRadius * density)
      animating = true
    }
    overlay.requestFrame()
    overlay.invalidate()
  }

  fun reopen() {
    expanded = true
    animating = true
    motion.retarget(true)
  }

  fun close() {
    expanded = false
    animating = true
    plateVisible = false
    // Closing the menu takes the submenu away at once: the root's own close (the same one the tap uses) takes its
    // rows, header included, back to the trigger. A submenu that closed on its own timeline would leave its header
    // on screen after the rest of the menu had gone.
    child?.release()
    child = null
    openedRow = null
    rowsDirty = true
    parentDim.target(0f, GlassMotion.CollapseSpring)
    plateAlpha.target(0f, PlateFade)
    jelly.release()
    overlay.anchorRect(anchor, source)
    motion.updateSource(source, if (throughRect.isEmpty) source else throughRect)
    // A scrub that is committed keeps its timeline (the position it reached); a tap starts the close.
    if (motion.scrubbing) motion.endScrub(true) else motion.retarget(false)
  }

  // Predictive back with a submenu open: the gesture drives the submenu back into its row (progress 0 = open,
  // 1 = in the row) and the root recedes with it. The system decides the commit on release: an invoke completes
  // the back, a cancel reopens the submenu. The session adds no threshold of its own.
  private var gesturing = false
  private var gestureProgress = 0f

  fun backGestureStart() {
    if (closing()) return
    gesturing = true
    gestureProgress = 0f
    // Root: the close timeline is set up and scrubbed by the finger (the same timeline the tap uses).
    if (child == null) {
      motion.retarget(false)
      motion.beginScrub()
    }
  }

  fun backGestureProgress(progress: Float) {
    if (!gesturing) backGestureStart()
    if (!gesturing) return
    gestureProgress = progress.coerceIn(0f, 1f)
    val layer = child
    if (layer != null) {
      // Android's progress runs 0 (open) to 1 (back); the layer's runs 1 (open) to 0 (in the row).
      layer.dragTo(1f - gestureProgress)
    } else {
      motion.scrubTo(gestureProgress)
      animating = false
    }
    overlay.requestFrame()
  }

  fun backGestureCancel() {
    if (!gesturing) return
    gesturing = false
    val layer = child
    if (layer != null) layer.reopen() else {
      // The root's timeline reopens with the normal open timeline, from where the scrub left it.
      motion.endScrub(false)
      animating = true
    }
    overlay.requestFrame()
  }

  // Returns true when the back event was taken (the menu stays open, or finishes its own close).
  fun backGestureInvoke(): Boolean {
    // The system decides the commit on release. Once it invokes, the back completes: no second threshold.
    val layer = child
    if (layer == null) {
      // Root: the commit is the normal close: the same timeline the tap uses, continued from the scrub's position.
      gesturing = false
      return false
    }
    gesturing = false
    closeChild()
    overlay.requestFrame()
    return true
  }

  private fun closing(): Boolean = child?.closing == true

  fun tick(seconds: Float): Boolean {
    val settled = if (animating) motion.advanceBy(seconds) else true
    if (settled) animating = false
    nav.advance(seconds)
    parentDim.advance(seconds)
    // A drag holds the layer where the finger leaves it: it is removed only when the gesture is over.
    // The root recedes with the layer's progress: one state, so the two cannot drift apart.
    val current = child
    if (current != null) parentDim.reset(current.progressValue)
    current?.let { layer ->
      if (layer.tick(seconds) && !gesturing) {
        child = null
        openedRow = null
        rowsDirty = true
      }
    }
    runPendingUp()
    content.contentAlpha = nav.value
    // The rows are recorded into a RenderNode: while the level fades in, they must be re-recorded.
    if (!nav.isSettled || rowsDirty) rowsDirty = true
    plateTop.advance(seconds)
    plateHeight.advance(seconds)
    plateLeft.advance(seconds)
    plateRight.advance(seconds)
    plateAlpha.advance(seconds)
    jelly.advance(seconds)
    return settled && !expanded && nav.isSettled && child == null
  }

  private fun updateCaptureBounds() {
    captureBounds.set(source)
    captureBounds.union(target)
    captureBounds.inset(-CaptureMargin * density, -CaptureMargin * density)
    lockedFieldStep = max(
      NeckSigma * density / FieldCellsPerSigma,
      max(captureBounds.width(), captureBounds.height()) / FieldCells,
    )
  }

  private fun liveBounds(out: RectF) {
    out.set(motion.frame.bounds)
    jelly.deformMenu(out, if (opensFromRight) -1f else 1f, if (opensAbove) -1f else 1f, density, anchor.config.jelly)
  }

  fun draw(canvas: Canvas, backdrop: RenderNode, limits: Rect) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
    drawRoot(canvas, backdrop, limits)
    child?.draw(canvas, backdrop, limits)
  }

  private fun drawRoot(canvas: Canvas, backdrop: RenderNode, limits: Rect) {
    val frame = motion.frame
    liveBounds(shown)
    // While a stacked submenu is open the root recedes: the glass shrinks and the rows dim.
    val dim = parentDim.value.coerceIn(0f, 1f)
    val scale = 1f - ParentScaleDrop * dim
    if (scale < 1f) shown.inset(shown.width() * (1f - scale) / 2f, shown.height() * (1f - scale) / 2f)
    state.incoming.set(shown)
    state.captureBounds.set(captureBounds)
    state.lockedFieldStep = lockedFieldStep
    state.radiusX = frame.radiusX
    state.radiusY = frame.radiusY
    state.hasSource = anchor.morphs
    state.source.set(frame.sourceLobe)
    val swell = anchor.jelly.swell(anchor.height.toFloat(), density, anchor.triggerConfig.jelly) - 1f
    state.source.inset(-state.source.width() * swell / 2f, -state.source.height() * swell / 2f)
    // A plain trigger keeps its own corner radius (cornerRadius), not the capsule of a glass lobe.
    state.sourceRadius = if (anchor.glass) min(state.source.width(), state.source.height()) / 2f
      else anchor.cornerRadiusPx(state.source)
    state.smoothing = frame.smoothing
    state.lensHeight = frame.lensHeight
    state.lensAmount = frame.lensAmount
    state.materialProgress = frame.contentProgress
    state.surfaceOpacity = if (anchor.morphs) 1f else frame.contentProgress
    state.dark = content.dark
    state.config = anchor.config
    state.trigger = anchor.triggerConfig
    applyLight(frame.contentProgress)
    val renderer = anchor.renderer(density)
    renderer.prepare(state)
    renderer.drawGlass(canvas, backdrop, state, limits)

    val rows = recordRows() ?: return
    val width = target.width()
    val height = target.height()
    val zoom = frame.contentZoom
    rows.setPivotX(0f)
    rows.setPivotY(0f)
    rows.setScaleX(shown.width() / width * zoom)
    rows.setScaleY(shown.height() / height * zoom)
    rows.setTranslationX(shown.left + shown.width() * .5f * (1f - zoom))
    rows.setTranslationY(shown.top + shown.height() * .5f * (1f - zoom))
    // Closing: the rows (text included) never outlive the glass they sit in. Their alpha is capped by the glass's own
    // progress, so no text is left on the page once the glass has gone. Opening is unchanged.
    val glassAlpha = if (expanded) 1f else frame.contentProgress
    rows.setAlpha(minOf(frame.rowsOpacity, glassAlpha) * (1f - ParentRowsDim * dim))
    val morphBlur = anchor.config.morphBlur
    rows.setRenderEffect(blur(frame.contentBlur * morphBlur / max(min(rows.scaleX, rows.scaleY), MinimumRowsScale)))

    val trigger = anchor.recordContent()
    val lobe = state.source
    val sourceZoom = frame.sourceZoom
    val triggerWidth = max(anchor.width, 1)
    val triggerHeight = max(anchor.height, 1)
    trigger.setPivotX(triggerWidth / 2f)
    trigger.setPivotY(triggerHeight / 2f)
    trigger.setScaleX(lobe.width() / triggerWidth * sourceZoom)
    trigger.setScaleY(lobe.height() / triggerHeight * sourceZoom)
    trigger.setTranslationX(lobe.centerX() - triggerWidth / 2f)
    trigger.setTranslationY(lobe.centerY() - triggerHeight / 2f)
    trigger.setAlpha(frame.sourceOpacity)
    trigger.setRenderEffect(blur(frame.sourceBlur))

    val plate = recordPlate()
    if (plate != null) {
      plate.setPivotX(0f)
      plate.setPivotY(0f)
      plate.setScaleX(rows.scaleX)
      plate.setScaleY(rows.scaleY)
      plate.setTranslationX(rows.translationX)
      plate.setTranslationY(rows.translationY)
      plate.setAlpha(frame.rowsOpacity)
    }
    renderer.drawForeground(canvas, state, animating, frame.portalBlur * morphBlur) { recording ->
      if (anchor.morphs && frame.sourceOpacity > .001f) recording.drawRenderNode(trigger)
      if (frame.rowsOpacity > .001f) {
        if (plate != null) recording.drawRenderNode(plate)
        recording.drawRenderNode(rows)
      }
    }
    if (!anchor.morphs && frame.sourceOpacity > .001f) canvas.drawRenderNode(trigger)
  }

  private fun blur(radius: Float): RenderEffect? =
    if (radius > .01f) RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.DECAL) else null

  private fun applyLight(progress: Float) {
    val shine = anchor.config.shine
    val glow = jelly.glowValue * shine * progress
    if (glow > anchor.jelly.glowValue * (1f - progress)) {
      state.pressX = jelly.lightPositionX
      state.pressY = jelly.lightPositionY
      state.pressRadius = MenuLightRadius * density
      state.poolGain = MenuPool * glow
      state.pressLift = MenuLift * glow
      state.rimLift = MenuRimLift * glow
    } else if (expanded) {
      // The trigger's light only while the menu opens: as it closes, the glass must not brighten into the trigger's glow.
      anchor.applyLight(state, source, 1f - progress)
    } else {
      state.poolGain = 0f
      state.pressLift = 0f
      state.rimLift = 0f
    }
  }

  private fun recordRows(): RenderNode? {
    val node = rowsNode ?: return null
    val width = target.width().toInt()
    val height = target.height().toInt()
    if (rowsDirty) {
      rowsDirty = false
      node.setPosition(0, 0, width, height)
      content.draw(node.beginRecording(width, height), scroll) { it === openedRow }
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
    updatePlateRect()
    content.drawPlate(
      recording, plateRect, plateAlpha.value, jelly.lightPositionX - target.left,
      anchor.config.highlightOpacity, anchor.config.shine,
    )
    node.endRecording()
    return node
  }

  // Horizontal extent of the plate for a row, in px: an action cell spans its column; a list row spans the plate inset.
  private fun plateSpan(row: GlassRow): Pair<Float, Float> =
    if (row.isAction) row.rect.left to row.rect.right
    else PlateInset * density to target.width() - PlateInset * density

  private fun updatePlateRect() {
    val top = plateTop.value - scroll
    plateRect.set(plateLeft.value, top, plateRight.value, top + plateHeight.value)
  }

  fun drawFallback(canvas: Canvas) {
    val frame = motion.frame
    liveBounds(shown)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = if (content.dark) Color.rgb(30, 30, 32) else Color.rgb(245, 245, 247)
      alpha = (255 * frame.contentProgress).toInt()
    }
    val radius = min(frame.radiusX, frame.radiusY)
    canvas.drawRoundRect(shown, radius, radius, paint)
    val save = canvas.saveLayerAlpha(shown, (255 * frame.contentProgress).toInt())
    canvas.clipRect(shown)
    canvas.translate(shown.left, shown.top)
    canvas.scale(shown.width() / target.width(), shown.height() / target.height())
    updatePlateRect()
    content.drawPlate(canvas, plateRect, plateAlpha.value, plateRect.centerX(), anchor.config.highlightOpacity, 0f)
    content.draw(canvas, scroll)
    canvas.restoreToCount(save)
  }

  fun onTouch(event: MotionEvent) {
    val layer = child
    // A tap while the submenu is opening or closing is queued, not lost: it runs when the transition ends.
    if (layer != null && (layer.closing || !layer.isOpen)) {
      if (event.actionMasked == MotionEvent.ACTION_UP) {
        pendingUpX = event.x
        pendingUpY = event.y
        hasPendingUp = true
      }
      return
    }
    if (layer != null) {
      onChildTouch(layer, event)
      return
    }
    val x = event.x
    val y = event.y
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        touchInside = target.contains(x, y)
        dismissOnUp = !touchInside
        touchStartX = x
        touchStartY = y
        touchStartScroll = scroll
        scrolling = false
        if (touchInside) {
          scrub.press(x, y, rowFor(x, y)?.index ?: GlassScrub.NONE)
          highlight(rowFor(x, y), immediate = true)
        }
      }
      MotionEvent.ACTION_MOVE -> {
        if (!touchInside) return
        val dy = y - touchStartY
        if (maximumScroll > 0f && (scrolling || abs(dy) > 10f * density)) {
          if (!scrolling) {
            highlight(null, immediate = false)
            jelly.releaseDrag()
          }
          scrolling = true
          scroll = (touchStartScroll - dy).coerceIn(0f, maximumScroll)
          rowsDirty = true
          overlay.invalidate()
          return
        }
        scrub.drag(x, y, rowFor(x, y)?.index ?: GlassScrub.NONE)
        highlight(rowFor(x, y), immediate = false)
      }
      MotionEvent.ACTION_UP -> {
        scrub.release()
        val row = content.rowAt(x - target.left, y - target.top + scroll)
        when {
          dismissOnUp -> overlay.requestClose()
          row != null && row.back && !scrolling -> leaveLevel()
          row != null && row.submenu && !scrolling && GLASS_SUBMENU_LAYERS -> enterLayer(row)
          row != null && row.submenu && !scrolling -> enterLevel(row.item)
          row != null && !scrolling -> select(row.index)
          else -> highlight(null, immediate = false)
        }
      }
      MotionEvent.ACTION_CANCEL -> {
        scrub.cancel()
        highlight(null, immediate = false)
      }
    }
  }

  // Submenu navigation (touch): the root panel becomes the submenu panel. The panel resizes with the
  // morph spring (refreshItems -> GlassMotion.updateTarget) and the content reveals with the same
  // RowsRevealSpring as the morph, so the material and the physics are the root menu's.
  private fun enterLevel(sub: GlassMenuItemRecord) {
    levelItems = sub
    navigateLevel()
  }

  private fun leaveLevel() {
    levelItems = null
    navigateLevel()
  }

  private fun navigateLevel() {
    refreshItems()
    nav.reset(0f)
    nav.target(1f, GlassMotion.RowsRevealSpring)
    rowsDirty = true
    animating = true
    overlay.requestFrame()
  }

  // Stacked submenu (flag on): the panel grows out of the tapped row over the root, which recedes.
  private fun enterLayer(row: GlassRow) {
    val sub = row.item.items ?: return
    val layer = GlassSubmenuLayer(
      anchor, density,
      GlassMenuContent(overlay.context, density) { slot -> anchor.iconView(slot) }.also {
        it.dark = content.dark
        it.ink = content.ink
        it.forceCheckColumn = content.reservesCheckColumn
      },
      if (supportsGlass) RenderNode("GlassMenu.submenu.rows") else null,
      if (supportsGlass) RenderNode("GlassMenu.submenu.plate") else null,
      anchor.newRenderer(density),
    )
    layer.content.setItems(sub, target.width() / density, availableWidth, anchor.fontFamily, row.item)
    val height = min(layer.content.height, maximumHeight)
    val rowRect = RectF(
      target.left + row.rect.left, target.top + row.rect.top - scroll,
      target.left + row.rect.right, target.top + row.rect.bottom - scroll,
    )
    // The panel's header is the tapped row: the panel starts at the row and stays inside the root's bounds.
    // The header row is the parent's row: the panel is placed so that the header row's rect is the tapped row's rect.
    val headerTop = layer.content.rows.firstOrNull { it.back }?.rect?.top ?: 0f
    val panelTop = rowRect.top - headerTop
    val panel = RectF(target.left, panelTop, target.right, panelTop + height)
    layer.open(rowRect, panel)
    layer.drawHeader = { canvas, rotation ->
      canvas.save()
      canvas.translate(target.left, target.top - scroll)
      content.drawRow(canvas, row, rotation)
      canvas.restore()
    }
    child = layer
    openedRow = row
    rowsDirty = true
    // The row that opens the submenu leaves its press/hover state at once: the tap's highlight must not fade
    // out over the header while it is opened.
    clearPlate()
    overlay.requestFrame()
  }

  // A queued tap: the submenu's own row logic once it is open, the root's once no submenu is left.
  private fun runPendingUp() {
    if (!hasPendingUp) return
    val layer = child
    if (layer != null && !layer.isOpen) return
    if (layer != null && layer.closing) return
    hasPendingUp = false
    val x = pendingUpX
    val y = pendingUpY
    if (layer != null) {
      if (!layer.contains(x, y)) {
        closeChild()
        return
      }
      when (val row = layer.rowAt(x, y)) {
        null -> layer.highlight(null, immediate = false)
        else -> when {
          row.back -> closeChild()
          row.selectable -> selectChild(layer, row)
          else -> layer.highlight(null, immediate = false)
        }
      }
      return
    }
    val row = content.rowAt(x - target.left, y - target.top + scroll) ?: return
    if (row.submenu) enterLayer(row) else if (row.selectable) select(row.index)
  }

  // Clears the root's press/hover plate at once (no animation): the highlight is a state of the tap, not of the panel.
  private fun clearPlate() {
    activeRow = null
    plateVisible = false
    plateAlpha.reset(0f)
    rowsDirty = true
  }

  private fun closeChild() {
    val layer = child ?: return
    layer.close()
    overlay.requestFrame()
  }

  // Touch while a stacked submenu is open: taps inside act on its rows (its header collapses it); a tap outside
  // collapses it. The root gets no touches until the submenu is closed.
  private fun onChildTouch(layer: GlassSubmenuLayer, event: MotionEvent) {
    val x = event.x
    val y = event.y
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        touchInside = layer.contains(x, y)
        dismissOnUp = !touchInside
        if (touchInside) layer.highlight(layer.nearestRow(x, y), immediate = true)
      }
      MotionEvent.ACTION_MOVE -> {
        if (touchInside) layer.highlight(layer.nearestRow(x, y), immediate = false)
      }
      MotionEvent.ACTION_UP -> {
        val row = layer.rowAt(x, y)
        when {
          // A tap outside the submenu goes back to the root, as the header does.
          dismissOnUp -> closeChild()
          row != null && row.back -> closeChild()
          row != null && row.selectable -> selectChild(layer, row)
          else -> layer.highlight(null, immediate = false)
        }
      }
      MotionEvent.ACTION_CANCEL -> layer.highlight(null, immediate = false)
    }
    overlay.requestFrame()
  }

  private fun selectChild(layer: GlassSubmenuLayer, row: GlassRow) {
    anchor.notifySelect(row.item, row.index)
    if (row.item.keepOpen) layer.highlight(null, immediate = false) else overlay.requestClose()
  }

  private fun rowFor(x: Float, y: Float): GlassRow? =
    content.nearestRow(x - target.left, y - target.top + scroll, ScrubSlack * density)

  private fun highlight(row: GlassRow?, immediate: Boolean) {
    if (row === activeRow) return
    val hadRow = activeRow != null
    activeRow = row
    if (row == null) {
      plateVisible = false
      plateAlpha.target(0f, PlateFade)
    } else {
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
        overlay.hapticTick()
      }
      plateVisible = true
      if (immediate) plateAlpha.reset(1f) else plateAlpha.target(1f, PlateFade)
    }
  }

  fun select(index: Int) {
    val row = content.rows.firstOrNull { it.index == index }?.takeIf { it.selectable } ?: return
    anchor.notifySelect(row.item, row.index)
    if (row.item.keepOpen) {
      highlight(null, immediate = false)
    } else {
      overlay.requestClose()
    }
  }

  fun rowIndexAt(x: Float, y: Float): Int = content.rowAt(x - target.left, y - target.top + scroll)?.index ?: -1

  fun accessibleRows(): List<GlassRow> = if (expanded) content.rows.filter { !it.isSeparator } else emptyList()

  fun screenRect(row: GlassRow?): Rect {
    val rect = row?.rect ?: return Rect(0, 0, 1, 1)
    return Rect(
      (target.left + rect.left).toInt(), (target.top + rect.top - scroll).toInt(),
      (target.left + rect.right).toInt(), (target.top + rect.bottom - scroll).toInt(),
    )
  }

  fun release() {
    rowsNode?.discardDisplayList()
    plateNode?.discardDisplayList()
    child?.release()
  }

  private companion object {
    const val CornerRadius = 34f
    const val ParentScaleDrop = .05f
    const val ParentRowsDim = .65f
    const val PlateInset = 8f
    const val ScrubSlack = 24f
    const val CaptureMargin = 48f
    const val MinimumRowsScale = .25f
    const val NeckSigma = 20f
    const val FieldCellsPerSigma = 4f
    const val FieldCells = 64f
    const val MenuLightRadius = 80f
    const val MenuLift = .018f
    const val MenuPool = .03f
    const val MenuRimLift = .12f
    val PlateSlide = GlassSpringSpec(.85f, .13f)
    val PlateFade = GlassSpringSpec(1f, .14f)
  }
}
