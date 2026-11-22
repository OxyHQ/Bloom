package so.oxy.bloom.glassmenu

import android.content.Context
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderNode
import android.os.Build
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import androidx.annotation.RequiresApi
import com.facebook.react.R
import so.oxy.bloom.glassmenu.motion.GlassJelly
import so.oxy.bloom.glassmenu.overlay.GlassDevGuard
import so.oxy.bloom.glassmenu.overlay.GlassMenuOverlay
import so.oxy.bloom.glassmenu.records.GlassMenuConfigRecord
import so.oxy.bloom.glassmenu.records.GlassMenuItemRecord
import so.oxy.bloom.glassmenu.records.GlassTriggerConfigRecord
import so.oxy.bloom.glassmenu.render.GlassRenderer
import so.oxy.bloom.glassmenu.render.GlassSurfaceState
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlin.math.min

class GlassMenuAndroidView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onItemSelect by EventDispatcher<Map<String, Any?>>()
  private val onMenuOpenChange by EventDispatcher<Map<String, Any?>>()
  private val onMenuClosed by EventDispatcher<Map<String, Any?>>()

  private var overlay: GlassMenuOverlay? = null
  private var glassRenderer: Any? = null
  private var contentNode: Any? = null
  private var menuActive = false
  private val density = resources.displayMetrics.density
  internal val jelly = GlassJelly()
  private var pressX = 0f
  private var pressY = 0f
  private var pressTime = 0L
  internal val placement = RectF()
  internal var placementAlpha = -1f
  internal var triggerConfig = GlassTriggerConfigRecord()
    set(value) {
      field = value
      overlay?.invalidate()
    }
  internal var config = GlassMenuConfigRecord()
    set(value) {
      field = value
      overlay?.invalidate()
    }

  internal val surfaceState = GlassSurfaceState()
  internal var items: List<GlassMenuItemRecord> = emptyList()
    set(value) {
      field = value
      overlay?.menuSession?.takeIf { it.anchor === this }?.refreshItems()
      openWhenReady()
    }
  // An open the owner asks for together with the rows it opens with (rows built by the press that opens it, or rows
  // swapped in for it): while set, the view opens itself, once, as soon as it has rows and is laid out, since a call
  // to `open` could arrive before the rows do. Set false, it opens again the next time it is set.
  internal var openWithItems = false
    set(value) {
      field = value
      if (!value) openedWithItems = false
      openWhenReady()
    }
  private var openedWithItems = false
  internal var glass = true
    set(value) {
      field = value
      refreshDrawing()
    }
  // Morph from the trigger without glass: a glass trigger always morphs (its glass is the origin); a plain trigger
  // morphs only when this is set. The plain trigger is drawn by the hierarchy at rest and by the session while open.
  internal var morph = true
    set(value) {
      field = value
      overlay?.invalidate()
    }
  // The session takes the trigger as its origin (a lobe with glass, the tint and radius of the trigger) when true.
  internal val morphs get() = glass || morph
  internal var cornerRadius: Float? = null
    set(value) {
      field = value
      overlay?.invalidate()
    }
  internal var colorScheme = "auto"
    set(value) {
      field = value
      overlay?.invalidate()
    }
  // The colour the trigger sits on. Set, the view draws its own lens at rest, in its place in the view hierarchy (so
  // a trigger in a scroll is clipped and stacked as the content it belongs to, under the bars), against that colour,
  // and keeps it in a compositing layer (no lens is redrawn while the page scrolls). The window overlay draws the
  // lens only while the menu is open: the session starts from the same base. A live lens inside the hierarchy cannot
  // sample the window backdrop (the backdrop records the page, which would hold the lens: a RenderNode cycle).
  internal var restBackdrop: Int? = null
    set(value) {
      field = value
      restRecorded = false
      refreshDrawing()
    }
  internal val inPlace get() = restBackdrop != null
  private var restRenderer: Any? = null
  private var restNode: Any? = null
  private var restBackdropNode: Any? = null
  private var restRecorded = false
  private val restRect = RectF()
  private val restLimits = Rect()
  internal var menuWidth: Float? = null
  internal var fontFamily: String? = null
  internal var alignment = "auto"

  private val supportsGlass get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU

  internal val drawsGlass get() = glass && supportsGlass

  private val overlayDrawsChildren get() = supportsGlass && overlay != null && ((glass && !inPlace) || menuActive)

  // The lens this view draws in its own place: at rest, when it sits in the hierarchy (restBackdrop).
  private val drawsRestInPlace get() = inPlace && drawsGlass && !menuActive

  init {
    setWillNotDraw(false)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val root = rootView as? ViewGroup ?: return
    overlay = GlassMenuOverlay.obtain(root).also { it.register(this) }
    if (drawsGlass && !inPlace) GlassDevGuard.warnIfInOverscrollScroll(this)
    refreshDrawing()
    openWhenReady()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    restRecorded = false
    openWhenReady()
  }

  private fun openWhenReady() {
    if (!openWithItems || openedWithItems || overlay == null || items.isEmpty() || width == 0 || height == 0) return
    openedWithItems = true
    // After the rest of this layout pass, so the anchor is measured where it ends up.
    post { open(null, null, null, null) }
  }

  override fun onDetachedFromWindow() {
    overlay?.unregister(this)
    overlay = null
    menuActive = false
    if (supportsGlass) releaseGraphics()
    super.onDetachedFromWindow()
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun releaseGraphics() {
    (glassRenderer as? GlassRenderer)?.release()
    glassRenderer = null
    (restRenderer as? GlassRenderer)?.release()
    restRenderer = null
    (restNode as? RenderNode)?.discardDisplayList()
    restNode = null
    (restBackdropNode as? RenderNode)?.discardDisplayList()
    restBackdropNode = null
    restRecorded = false
    (contentNode as? RenderNode)?.discardDisplayList()
    contentNode = null
  }

  private fun refreshDrawing() {
    restRecorded = false
    invalidate()
    overlay?.invalidate()
  }

  // A frame of the press jelly (the overlay runs the frame loop): a lens drawn in place records its new shape.
  internal fun jellyFrame() {
    if (!drawsRestInPlace) return
    restRecorded = false
    invalidate()
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    if (supportsGlass && drawsRestInPlace && canvas.isHardwareAccelerated) drawRestInPlace(canvas)
  }

  // The resting lens, as the overlay draws a resting trigger (drawRestingAnchor), in this view's coordinates and
  // against the colour it sits on. Recorded into a compositing layer, again only when its shape, colour or press changes.
  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun drawRestInPlace(canvas: Canvas) {
    if (width == 0 || height == 0) return
    val node = restNode as? RenderNode ?: RenderNode("GlassMenu.restInPlace").also {
      it.setUseCompositingLayer(true, null)
      restNode = it
    }
    if (!restRecorded) {
      val pad = (RestCaptureMargin + RestGuard) * density
      restLimits.set(-pad.toInt(), -pad.toInt(), width + pad.toInt(), height + pad.toInt())
      val backdrop = restBackdropNode as? RenderNode ?: RenderNode("GlassMenu.restBackdrop").also { restBackdropNode = it }
      backdrop.setPosition(restLimits)
      val fill = backdrop.beginRecording(restLimits.width(), restLimits.height())
      fill.drawColor(restBackdrop ?: 0)
      backdrop.endRecording()

      val state = surfaceState
      restRect.set(0f, 0f, width.toFloat(), height.toFloat())
      state.incoming.set(restRect)
      state.captureBounds.set(restRect)
      state.captureBounds.inset(-RestCaptureMargin * density, -RestCaptureMargin * density)
      state.lockedFieldStep = 0f
      jelly.deformControl(state.incoming, density, triggerConfig.jelly)
      val radius = cornerRadiusPx(state.incoming)
      state.radiusX = radius
      state.radiusY = radius
      state.hasSource = false
      state.smoothing = 0f
      state.lensHeight = 0f
      state.lensAmount = 0f
      state.materialProgress = 0f
      state.surfaceOpacity = 1f
      state.dark = isDark()
      state.config = config
      state.trigger = triggerConfig
      applyLight(state, restRect, 1f)
      val renderer = restRenderer as? GlassRenderer ?: newRenderer(density).also { restRenderer = it }
      node.setPosition(restLimits)
      val recording = node.beginRecording(restLimits.width(), restLimits.height())
      recording.translate(-restLimits.left.toFloat(), -restLimits.top.toFloat())
      renderer.prepare(state)
      renderer.drawGlass(recording, backdrop, state, restLimits)
      node.endRecording()
      restRecorded = !renderer.warmPipelines(canvas)
      if (!restRecorded) postInvalidateOnAnimation()
    }
    canvas.drawRenderNode(node)
  }

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (event.actionMasked == MotionEvent.ACTION_DOWN) {
      pressX = event.x
      pressY = event.y
      pressTime = SystemClock.uptimeMillis()
    }
    if (drawsGlass) {
      when (event.actionMasked) {
        MotionEvent.ACTION_DOWN -> {
          jelly.down(event.x, event.y)
          overlay?.requestFrame()
        }
        MotionEvent.ACTION_MOVE -> {
          jelly.move(event.x, event.y)
          overlay?.requestFrame()
        }
        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
          jelly.release()
          overlay?.requestFrame()
        }
      }
    }
    return super.dispatchTouchEvent(event)
  }

  internal fun applyLight(state: GlassSurfaceState, origin: RectF, opacity: Float) {
    val glow = jelly.glowValue * opacity * triggerConfig.shine
    state.pressX = origin.left + jelly.lightPositionX
    state.pressY = origin.top + jelly.lightPositionY
    state.pressRadius = LightRadius * density
    state.poolGain = LightPool * glow
    state.pressLift = LightLift * glow
    state.rimLift = LightRimLift * glow
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit

  private fun iconHost(): ViewGroup? {
    for (index in 0 until childCount) {
      val child = getChildAt(index)
      if (child.getTag(R.id.view_tag_native_id) == IconHostId) return child as? ViewGroup
    }
    return null
  }

  internal fun iconView(slot: Int): View? = iconHost()?.getChildAt(slot)

  override fun drawChild(canvas: Canvas, child: View, drawingTime: Long): Boolean {
    if (child.getTag(R.id.view_tag_native_id) == IconHostId) return false
    return super.drawChild(canvas, child, drawingTime)
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (overlayDrawsChildren) return
    if (!drawsRestInPlace || jelly.isSettled) {
      super.dispatchDraw(canvas)
      return
    }
    // Pressed, the content follows the lens's jelly, as the overlay scales a resting trigger's content.
    val shape = surfaceState.incoming
    val save = canvas.save()
    canvas.translate(shape.left, shape.top)
    canvas.scale(shape.width() / width, shape.height() / height)
    super.dispatchDraw(canvas)
    canvas.restoreToCount(save)
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  internal fun recordContent(): RenderNode {
    val node = contentNode as? RenderNode ?: RenderNode("GlassMenu.trigger").also { contentNode = it }
    node.setPosition(0, 0, width, height)
    node.setPivotX(0f)
    node.setPivotY(0f)
    node.setScaleX(1f)
    node.setScaleY(1f)
    node.setTranslationX(0f)
    node.setTranslationY(0f)
    node.setRenderEffect(null)
    val recording = node.beginRecording(width, height)
    super.dispatchDraw(recording)
    node.endRecording()
    return node
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  internal fun renderer(pixelDensity: Float): GlassRenderer =
    glassRenderer as? GlassRenderer ?: GlassRenderer(pixelDensity, pixelDensity * FieldStep).also { glassRenderer = it }

  // A separate renderer for each stacked panel: a renderer records into its own shared RenderNodes, so two
  // panels drawn from one renderer in the same frame would overwrite each other's recordings.
  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  internal fun newRenderer(pixelDensity: Float): GlassRenderer = GlassRenderer(pixelDensity, pixelDensity * FieldStep)

  internal fun isDark(): Boolean = when (colorScheme) {
    "dark" -> true
    "light" -> false
    else -> resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
  }

  internal fun cornerRadiusPx(bounds: RectF): Float {
    val capsule = min(bounds.width(), bounds.height()) / 2f
    return min(cornerRadius?.times(density) ?: capsule, capsule)
  }

  internal fun effectiveAlpha(): Float {
    var result = 1f
    var current: View? = this
    while (current != null) {
      result *= current.alpha
      current = current.parent as? View
    }
    return result
  }

  fun open(x: Double?, y: Double?, width: Double?, height: Double?) {
    val target = overlay ?: return
    if (items.isEmpty() || this.width == 0 || this.height == 0) return
    if (menuActive && target.menuSession?.expanded == true) return
    val pressed = if (followsPress) pressedRect(target) else null
    val through = pressed ?: if (x != null && y != null && width != null && height != null) {
      RectF(
        (x * density).toFloat(), (y * density).toFloat(),
        ((x + width) * density).toFloat(), ((y + height) * density).toFloat(),
      )
    } else null
    menuActive = true
    target.open(this, through)
    invalidate()
  }

  internal val followsPress get() = triggerConfig.morphOrigin == MorphFromPress

  private fun pressedRect(target: GlassMenuOverlay): RectF? {
    if (SystemClock.uptimeMillis() - pressTime > PressMemory) return null
    val bounds = RectF()
    target.anchorRect(this, bounds)
    val half = min(bounds.height() / 2f, PressRadius * density)
    val centerX = (bounds.left + pressX).coerceIn(bounds.left + half, bounds.right - half)
    val centerY = (bounds.top + pressY).coerceIn(bounds.top + half, bounds.bottom - half)
    return RectF(centerX - half, centerY - half, centerX + half, centerY + half)
  }

  fun close() {
    overlay?.takeIf { it.menuSession?.anchor === this }?.requestClose()
  }

  internal fun notifySelect(item: GlassMenuItemRecord, index: Int) {
    onItemSelect(mapOf("id" to item.id, "index" to index, "title" to item.title))
  }

  internal fun notifyOpenChange(open: Boolean) {
    onMenuOpenChange(mapOf("open" to open))
  }

  internal fun onSessionFinished() {
    menuActive = false
    invalidate()
    onMenuClosed(mapOf())
  }

  internal companion object {
    const val FieldStep = 4f
    const val IconHostId = "lens-icons"
    const val PressMemory = 1000L
    const val MorphFromPress = "press"
    const val PressRadius = 22f
    const val LightRadius = 38f
    const val LightLift = .055f
    const val LightPool = .07f
    const val LightRimLift = .3f
    // The resting capture margin around a trigger (the overlay's RestCaptureMargin) and the blur's guard beyond it.
    const val RestCaptureMargin = 16f
    const val RestGuard = 24f
  }
}
