package so.oxy.bloom.glassmenu.chrome

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderNode
import android.graphics.Typeface
import android.os.Build
import android.util.Log
import android.util.TypedValue
import android.widget.EditText
import android.widget.FrameLayout
import android.view.Choreographer

import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewConfiguration
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import so.oxy.bloom.glassmenu.motion.GlassSpring
import so.oxy.bloom.glassmenu.backdrop.GlassBackdrop
import so.oxy.bloom.glassmenu.motion.GlassJelly
import so.oxy.bloom.glassmenu.motion.GlassMotion
import so.oxy.bloom.glassmenu.motion.GlassSpringSpec
import so.oxy.bloom.glassmenu.overlay.GlassFeedback
import so.oxy.bloom.glassmenu.overlay.GlassScrub
import so.oxy.bloom.glassmenu.render.GlassRenderer
import so.oxy.bloom.glassmenu.render.GlassSurfaceState
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

// Native iOS-style chrome: tab bar capsule with a sliding pill, search circle that morphs into a field, and a
// create circle. Mirrors ios-tab-bar-view.web.tsx: same geometry (ChromeGeometry), same springs, same fills.
// The chrome drawn as a window overlay (a direct child of the window root, like the menu overlay): the page is never an
// ancestor of the glass, so the backdrop cannot contain the surface that samples it. The Expo host (GlassChromeHost)
// forwards props and events.
class GlassChromeView(context: Context) : FrameLayout(context) {
  // Events to the host: "onTabSelect", "onSearchChange", "onCreate".
  var emit: (String, Map<String, Any?>) -> Unit = { _, _ -> }

  private val density = resources.displayMetrics.density
  private val slop = ViewConfiguration.get(context).scaledTouchSlop

  var labels: List<String> = emptyList()
    set(value) {
      field = value
      invalidate()
    }
  var icons: List<String> = emptyList()
    set(value) {
      field = value
      invalidate()
    }
  var selectedIndex: Int = 0
    set(value) {
      field = value
      pillSpring.target(value.toFloat(), PILL_SPEC)
      kick()
    }
  // dp, same meaning as bottomInset in the web bar.
  var bottomInset: Float = 0f
    set(value) {
      field = value
      invalidate()
    }
  var searchPlaceholder: String = "Search"
    set(value) {
      field = value
      input.hint = value
    }

  private val searchSpring = GlassSpring(0.002f, 0.02f)
  // One jelly per pressable control, as the menu has one for its trigger.
  private val searchJelly = GlassJelly()
  private val fabJelly = GlassJelly()
  private val pillJelly = GlassJelly()
  // The shared scrub controller of each pressable control (the same one the menu uses for its rows).
  private val searchScrub = GlassScrub(searchJelly)
  private val fabScrub = GlassScrub(fabJelly)
  private val pillScrub = GlassScrub(pillJelly)
  private var pressedScrub: GlassScrub? = null
  private val pillSpring = GlassSpring(0.002f, 0.02f)
  private var searchOpen = false
  private var running = false
  private var lastNanos = -1L
  private val frameCallback = Choreographer.FrameCallback { nanos -> onFrame(nanos) }

  // One renderer per glass surface, as in the menu (a renderer records its own RenderNodes).
  private val barRenderer = GlassRenderer(density, density * FIELD_STEP)
  private val fabRenderer = GlassRenderer(density, density * FIELD_STEP)
  // The selection pill: refraction on (the menu's resting-trigger material). Its own renderer.
  private val pillRenderer = GlassRenderer(density, density * FIELD_STEP)
  // The rasterized static glass (hardware buffer), see StaticGlassCache.
  private val staticGlass = StaticGlassCache()
  // The window backdrop: the page behind the chrome, shared with the menus (GlassBackdrop, recorded in preDraw).
  private var backdropProvider: GlassBackdrop? = null
  private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val iconPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    typeface = Typeface.create(Typeface.DEFAULT, 500, false)
    textAlign = Paint.Align.CENTER
  }

  private val input = EditText(context).apply {
    background = null
    setPadding(0, 0, 0, 0)
    setSingleLine(true)
    imeOptions = EditorInfo.IME_ACTION_SEARCH
    setTextColor(Color.WHITE)
    setHintTextColor(ACCENT_INACTIVE)
    setTextSize(TypedValue.COMPLEX_UNIT_DIP, 17f)
    gravity = android.view.Gravity.CENTER_VERTICAL or android.view.Gravity.START
    alpha = 0f
    visibility = View.INVISIBLE
  }

  init {
    setWillNotDraw(false)
    addView(input)
  }

  // The field is placed by placeInput(); FrameLayout's own layout pass must not move it.
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {}

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (oldw == 0) pillSpring.reset(selectedIndex.toFloat())
    invalidate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val root = rootView as? ViewGroup ?: return
    backdropProvider = GlassBackdrop.forRoot(root).also { it.register(this) { android.graphics.Color.BLACK } }
  }

  override fun onDetachedFromWindow() {
    backdropProvider?.unregister(this)
    backdropProvider = null
    Choreographer.getInstance().removeFrameCallback(frameCallback)
    running = false
    lastNanos = -1L
    barRenderer.release()
    fabRenderer.release()
    staticGlass.release()
    super.onDetachedFromWindow()
  }

  private fun kick() {
    if (running) return
    running = true
    lastNanos = -1L
    Choreographer.getInstance().postFrameCallback(frameCallback)
  }

  // One display frame: advance both springs with the real frame time (capped like the web loop), then redraw.
  private fun onFrame(nanos: Long) {
    val seconds = if (lastNanos < 0L) 1f / 60f else min((nanos - lastNanos) / 1_000_000_000f, 1f / 30f)
    lastNanos = nanos
    searchSpring.advance(seconds)
    pillSpring.advance(seconds)
    searchJelly.advance(seconds)
    fabJelly.advance(seconds)
    pillJelly.advance(seconds)
    invalidate()
    if (searchSpring.isSettled && pillSpring.isSettled && searchJelly.isSettled && fabJelly.isSettled && pillJelly.isSettled) {
      searchSpring.finish()
      pillSpring.finish()
      invalidate()
      running = false
      lastNanos = -1L
    } else {
      Choreographer.getInstance().postFrameCallback(frameCallback)
    }
  }

  // A surface inside the page must not draw while the backdrop is recorded (it would record itself).
  override fun dispatchDraw(canvas: Canvas) {
    super.dispatchDraw(canvas)
  }

  override fun onDraw(canvas: Canvas) {
    if (width <= 0 || height <= 0) return
    val w = width / density
    val h = height / density
    val progress = clamp01(searchSpring.value)
    val shapes = ChromeGeometry.tabBarShapes(w, h, bottomInset, progress).map { shape ->
      when (shape.id) {
        "search" -> deform(shape, searchJelly)
        "fab" -> deform(shape, fabJelly)
        else -> shape
      }
    }
    // Glass surfaces are drawn in pixels (GlassRenderer works in px, like the menu).
    drawGlassSurfaces(canvas, shapes, w, h)
    canvas.save()
    canvas.scale(density, density)
    drawContent(canvas, w, h, shapes, progress)
    canvas.restore()
  }

  // Press deformation of one control: the menu's GlassJelly.deformControl on the control's rectangle (dp).
  // At rest the jelly is idle and the rectangle is unchanged.
  private fun deform(shape: ChromeShape, jelly: GlassJelly): ChromeShape {
    val rect = RectF(shape.x0, shape.y0, shape.x1, shape.y1)
    jelly.deformControl(rect, 1f, 1f)
    return ChromeShape(shape.id, shape.group, rect.left, rect.top, rect.right, rect.bottom, min(rect.width(), rect.height()) / 2f)
  }

  // The bar (capsule + search circle fused) and the create circle: the menu's material through ChromeMaterial.
  private fun drawGlassSurfaces(canvas: Canvas, shapes: List<ChromeShape>, w: Float, h: Float) {
    val provider = backdropProvider ?: return
    val root = rootView as? ViewGroup ?: return
    // Glass states are in window px (the backdrop is in window coordinates): translate the canvas to the window.
    val rootLocation = IntArray(2)
    val chromeLocation = IntArray(2)
    root.getLocationInWindow(rootLocation)
    getLocationInWindow(chromeLocation)
    val ox = (chromeLocation[0] - rootLocation[0]).toFloat()
    val oy = (chromeLocation[1] - rootLocation[1]).toFloat()
    val rest = ChromeGeometry.tabBarShapes(w, h, bottomInset, 0f)
    val limits = Rect(0, 0, root.width, root.height)
    val d = density
    val progress = clamp01(searchSpring.value)
    val tabs = shapes.first { it.id == "tabs" }
    val search = shapes.first { it.id == "search" }
    val fab = shapes.first { it.id == "fab" }
    canvas.save()
    canvas.translate(-ox, -oy)
    // The static glass (bar container and create circle) comes from a hardware texture while the pill is dragged; the
    // texture covers the strip from the top of the static glass down, and is rendered again only when its key changes.
    val stripTopDp = max(0f, min(rest.first { it.id == "tabs" }.y0, rest.first { it.id == "fab" }.y0) - ChromeGeometry.LAYER_PAD)
    val stripPx = stripTopDp * d
    val stripWidthPx = Math.round(w * d)
    val stripHeightPx = Math.round((h - stripTopDp) * d)
    val cacheKey = "$stripWidthPx,$stripHeightPx,${Math.round(progress * 1000)},${provider.version},$bottomInset,${labels.size},$ox,$oy"
    if (staticGlass.isSupported && staticGlass.key != cacheKey) {
      staticGlass.render(cacheKey, stripWidthPx, stripHeightPx) { cacheCanvas ->
        cacheCanvas.save()
        cacheCanvas.translate(-ox, -(oy + stripPx))
        drawStaticGlass(cacheCanvas, provider, limits, ox, oy, tabs, search, fab, rest)
        cacheCanvas.restore()
      }
    }
    val cached = if (staticGlass.isSupported) staticGlass.bitmap else null
    if (cached != null && staticGlass.key == cacheKey) {
      canvas.drawBitmap(cached, 0f, stripPx, null)
    } else {
      drawStaticGlass(canvas, provider, limits, ox, oy, tabs, search, fab, rest)
    }
    if (labels.isNotEmpty()) {
      val pill = pillRectDp(w, h, progress)
      val pillState = pillGlassState(pill, ox, oy)
      pillRenderer.prepare(pillState)
      pillRenderer.drawGlass(canvas, provider.node, pillState, limits)
    }
    canvas.restore()
  }

  // The static glass: the bar container and the create circle, at the shapes of the current search progress.
  private fun drawStaticGlass(
    canvas: Canvas,
    provider: GlassBackdrop,
    limits: Rect,
    ox: Float,
    oy: Float,
    tabs: ChromeShape,
    search: ChromeShape,
    fab: ChromeShape,
    rest: List<ChromeShape>,
  ) {
    val barState = glassState(tabs, search, ChromeGeometry.layerFor("bar", rest), ox, oy)
    barRenderer.prepare(barState)
    barRenderer.drawGlass(canvas, provider.node, barState, limits)
    // The create circle shrinks to nothing as the search opens: skip it when it has no area left.
    if (fab.x1 - fab.x0 >= 1f) {
      val fabState = glassState(fab, null, ChromeGeometry.layerFor("fab", rest), ox, oy)
      fabRenderer.prepare(fabState)
      fabRenderer.drawGlass(canvas, provider.node, fabState, limits)
    }
  }

  // The pill rectangle in dp: at the pill's spring position, deformed by its jelly like the menu's trigger.
  private fun pillRectDp(w: Float, h: Float, progress: Float): RectF {
    val tabs = ChromeGeometry.tabBarShapes(w, h, bottomInset, progress).first { it.id == "tabs" }
    val itemW = ChromeGeometry.itemWidth(w, labels.size)
    val left = tabs.x0 + ChromeGeometry.PILL_INSET + pillSpring.value * itemW
    val rect = RectF(left, tabs.y0 + ChromeGeometry.PILL_INSET, left + itemW, tabs.y0 + ChromeGeometry.TAB_HEIGHT - ChromeGeometry.PILL_INSET)
    pillJelly.deformControl(rect, 1f, 1f)
    return rect
  }

  private fun pillGlassState(pill: RectF, ox: Float, oy: Float): GlassSurfaceState {
    val d = density
    val state = GlassSurfaceState()
    ChromeMaterial.applyPill(state)
    val radius = min(pill.width(), pill.height()) / 2f * d
    state.incoming.set(pill.left * d + ox, pill.top * d + oy, pill.right * d + ox, pill.bottom * d + oy)
    state.radiusX = radius
    state.radiusY = radius
    state.pressX = pillJelly.lightPositionX
    state.pressY = pillJelly.lightPositionY
    state.pressRadius = 1f
    state.captureBounds.set(state.incoming)
    state.captureBounds.inset(-PILL_CAPTURE_MARGIN * d, -PILL_CAPTURE_MARGIN * d)
    return state
  }

  // State of one chrome surface in px. `source` is the second shape of a fused pair (smoothing = blend).
  private fun glassState(incoming: ChromeShape, source: ChromeShape?, capture: ChromeLayer, ox: Float, oy: Float): GlassSurfaceState {
    val d = density
    val state = GlassSurfaceState()
    ChromeMaterial.apply(state)
    state.incoming.set(incoming.x0 * d + ox, incoming.y0 * d + oy, incoming.x1 * d + ox, incoming.y1 * d + oy)
    state.radiusX = incoming.radius * d
    state.radiusY = incoming.radius * d
    state.hasSource = source != null
    if (source != null) {
      state.source.set(source.x0 * d + ox, source.y0 * d + oy, source.x1 * d + ox, source.y1 * d + oy)
      state.sourceRadius = source.radius * d
      // Fusion follows the gap between the two shapes: 0 at rest (separate, no field union), full blend when the gap is closed.
      val gap = source.x0 - incoming.x1
      state.smoothing = ChromeGeometry.SMOOTH_BLEND * d * (1f - gap / ChromeGeometry.REST_GAP).coerceIn(0f, 1f)
    }
    state.captureBounds.set(capture.x * d + ox, capture.y * d + oy, (capture.x + capture.width) * d + ox, (capture.y + capture.height) * d + oy)
    return state
  }

  private fun drawContent(canvas: Canvas, w: Float, h: Float, shapes: List<ChromeShape>, progress: Float) {

    val tabs = shapes.first { it.id == "tabs" }
    val search = shapes.first { it.id == "search" }
    val fab = shapes.first { it.id == "fab" }
    val itemCount = labels.size
    val itemW = if (itemCount > 0) ChromeGeometry.itemWidth(w, itemCount) else 0f
    val centerY = tabs.y0 + ChromeGeometry.TAB_HEIGHT / 2f
    val itemsOpacity = clamp01(1f - progress * 1.5f)

    // Pill (DOM "pill" in the web bar): slides with the pill spring.
    if (itemCount > 0) {
      val pillH = ChromeGeometry.TAB_HEIGHT - 2f * ChromeGeometry.PILL_INSET
      val pillX = tabs.x0 + ChromeGeometry.PILL_INSET + pillSpring.value * itemW
      // The pill is deformed by the press jelly (menu's deformControl), like the menu's trigger.
      val pillRect = RectF(pillX, tabs.y0 + ChromeGeometry.PILL_INSET, pillX + itemW, tabs.y0 + ChromeGeometry.PILL_INSET + pillH)
      pillJelly.deformControl(pillRect, 1f, 1f)
      fillPaint.reset()
      fillPaint.isAntiAlias = true
      fillPaint.color = ChromeIcons.withAlpha(Color.WHITE, 0.16f * itemsOpacity)
      val radius = min(pillRect.width(), pillRect.height()) / 2f
      canvas.drawRoundRect(pillRect, radius, radius, fillPaint)
    }

    // Tab items: icon 22 dp, label 11 dp below (same layout as the web items).
    labels.forEachIndexed { i, label ->
      val cx = tabs.x0 + ChromeGeometry.PILL_INSET + i * itemW + itemW / 2f
      // The label takes the active colour as the pill covers it: the colour follows the pill's continuous position.
      val color = lerpColor(ACCENT_INACTIVE, ACCENT, clamp01(1f - abs(pillSpring.value - i)))
      val iconName = icons.getOrNull(i) ?: ""
      ChromeIcons.draw(canvas, iconPaint, iconName, cx, centerY - 7.5f, 22f, color, itemsOpacity)
      textPaint.color = ChromeIcons.withAlpha(color, itemsOpacity)
      textPaint.textSize = 11f
      canvas.drawText(label, cx, centerY + 15.5f, textPaint)
    }

    // Search circle: lupa fades out as the close icon fades in.
    val searchCx = (search.x0 + search.x1) / 2f
    val searchCy = (search.y0 + search.y1) / 2f
    val closeOpacity = clamp01((progress - 0.5f) * 2f)
    ChromeIcons.draw(canvas, iconPaint, "search", searchCx, searchCy, 26f, Color.WHITE, 1f - closeOpacity)
    ChromeIcons.draw(canvas, iconPaint, "close", searchCx, searchCy, 24f, Color.WHITE, closeOpacity)

    // Create circle: the shape shrinks with progress, the plus fades out.
    val fabCx = (fab.x0 + fab.x1) / 2f
    val fabCy = (fab.y0 + fab.y1) / 2f
    ChromeIcons.draw(canvas, iconPaint, "add", fabCx, fabCy, 30f, Color.WHITE, clamp01(1f - progress * 2f))

    // Field: search glyph and the text input, both inside the capsule.
    val fieldOpacity = clamp01((progress - 0.4f) / 0.6f)
    val fieldLeft = tabs.x0 + ChromeGeometry.FIELD_SIDE + ChromeGeometry.FIELD_ICON + ChromeGeometry.FIELD_GAP
    val fieldRight = tabs.x1 - ChromeGeometry.FIELD_SIDE
    ChromeIcons.draw(canvas, iconPaint, "search", tabs.x0 + ChromeGeometry.FIELD_SIDE + ChromeGeometry.FIELD_ICON / 2f, centerY, ChromeGeometry.FIELD_ICON, ACCENT_INACTIVE, fieldOpacity)
    // One text line, centred on the bar, so the hint and the typed text sit on the same axis as the glyph.
    placeInput(fieldLeft, centerY - FIELD_LINE / 2f, fieldRight, centerY + FIELD_LINE / 2f, fieldOpacity)
  }

  // The text input follows the field geometry; it is hidden when the field is closed.
  private fun placeInput(left: Float, top: Float, right: Float, bottom: Float, opacity: Float) {
    input.layout(
      (left * density).toInt(),
      (top * density).toInt(),
      (right * density).toInt(),
      (bottom * density).toInt(),
    )
    input.alpha = opacity
    input.visibility = if (opacity > 0f) View.VISIBLE else View.INVISIBLE
  }

  private enum class Target { TAB, SEARCH, FAB }

  private var pressedTarget: Target? = null
  private var pressedIndex = -1
  private var dragging = false
  private var pressedOnPill = false
  private var downX = 0f
  private var downY = 0f

  override fun onTouchEvent(event: MotionEvent): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        val hit = hitTest(event.x / density, event.y / density) ?: return false
        pressedTarget = hit.first
        pressedIndex = hit.second
        dragging = false
        downX = event.x
        downY = event.y
        pressedScrub = when (hit.first) {
          Target.SEARCH -> searchScrub
          Target.FAB -> fabScrub
          Target.TAB -> pillScrub
        }
        pressedScrub?.press(event.x / density, event.y / density, if (hit.first == Target.TAB) hit.second else GlassScrub.NONE)
        // Only a press on the pill can drag it; a press on another tab is a tap.
        pressedOnPill = hit.first == Target.TAB && pressOnPill(event.x / density, event.y / density)
        kick()
        return true
      }
      MotionEvent.ACTION_MOVE -> {
        if (pressedTarget == null) return true
        val dx = event.x - downX
        val dy = event.y - downY
        // A horizontal move from a tab drags the pill; any other move beyond the slop cancels the press.
        // Like the menu's scrub: no start threshold. A press on the pill is dragged by the first move.
        if (!dragging && pressedOnPill) dragging = true
        if (dragging) {
          dragPill(event.x / density, event.y / density)
        } else if (abs(dx) > slop || abs(dy) > slop) {
          pressedTarget = null
          releasePress()
        }
        return true
      }
      MotionEvent.ACTION_UP -> {
        val target = pressedTarget
        val wasDragging = dragging
        pressedTarget = null
        dragging = false
        releasePress()
        if (wasDragging) settlePill() else if (target != null) activate(target, pressedIndex)
        return true
      }
      MotionEvent.ACTION_CANCEL -> {
        val wasDragging = dragging
        pressedTarget = null
        dragging = false
        releasePress()
        if (wasDragging) selectedIndex = selectedIndex
        return true
      }
    }
    return false
  }

  // True when (x, y) in dp is on the pill at its current position.
  private fun pressOnPill(x: Float, y: Float): Boolean {
    if (labels.isEmpty()) return false
    val w = width / density
    val h = height / density
    val tabs = ChromeGeometry.tabBarShapes(w, h, bottomInset, clamp01(searchSpring.value)).first { it.id == "tabs" }
    val itemW = ChromeGeometry.itemWidth(w, labels.size)
    val left = tabs.x0 + ChromeGeometry.PILL_INSET + pillSpring.value * itemW
    return x >= left && x <= left + itemW && y >= tabs.y0 && y <= tabs.y1
  }

  // The pill follows the finger in X, clamped to the first and last tab. The jelly deforms it while it moves.
  private fun dragPill(x: Float, y: Float) {
    if (labels.isEmpty()) return
    val w = width / density
    val h = height / density
    val tabs = ChromeGeometry.tabBarShapes(w, h, bottomInset, clamp01(searchSpring.value)).first { it.id == "tabs" }
    val itemW = ChromeGeometry.itemWidth(w, labels.size)
    val index = (x - tabs.x0 - ChromeGeometry.PILL_INSET - itemW / 2f) / itemW
    val clamped = index.coerceIn(0f, (labels.size - 1).toFloat())
    pillSpring.reset(clamped)
    // The menu's highlight tick: a tab change under the finger (the nearest tab changed).
    val nearest = Math.round(clamped)
    val previous = pillScrub.current
    if (pillScrub.drag(x, y, nearest) && previous != GlassScrub.NONE) GlassFeedback.tick(this)
    kick()
  }

  // Release after a drag: the pill settles on the nearest tab with the menu's spring (CollapseSpring, via selectedIndex),
  // and that tab's action fires.
  private fun settlePill() {
    if (labels.isEmpty()) return
    val nearest = Math.round(pillSpring.value).coerceIn(0, labels.size - 1)
    selectedIndex = nearest
    emit("onTabSelect", mapOf("index" to nearest))
  }

  // Hit areas in dp, from the current geometry. Tabs are not hit while the search is open (their items are hidden).
  private fun hitTest(x: Float, y: Float): Pair<Target, Int>? {
    val w = width / density
    val h = height / density
    val progress = clamp01(searchSpring.value)
    val shapes = ChromeGeometry.tabBarShapes(w, h, bottomInset, progress)
    val tabs = shapes.first { it.id == "tabs" }
    val search = shapes.first { it.id == "search" }
    val fab = shapes.first { it.id == "fab" }
    if (inside(x, y, search)) return Pair(Target.SEARCH, -1)
    if (inside(x, y, fab)) return Pair(Target.FAB, -1)
    if (progress < 0.5f && labels.isNotEmpty() && inside(x, y, tabs)) {
      val itemW = ChromeGeometry.itemWidth(w, labels.size)
      val index = ((x - tabs.x0 - ChromeGeometry.PILL_INSET) / itemW).toInt()
      if (index in labels.indices) return Pair(Target.TAB, index)
    }
    return null
  }

  private fun inside(x: Float, y: Float, s: ChromeShape): Boolean = x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1

  private fun activate(target: Target, index: Int) {
    when (target) {
      Target.TAB -> {
        selectedIndex = index
        emit("onTabSelect", mapOf("index" to index))
      }
      Target.SEARCH -> toggleSearch()
      Target.FAB -> emit("onCreate", emptyMap())
    }
  }

  private fun toggleSearch() {
    searchOpen = !searchOpen
    searchSpring.target(if (searchOpen) 1f else 0f, SEARCH_SPEC)
    if (searchOpen) {
      input.requestFocus()
      context.getSystemService(InputMethodManager::class.java)?.showSoftInput(input, 0)
    } else {
      input.clearFocus()
      context.getSystemService(InputMethodManager::class.java)?.hideSoftInputFromWindow(windowToken, 0)
    }
    kick()
    emit("onSearchChange", mapOf("open" to searchOpen))
  }

  private fun releasePress() {
    pressedScrub?.release()
    pressedScrub = null
    kick()
  }

  private fun clamp01(value: Float): Float = value.coerceIn(0f, 1f)

  // Linear interpolation of two colours, channel by channel (no animation of its own: t comes from the pill).
  private fun lerpColor(from: Int, to: Int, t: Float): Int {
    fun channel(a: Int, b: Int): Int = Math.round(a + (b - a) * t)
    return Color.argb(
      channel(Color.alpha(from), Color.alpha(to)),
      channel(Color.red(from), Color.red(to)),
      channel(Color.green(from), Color.green(to)),
      channel(Color.blue(from), Color.blue(to)),
    )
  }

  companion object {
    private const val TAG = "GlassChrome"
    // Same value as the menu's GlassMenuAndroidView.FieldStep (its companion is private).
    private const val FIELD_STEP = 4f
    private const val PILL_CAPTURE_MARGIN = 12f
    private const val FIELD_LINE = 28f
    // The menu's own specs (one motion core): EjectSpring starts the morph, CollapseSpring moves the pill.
    private val SEARCH_SPEC = GlassMotion.EjectSpring
    private val PILL_SPEC = GlassMotion.CollapseSpring
    private val ACCENT = 0xFF0A84FF.toInt()
    private val ACCENT_INACTIVE = 0xFFA1A1A6.toInt()
  }
}
