package so.oxy.bloom.glassmenu.chrome

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import android.text.Editable
import android.text.TextWatcher
import android.util.TypedValue
import android.view.Choreographer
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import so.oxy.bloom.glassmenu.backdrop.GlassBackdrop
import so.oxy.bloom.glassmenu.motion.GlassJelly
import so.oxy.bloom.glassmenu.motion.GlassMotion
import so.oxy.bloom.glassmenu.motion.GlassSpring
import so.oxy.bloom.glassmenu.motion.GlassSpringSpec
import so.oxy.bloom.glassmenu.overlay.GlassFeedback
import so.oxy.bloom.glassmenu.overlay.GlassScrub
import so.oxy.bloom.glassmenu.render.GlassRenderer
import so.oxy.bloom.glassmenu.render.GlassSurfaceState
import kotlin.math.abs
import kotlin.math.min

// One node of a glass layer (chrome/surface-nodes.ts). Geometry in dp, window coordinates.
internal data class SurfaceNode(
  val id: String,
  val kind: String,
  val x: Float,
  val y: Float,
  val w: Float,
  val h: Float,
  val r: Float,
  val icon: String?,
  // Index of a React child of the host (its icon host), drawn centred; takes the place of `icon`. Null when unused.
  val iconSlot: Int?,
  val text: String?,
  val textSize: Float?,
  val color: Int,
  val placeholder: String?,
  val value: String?,
  val pressable: Boolean,
) {
  val isGlass: Boolean get() = kind != "label"

  companion object {
    // Parses one map of the `nodes` prop. Numbers arrive as Double, missing optional keys as null.
    fun parse(map: Map<String, Any?>): SurfaceNode? {
      val id = map["id"] as? String ?: return null
      return SurfaceNode(
        id = id,
        kind = map["kind"] as? String ?: "glass",
        x = (map["x"] as? Number)?.toFloat() ?: 0f,
        y = (map["y"] as? Number)?.toFloat() ?: 0f,
        w = (map["w"] as? Number)?.toFloat() ?: 0f,
        h = (map["h"] as? Number)?.toFloat() ?: 0f,
        r = (map["r"] as? Number)?.toFloat() ?: 0f,
        icon = map["icon"] as? String,
        iconSlot = (map["iconSlot"] as? Number)?.toInt(),
        text = map["text"] as? String,
        textSize = (map["textSize"] as? Number)?.toFloat(),
        color = parseColor(map["color"] as? String),
        placeholder = map["placeholder"] as? String,
        value = map["value"] as? String,
        pressable = map["pressable"] as? Boolean ?: true,
      )
    }

    private fun parseColor(text: String?): Int =
      try {
        if (text == null) Color.WHITE else Color.parseColor(text)
      } catch (error: IllegalArgumentException) {
        Color.WHITE
      }
  }
}

// Draws a node layer as a window overlay (the same role as GlassChromeView): the glass is the chrome material with
// no refraction (ChromeMaterial.apply); a "selection" node is the refractive pill (ChromeMaterial.applyPill). Each node
// springs from its displayed rectangle to a new one with the menu's springs, and a press deforms it with the menu's
// GlassJelly through GlassScrub. Taps go back to React as onNodePress; fields as onFieldText / onFieldFocus.
// The view is transparent: it only returns a touch when the touch starts on a pressable node, so the page under it
// keeps its touches everywhere else.
class SurfaceNodesView(context: Context) : FrameLayout(context) {
  // Events to the host: "onNodePress", "onFieldText", "onFieldFocus".
  var emit: (String, Map<String, Any?>) -> Unit = { _, _ -> }

  private val density = resources.displayMetrics.density
  private val slop = ViewConfiguration.get(context).scaledTouchSlop

  internal var nodes: List<SurfaceNode> = emptyList()
    set(value) {
      field = value
      retarget(value)
      syncInputs(value)
      kick()
      invalidate()
    }

  // Per node: its spring, press jelly, scrub controller and renderer (one renderer per surface, as in the menu).
  private class Track(
    var node: SurfaceNode,
    val spring: GlassSpring,
    val jelly: GlassJelly,
    val scrub: GlassScrub,
    val renderer: GlassRenderer,
    val from: RectF,
    var fromRadius: Float,
  )

  // The field that must hold the keyboard (null for none), set by React.
  var focusedField: String? = null
    set(value) {
      field = value
      syncFocus()
    }

  private val tracks = LinkedHashMap<String, Track>()
  private val inputs = HashMap<String, EditText>()
  private val iconPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  // The React icon host of the owner (SurfaceNodesHost): its children are the iconSlot views.
  internal var iconHost: () -> ViewGroup? = { null }
  private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    typeface = Typeface.create(Typeface.DEFAULT, 500, false)
    textAlign = Paint.Align.CENTER
  }
  private var backdropProvider: GlassBackdrop? = null
  private var running = false
  private var lastNanos = -1L
  private val frameCallback = Choreographer.FrameCallback { nanos -> onFrame(nanos) }

  init {
    setWillNotDraw(false)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {}

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val root = rootView as? ViewGroup ?: return
    backdropProvider = GlassBackdrop.forRoot(root).also { it.register(this) { Color.BLACK } }
  }

  override fun onDetachedFromWindow() {
    backdropProvider?.unregister(this)
    backdropProvider = null
    Choreographer.getInstance().removeFrameCallback(frameCallback)
    running = false
    lastNanos = -1L
    tracks.values.forEach { it.renderer.release() }
    tracks.clear()
    super.onDetachedFromWindow()
  }

  // A new layer: a node that already exists springs from where it is drawn now to its new rectangle; a new node
  // appears at its rectangle; a node that is gone is dropped.
  private fun retarget(list: List<SurfaceNode>) {
    val seen = HashSet<String>()
    for (node in list) {
      seen.add(node.id)
      val existing = tracks[node.id]
      val spec = specFor(node)
      if (existing == null) {
        val spring = GlassSpring(0.002f, 0.02f)
        spring.reset(1f)
        val jelly = GlassJelly()
        tracks[node.id] = Track(node, spring, jelly, GlassScrub(jelly), GlassRenderer(density, density * FIELD_STEP), RectF(node.x, node.y, node.x + node.w, node.y + node.h), node.r)
        continue
      }
      val current = displayRect(existing, false)
      existing.from.set(current)
      existing.fromRadius = currentRadius(existing)
      // Always restart from the displayed rectangle: an unchanged node has from == to, so it does not move.
      existing.node = node
      existing.spring.reset(0f)
      existing.spring.target(1f, spec)
    }
    val gone = tracks.keys.filter { it !in seen }
    gone.forEach { id -> tracks.remove(id)?.renderer?.release() }
  }

  private fun specFor(node: SurfaceNode): GlassSpringSpec =
    if (node.kind == "selection") GlassMotion.CollapseSpring else GlassMotion.EjectSpring

  // The rectangle of a track at its spring position, before the press jelly.
  private fun easedRect(track: Track): RectF {
    val p = track.spring.value
    val to = track.node
    return RectF(
      track.from.left + (to.x - track.from.left) * p,
      track.from.top + (to.y - track.from.top) * p,
      track.from.right + (to.x + to.w - track.from.right) * p,
      track.from.bottom + (to.y + to.h - track.from.bottom) * p,
    )
  }

  private fun currentRadius(track: Track): Float =
    track.fromRadius + (track.node.r - track.fromRadius) * track.spring.value

  // The drawn rectangle of a track in dp; with `pressed` it includes the press deformation of its jelly.
  private fun displayRect(track: Track, deformed: Boolean): RectF {
    val rect = easedRect(track)
    // A node with no area is not deformed: the jelly would give it a width back.
    if (deformed && track.node.pressable && rect.width() >= 1f && rect.height() >= 1f) track.jelly.deformControl(rect, 1f, 1f)
    return rect
  }

  private fun kick() {
    if (running) return
    running = true
    lastNanos = -1L
    Choreographer.getInstance().postFrameCallback(frameCallback)
  }

  // One display frame: advance the springs and jellies with the real frame time (capped as the web loop), redraw.
  private fun onFrame(nanos: Long) {
    val seconds = if (lastNanos < 0L) 1f / 60f else min((nanos - lastNanos) / 1_000_000_000f, 1f / 30f)
    lastNanos = nanos
    var settled = true
    tracks.values.forEach { track ->
      track.spring.advance(seconds)
      track.jelly.advance(seconds)
      if (!track.spring.isSettled || !track.jelly.isSettled) settled = false
    }
    invalidate()
    if (settled) {
      tracks.values.forEach { it.spring.finish() }
      invalidate()
      running = false
      lastNanos = -1L
    } else {
      Choreographer.getInstance().postFrameCallback(frameCallback)
    }
  }

  override fun onDraw(canvas: Canvas) {
    if (width <= 0 || height <= 0) return
    val d = density
    val root = rootView as? ViewGroup
    val provider = backdropProvider
    val list = nodes
    if (root != null && provider != null) {
      val rootLocation = IntArray(2)
      val ownLocation = IntArray(2)
      root.getLocationInWindow(rootLocation)
      getLocationInWindow(ownLocation)
      val ox = (ownLocation[0] - rootLocation[0]).toFloat()
      val oy = (ownLocation[1] - rootLocation[1]).toFloat()
      val limits = Rect(0, 0, root.width, root.height)
      canvas.save()
      canvas.translate(-ox, -oy)
      // Glass first, in node order; the content (icons, text) after, so no glass covers a label.
      for (node in list) {
        if (!node.isGlass) continue
        val track = tracks[node.id] ?: continue
        val rect = displayRect(track, true)
        // A node with no area (a control that has shrunk away) is not drawn.
        if (rect.width() < 1f || rect.height() < 1f) continue
        val state = glassStateFor(track, rect, ox, oy)
        track.renderer.prepare(state)
        track.renderer.drawGlass(canvas, provider.node, state, limits)
      }
      canvas.restore()
    }

    canvas.save()
    canvas.scale(d, d)
    for (node in list) {
      val track = tracks[node.id] ?: continue
      val rect = displayRect(track, true)
      if (node.isGlass && (rect.width() < 1f || rect.height() < 1f)) continue
      drawContent(canvas, node, rect)
    }
    canvas.restore()
    placeInputs(list)
  }

  // State of one glass node in px (window coordinates). Refraction only on the selection pill.
  private fun glassStateFor(track: Track, rect: RectF, ox: Float, oy: Float): GlassSurfaceState {
    val d = density
    val node = track.node
    val state = GlassSurfaceState()
    if (node.kind == "selection") {
      ChromeMaterial.applyPill(state, track.jelly, rect, ox, oy, d)
    } else {
      ChromeMaterial.apply(state)
    }
    val radius = min(min(rect.width(), rect.height()) / 2f, currentRadius(track)) * d
    state.incoming.set(rect.left * d + ox, rect.top * d + oy, rect.right * d + ox, rect.bottom * d + oy)
    state.radiusX = radius
    state.radiusY = radius
    state.captureBounds.set(state.incoming)
    state.captureBounds.inset(-CAPTURE_MARGIN * d, -CAPTURE_MARGIN * d)
    return state
  }

  // A React icon (iconSlot): its view is drawn centred in the node. The view is measured by React after the first
  // layout, so a view with no size yet asks for another frame.
  private fun drawSlot(canvas: Canvas, rect: RectF, slot: Int) {
    val view = iconHost()?.getChildAt(slot) ?: return
    val w = view.width
    val h = view.height
    if (w == 0 || h == 0) {
      invalidate()
      return
    }
    canvas.save()
    canvas.translate(rect.centerX(), rect.centerY())
    canvas.scale(1f / density, 1f / density)
    canvas.translate(-w / 2f, -h / 2f)
    view.draw(canvas)
    canvas.restore()
  }

  private fun drawContent(canvas: Canvas, node: SurfaceNode, rect: RectF) {
    if (node.iconSlot != null && node.kind != "field") {
      drawSlot(canvas, rect, node.iconSlot)
      return
    }
    if (node.kind == "field") {
      if (node.icon != null) {
        SurfaceIcons.draw(canvas, iconPaint, node.icon, rect.left + FIELD_ICON_LEFT + FIELD_ICON_SIZE / 2f, rect.centerY(), FIELD_ICON_SIZE, FIELD_ICON_COLOR, 1f)
      }
      return
    }
    val cx = rect.centerX()
    val cy = rect.centerY()
    val iconSize = node.textSize ?: DEFAULT_ICON_SIZE
    val textSize = node.textSize ?: DEFAULT_TEXT_SIZE
    val hasIcon = node.icon != null
    val hasText = node.text != null
    if (hasIcon && hasText) {
      // Icon and text side by side, centred as one group (the web draws them in a row too).
      textPaint.textSize = textSize
      textPaint.color = node.color
      val textWidth = textPaint.measureText(node.text)
      val gap = 6f
      val total = iconSize + gap + textWidth
      val left = cx - total / 2f
      SurfaceIcons.draw(canvas, iconPaint, node.icon!!, left + iconSize / 2f, cy, iconSize, node.color, 1f)
      textPaint.textAlign = Paint.Align.LEFT
      canvas.drawText(node.text!!, left + iconSize + gap, baseline(cy, textSize), textPaint)
      textPaint.textAlign = Paint.Align.CENTER
    } else if (hasIcon) {
      SurfaceIcons.draw(canvas, iconPaint, node.icon!!, cx, cy, iconSize, node.color, 1f)
    } else if (hasText) {
      textPaint.textSize = textSize
      textPaint.color = node.color
      canvas.drawText(node.text!!, cx, baseline(cy, textSize), textPaint)
    }
  }

  // Baseline that centres a line of `size` dp on `cy`.
  private fun baseline(cy: Float, size: Float): Float {
    textPaint.textSize = size
    val metrics = textPaint.fontMetrics
    return cy - (metrics.ascent + metrics.descent) / 2f
  }

  // Text inputs of the field nodes: created on demand, placed on their rectangle, removed with the node.
  private fun syncInputs(list: List<SurfaceNode>) {
    val fields = list.filter { it.kind == "field" }
    val ids = fields.map { it.id }.toSet()
    inputs.keys.filter { it !in ids }.forEach { id ->
      inputs.remove(id)?.let { removeView(it) }
    }
    for (field in fields) {
      val input = inputs.getOrPut(field.id) { createInput(field.id) }
      val text = field.value ?: ""
      // While the field has focus the user's typing is the value; React's echo of it must not rewrite the text.
      if (!input.hasFocus() && input.text.toString() != text) {
        input.setText(text)
        input.setSelection(text.length)
      }
      input.hint = field.placeholder ?: ""
      if (field.id == focusedField) {
        if (!input.hasFocus()) {
          input.requestFocus()
          context.getSystemService(android.view.inputmethod.InputMethodManager::class.java)?.showSoftInput(input, 0)
        }
      } else if (input.hasFocus()) {
        input.clearFocus()
      }
      input.setTextColor(field.color)
      input.textSize = field.textSize ?: DEFAULT_TEXT_SIZE
    }
  }

  // Gives or takes the keyboard after focusedField changed.
  private fun syncFocus() {
    for ((id, input) in inputs) {
      if (id == focusedField) {
        if (!input.hasFocus()) input.requestFocus()
      } else if (input.hasFocus()) {
        input.clearFocus()
        // Clearing the focus does not hide the keyboard: it is hidden here, as the chrome does on close.
        context.getSystemService(android.view.inputmethod.InputMethodManager::class.java)?.hideSoftInputFromWindow(windowToken, 0)
      }
    }
  }

  private fun createInput(id: String): EditText {
    val input = EditText(context).apply {
      background = null
      setPadding(0, 0, 0, 0)
      setSingleLine(true)
      setHintTextColor(FIELD_ICON_COLOR)
      gravity = android.view.Gravity.CENTER_VERTICAL or android.view.Gravity.START
      setTextSize(TypedValue.COMPLEX_UNIT_DIP, DEFAULT_TEXT_SIZE)
      addTextChangedListener(object : TextWatcher {
        override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
        override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        override fun afterTextChanged(s: Editable?) {
          // The React side owns the value: it echoes it back through `value`, which is then equal and not re-set.
          emit("onFieldText", mapOf("id" to id, "text" to (s?.toString() ?: "")))
        }
      })
      onFocusChangeListener = View.OnFocusChangeListener { _, hasFocus ->
        emit("onFieldFocus", mapOf("id" to id, "focused" to hasFocus))
      }
    }
    addView(input, FrameLayout.LayoutParams(0, 0))
    return input
  }

  // Places each input on its field node (px), at the node's text inset, with the node's opacity 1.
  private fun placeInputs(list: List<SurfaceNode>) {
    val d = density
    for (field in list) {
      if (field.kind != "field") continue
      val input = inputs[field.id] ?: continue
      val track = tracks[field.id] ?: continue
      val rect = displayRect(track, true)
      val left = rect.left + (if (field.icon != null) FIELD_TEXT_LEFT else FIELD_PAD)
      val right = rect.right - FIELD_PAD
      val line = min(rect.height(), FIELD_LINE)
      val top = rect.centerY() - line / 2f
      input.layout((left * d).toInt(), (top * d).toInt(), (right * d).toInt(), ((top + line) * d).toInt())
    }
  }

  // The hit test: the topmost pressable node under (x, y) in dp, fields excluded (their EditText takes the touch).
  private fun hitNode(x: Float, y: Float): SurfaceNode? {
    for (node in nodes.asReversed()) {
      if (!node.pressable || node.kind == "field") continue
      val track = tracks[node.id] ?: continue
      val rect = easedRect(track)
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return node
    }
    return null
  }

  private var pressedNode: SurfaceNode? = null
  private var downX = 0f
  private var downY = 0f

  override fun onTouchEvent(event: MotionEvent): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        val x = event.x / density
        val y = event.y / density
        val node = hitNode(x, y) ?: return false
        pressedNode = node
        downX = event.x
        downY = event.y
        tracks[node.id]?.scrub?.press(x, y, GlassScrub.NONE)
        kick()
        return true
      }
      MotionEvent.ACTION_MOVE -> {
        val node = pressedNode ?: return true
        val dx = event.x - downX
        val dy = event.y - downY
        // Leaving the slop cancels the press, as the menu does for a vertical move.
        if (abs(dx) > slop || abs(dy) > slop) {
          pressedNode = null
          release(node)
        }
        return true
      }
      MotionEvent.ACTION_UP -> {
        val node = pressedNode
        pressedNode = null
        if (node != null) {
          release(node)
          // A label (a segment) changes the selection under the finger: the menu's highlight tick.
          if (node.kind == "label") GlassFeedback.tick(this)
          emit("onNodePress", mapOf("id" to node.id))
        }
        return true
      }
      MotionEvent.ACTION_CANCEL -> {
        val node = pressedNode
        pressedNode = null
        if (node != null) release(node)
        return true
      }
    }
    return false
  }

  private fun release(node: SurfaceNode) {
    tracks[node.id]?.scrub?.release()
    kick()
  }

  companion object {
    // Same value as the menu's GlassMenuAndroidView.FieldStep (its companion is private).
    private const val FIELD_STEP = 4f
    private const val CAPTURE_MARGIN = 12f
    private const val DEFAULT_TEXT_SIZE = 17f
    private const val DEFAULT_ICON_SIZE = 24f
    private const val FIELD_ICON_LEFT = 16f
    private const val FIELD_ICON_SIZE = 18f
    private const val FIELD_TEXT_LEFT = 42f
    private const val FIELD_PAD = 16f
    private const val FIELD_LINE = 28f
    private const val FIELD_ICON_COLOR = 0xFFA1A1A6.toInt()
  }
}
