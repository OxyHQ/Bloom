package so.oxy.bloom.ui

import android.graphics.RectF
import android.graphics.Canvas
import android.graphics.Rect
import android.graphics.RenderNode
import android.os.Build
import android.view.View
import android.view.ViewGroup
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import so.oxy.bloom.glassmenu.backdrop.GlassBackdrop
import androidx.annotation.RequiresApi
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import so.oxy.bloom.glassmenu.records.GlassAbsorbRecord
import so.oxy.bloom.glassmenu.records.GlassMenuConfigRecord
import so.oxy.bloom.glassmenu.records.GlassTriggerConfigRecord
import so.oxy.bloom.glassmenu.render.GlassRenderer
import so.oxy.bloom.glassmenu.render.GlassSurfaceState
import so.oxy.bloom.glassmenu.render.SharedStills
import kotlin.math.min
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.innerShadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import so.oxy.bloom.glassmenu.motion.GlassJelly
import so.oxy.bloom.glassmenu.overlay.GlassFeedback

/**
 * `.glass(value)`: the material a glass value names (`regular`, the default, or `clear`), a tint
 * (a colour role at a glass opacity), dimmed, and interactive (it answers a press). The language's
 * `GlassValue` (spec `glassValue`).
 */
@Immutable
data class GlassValue(
  val material: GlassMaterial = GlassMaterial.regular,
  val tint: Color? = null,
  val tintOpacity: GlassOpacity? = null,
  val dimmed: Boolean = false,
  val interactive: Boolean = false,
) {
  fun tint(color: Color, opacity: GlassOpacity? = null): GlassValue = copy(tint = color, tintOpacity = opacity)

  fun dimmed(): GlassValue = copy(dimmed = true)

  fun interactive(on: Boolean = true): GlassValue = copy(interactive = on)

  companion object {
    val regular = GlassValue()
    val clear = GlassValue(GlassMaterial.clear)
  }
}

/**
 * BloomMaterial: the ONE material of the native runtime. Every surface (`.glass()`, `.blur()`, a
 * button's glass styles, a grouped section's card) draws through it, and no other file of the
 * runtime blurs, stretches or vibrates (`tests/material_gate.rs`).
 *
 * In the page it is Bloom's Surface as Android draws it today (ADR 0003; the surface material
 * study's `tint` rendition): an opaque body, then the native edge, a 1px rim line at the top and
 * the bottom and the sheen's two inset glows, the numbers Surface writes as React Native
 * `boxShadow`s (`MaterialEdges`, generated from `src/surface/native-edge.ts`). A pressable surface
 * answers with the lens engine's jelly (bloom-lens `GlassJelly`: the swell, and the stretch and
 * lean toward the finger) and its haptic tick (`GlassFeedback`), the motion of Bloom's lens
 * controls.
 */
fun Modifier.bloomMaterial(
  shape: Shape,
  fill: Color?,
  sheen: Boolean = true,
  rim: Boolean = true,
  pressable: Boolean = false,
): Modifier = composed {
  val edge = if (LocalDark.current) MaterialEdges.dark else MaterialEdges.light
  val jelly = if (pressable) rememberMaterialPress() else null
  var m: Modifier = this
  if (jelly != null) m = m.then(jelly.modifier)
  if (fill != null) m = m.background(fill, shape)
  if (rim) {
    val line = Color.White.copy(alpha = edge.rimLine)
    m = m
      .innerShadow(shape, Shadow(radius = 0.dp, color = line, offset = DpOffset(0.dp, 1.dp)))
      .innerShadow(shape, Shadow(radius = 0.dp, color = line, offset = DpOffset(0.dp, (-1).dp)))
  }
  if (sheen) {
    val glow = Color.White.copy(alpha = edge.sheenGain)
    val blur = edge.sheenBlur.dp
    // `inset 0 ±reach blur -blur`: the glow along the top and the bottom edges.
    for (sign in intArrayOf(1, -1)) {
      m = m.innerShadow(
        shape,
        Shadow(radius = blur, color = glow, spread = -blur, offset = DpOffset(0.dp, (edge.sheenReach * sign).dp)),
      )
    }
  }
  m
}

/**
 * `.glass(value)`: a glass value's material. Where the device has the lens engine (Android 13+, a
 * hardware canvas) it is bloom-lens's glass, drawn as Bloom's React Native controls draw a lens in
 * the page ([bloomLens]); elsewhere the tint rendition: regular glass paints the edge's sheen over
 * the surface in scope (its own body only when tinted), clear glass paints the surface fill at its
 * opacity with no sheen, and `.dimmed()` darkens the body as Apple's dimming layer does.
 */
fun Modifier.bloomGlass(value: GlassValue = GlassValue.regular, corner: Dp = Dp.Infinity): Modifier = composed {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !value.dimmed) {
    return@composed if (LocalFloatingRegion.current) bloomWindowLens(value, corner) else bloomLens(value, corner)
  }
  val material = value.material
  val opacity = (value.tintOpacity ?: material.tintOpacity)?.value
  val fill = when {
    value.tint != null -> value.tint.copy(alpha = opacity ?: value.tint.alpha)
    material.fillsSurface -> Colors.surface.copy(alpha = opacity ?: 1f)
    else -> Colors.surface
  }
  val body = if (value.dimmed) dim(fill) else fill
  bloomMaterial(materialShape(corner), body, sheen = material.sheen, pressable = value.interactive)
}

/**
 * The opaque colour the content sits on (the page, a card's body): a lens in the page samples it,
 * as Bloom's React Native lens samples its surface's published fill (`restBackdrop`). Unset, the
 * page's background.
 */
val LocalBacking = staticCompositionLocalOf<Color?> { null }

/**
 * The lens in the page: bloom-lens's glass (its renderer, recipes, shadow, rim and light) drawn in
 * the view's own place, against the colour it sits on, exactly as Bloom's React Native lens base
 * draws a control in a scroll (`GlassMenuAndroidView.drawRestInPlace`): at rest one shared still
 * per look (`SharedStills`: the feed's every capsule is one texture), and while pressed the live
 * lens, deformed by the engine's jelly with the content following it. In the page and not over
 * the window's backdrop, so it scrolls, clips and stacks with the content and cannot sample a
 * recording that holds itself.
 *
 * The lens's settings are the React Native base's: the trigger's frost at rest is the material's
 * `lensBlur` (regular 5 dp, clear 2 dp: `LENS_FROST.control`), a tint is the base's tint at
 * `LENS_FILL_TINT` unless the value names an opacity, and the menu record keeps the engine's own.
 */
@RequiresApi(Build.VERSION_CODES.TIRAMISU)
private fun Modifier.bloomLens(value: GlassValue, corner: Dp): Modifier = composed {
  val view = LocalView.current
  val density = LocalDensity.current.density
  val dark = LocalDark.current
  val backing = (LocalBacking.current ?: Colors.background).toArgb()
  var frame by remember { mutableIntStateOf(0) }
  val lens = remember { PageLens(density, view.context) { frame++ } }
  DisposableEffect(lens) { onDispose { lens.release() } }
  val trigger = rememberLensTrigger(value)
  val cornerPx = if (corner == Dp.Infinity) null else corner.value * density
  val jelly = lens.jelly
  val shape = remember { RectF() }
  this
    .lensPress(jelly, value.interactive) { frame++ }
    .drawBehind {
      frame.let { }
      val canvas = drawContext.canvas.nativeCanvas
      if (!canvas.isHardwareAccelerated) {
        // A software capture (a bitmap of the view) cannot run the engine's shaders.
        drawRect(Color(backing))
        return@drawBehind
      }
      lens.draw(canvas, size.width, size.height, cornerPx, backing, dark, trigger, shape)
    }
    .graphicsLayer {
      // Pressed, the content follows the lens's shape (the base's `dispatchDraw`).
      frame.let { }
      val w = size.width
      val h = size.height
      if (jelly.isSettled || w <= 0f || h <= 0f || shape.isEmpty) return@graphicsLayer
      scaleX = shape.width() / w
      scaleY = shape.height() / h
      translationX = shape.left
      translationY = shape.top
      transformOrigin = TransformOrigin(0f, 0f)
    }
}

/**
 * One lens in the page: the engine's renderer and state, the backing it samples (a node filled
 * with the colour the view sits on), and its look's shared still. Mirrors bloom-lens's in-place
 * trigger (`GlassMenuAndroidView`: `prepareRest`, `drawRestStill`, `drawRestInPlace`) with its
 * constants, so the pixels are the same.
 */
@RequiresApi(Build.VERSION_CODES.TIRAMISU)
private class PageLens(private val density: Float, context: android.content.Context, wake: () -> Unit) {
  val jelly = GlassJelly()
  private val renderer = GlassRenderer(density, density * FIELD_STEP)
  private val state = GlassSurfaceState()
  private val backdrop = RenderNode("BloomMaterial.backing")
  private val live = RenderNode("BloomMaterial.lens").apply { setUseCompositingLayer(true, null) }
  private val limits = Rect()
  private var look: LensLook? = null
  private val menu = GlassMenuConfigRecord()
  // SharedStills and the renderer ask a view to draw again: here, the composition's next frame.
  private val waker = object : View(context) {
    override fun invalidate() = wake()
  }
  private val wakeOnFrame = Runnable { wake() }

  fun draw(
    canvas: Canvas,
    width: Float,
    height: Float,
    corner: Float?,
    backing: Int,
    dark: Boolean,
    trigger: GlassTriggerConfigRecord,
    shape: RectF,
  ) {
    val w = width.toInt()
    val h = height.toInt()
    if (w <= 0 || h <= 0) return
    prepare(w, h, corner, backing, dark, trigger)
    shape.set(state.incoming)
    if (jelly.isSettled && drawStill(canvas, w, h, backing, dark, trigger)) return
    live.setPosition(limits)
    val recording = live.beginRecording(limits.width(), limits.height())
    recording.translate(-limits.left.toFloat(), -limits.top.toFloat())
    renderer.prepare(state)
    renderer.drawGlass(recording, backdrop, state, limits)
    live.endRecording()
    if (renderer.warmPipelines(canvas)) waker.postOnAnimation(wakeOnFrame)
    canvas.drawRenderNode(live)
  }

  // The settled lens: the still of its look, shared with every lens that looks the same. False
  // until it has arrived (the composition draws again then); the live lens is drawn meanwhile.
  private fun drawStill(canvas: Canvas, w: Int, h: Int, backing: Int, dark: Boolean, trigger: GlassTriggerConfigRecord): Boolean {
    val next = LensLook(
      limits.width(), limits.height(), state.radiusX, backing, dark, density,
      trigger.blur, trigger.tintColor?.toArgb(), trigger.tintOpacity, w, h,
    )
    if (next != look) {
      look?.let { SharedStills.release(it) }
      look = next
      val at = Rect(limits)
      val shot = GlassSurfaceState().also { copyState(state, it) }
      SharedStills.acquire(next, at.width(), at.height()) { recording ->
        recording.translate(-at.left.toFloat(), -at.top.toFloat())
        renderer.prepare(shot)
        renderer.drawGlass(recording, backdrop, shot, at)
      }
    }
    val still = SharedStills.bitmap(next, waker) ?: return false
    canvas.drawBitmap(still, limits.left.toFloat(), limits.top.toFloat(), null)
    if (renderer.warmPipelines(canvas)) waker.postOnAnimation(wakeOnFrame)
    return true
  }

  // The lens's limits and state in the view's coordinates, and the backing it samples.
  private fun prepare(w: Int, h: Int, corner: Float?, backing: Int, dark: Boolean, trigger: GlassTriggerConfigRecord) {
    val pad = ((REST_CAPTURE_MARGIN + REST_GUARD) * density).toInt()
    limits.set(-pad, -pad, w + pad, h + pad)
    backdrop.setPosition(limits)
    val fill = backdrop.beginRecording(limits.width(), limits.height())
    fill.drawColor(backing)
    backdrop.endRecording()
    prepareLensState(state, jelly, 0f, 0f, w.toFloat(), h.toFloat(), corner, dark, trigger, menu, density)
  }

  fun release() {
    look?.let { SharedStills.release(it) }
    look = null
    renderer.release()
    live.discardDisplayList()
    backdrop.discardDisplayList()
    waker.removeCallbacks(wakeOnFrame)
  }

  // What a lens at rest looks like: lenses that agree on all of it draw the same pixels.
  private data class LensLook(
    val width: Int, val height: Int, val radius: Float, val fill: Int, val dark: Boolean, val density: Float,
    val blur: Float, val tint: Int?, val tintOpacity: Float?, val viewWidth: Int, val viewHeight: Int,
  )

  private companion object {
    fun copyState(from: GlassSurfaceState, to: GlassSurfaceState) {
      to.incoming.set(from.incoming)
      to.captureBounds.set(from.captureBounds)
      to.lockedFieldStep = from.lockedFieldStep
      to.radiusX = from.radiusX
      to.radiusY = from.radiusY
      to.hasSource = false
      to.smoothing = from.smoothing
      to.lensHeight = from.lensHeight
      to.lensAmount = from.lensAmount
      to.materialProgress = from.materialProgress
      to.surfaceOpacity = from.surfaceOpacity
      to.dark = from.dark
      to.pressX = from.pressX
      to.pressY = from.pressY
      to.pressRadius = from.pressRadius
      to.poolGain = from.poolGain
      to.pressLift = from.pressLift
      to.rimLift = from.rimLift
      to.config = from.config
      to.trigger = from.trigger
    }
  }
}

/** The base's trigger record for a glass value: its frost, its tint, and the upstream base's absorb. */
@Composable
private fun rememberLensTrigger(value: GlassValue): GlassTriggerConfigRecord {
  val tint = value.tint
  return remember(value.material, tint, value.tintOpacity) {
    GlassTriggerConfigRecord(
      blur = value.material.lensBlur,
      tintColor = tint?.let { android.graphics.Color.valueOf(it.toArgb()) },
      tintOpacity = if (tint == null) null else value.tintOpacity?.value ?: LENS_FILL_TINT,
      absorb = GlassAbsorbRecord(duration = 0.48f),
    )
  }
}

/**
 * A lens's press: every touch in it moves the engine's jelly (as React Native's lens base does), an
 * interactive glass also ticks, and [onFrame] runs each display frame while the jelly moves.
 */
private fun Modifier.lensPress(jelly: GlassJelly, interactive: Boolean, onFrame: () -> Unit): Modifier = composed {
  val view = LocalView.current
  var moving by remember { mutableIntStateOf(0) }
  LaunchedEffect(moving) {
    if (moving == 0) return@LaunchedEffect
    var last = 0L
    while (true) {
      val now = withFrameNanos { it }
      if (last != 0L) jelly.advance(((now - last) / 1e9f).coerceAtMost(1f / 30f))
      last = now
      onFrame()
      if (jelly.isSettled) break
    }
  }
  pointerInput(interactive) {
    awaitEachGesture {
      val down = awaitFirstDown(requireUnconsumed = false)
      jelly.down(down.position.x, down.position.y)
      if (interactive) GlassFeedback.tick(view)
      moving++
      while (true) {
        val event = awaitPointerEvent()
        val change = event.changes.firstOrNull { it.id == down.id } ?: break
        if (!change.pressed) break
        jelly.move(change.position.x, change.position.y)
      }
      jelly.release()
      moving++
    }
  }
}

/**
 * Whether the content is a floating region (a floating header, a toolbar, a bar, a FAB): its glass
 * is drawn by the window over what moves behind it ([bloomWindowLens]), as Bloom's React Native
 * `LensMaterialProvider` makes a region's controls float. In the page, glass is drawn in its place.
 */
val LocalFloatingRegion = staticCompositionLocalOf { false }

/** A floating region: its glass is the window's ([LocalFloatingRegion]). */
@Composable
fun FloatingRegion(content: @Composable () -> Unit) {
  CompositionLocalProvider(LocalFloatingRegion provides true, content = content)
}

/**
 * The lens drawn by the window: bloom-lens's resting trigger as its window overlay draws one
 * (`GlassMenuOverlay.drawRestingAnchor`), over the window's backdrop (`GlassBackdrop`: the page,
 * by reference, behind every glass of the window, or its still while that region is quiet), at
 * the view's place in the window. The view's content is drawn there too, after its glass (a
 * portal): in the page it draws nothing, so the page the glass samples never holds the glass. Its
 * touches stay in the page. For what floats (an island, a bar, a FAB); never in a scroll, where
 * the window's lens would not follow the overscroll stretch.
 */
@RequiresApi(Build.VERSION_CODES.TIRAMISU)
private fun Modifier.bloomWindowLens(value: GlassValue, corner: Dp): Modifier = composed {
  val view = LocalView.current
  val density = LocalDensity.current.density
  val surface = remember { WindowSurface(density) }
  surface.dark = LocalDark.current
  surface.trigger = rememberLensTrigger(value)
  surface.corner = if (corner == Dp.Infinity) null else corner.value * density
  surface.base = Colors.background.toArgb()
  DisposableEffect(view) {
    val attach = {
      if (surface.overlay == null) {
        surface.overlay = WindowGlass.obtain(view.rootView as ViewGroup).also { it.add(surface) }
      }
    }
    val listener = object : View.OnAttachStateChangeListener {
      override fun onViewAttachedToWindow(v: View) = attach()
      override fun onViewDetachedFromWindow(v: View) {
        surface.overlay?.remove(surface)
        surface.overlay = null
      }
    }
    view.addOnAttachStateChangeListener(listener)
    if (view.isAttachedToWindow) attach()
    onDispose {
      view.removeOnAttachStateChangeListener(listener)
      surface.overlay?.remove(surface)
      surface.overlay = null
      surface.release()
    }
  }
  this
    .lensPress(surface.jelly, value.interactive) { surface.overlay?.invalidate() }
    .onGloballyPositioned { coordinates ->
      val at = coordinates.positionInWindow()
      val root = surface.overlay?.rootOffset() ?: Offset.Zero
      val size = coordinates.size
      surface.rect.set(at.x - root.x, at.y - root.y, at.x - root.x + size.width, at.y - root.y + size.height)
      surface.overlay?.invalidate()
    }
    .drawWithContent {
      val canvas = drawContext.canvas
      if (!canvas.nativeCanvas.isHardwareAccelerated || surface.overlay == null) {
        // A software capture, or no window yet: the content in its place.
        drawContent()
        return@drawWithContent
      }
      val w = size.width.toInt()
      val h = size.height.toInt()
      surface.content.setPosition(0, 0, w, h)
      val recording = surface.content.beginRecording(w.coerceAtLeast(1), h.coerceAtLeast(1))
      drawContext.canvas = androidx.compose.ui.graphics.Canvas(recording)
      try {
        drawContent()
      } finally {
        drawContext.canvas = canvas
        surface.content.endRecording()
      }
      surface.overlay?.invalidate()
    }
}

/** One glass the window draws: where it is (root px), its look, its jelly and its content. */
@RequiresApi(Build.VERSION_CODES.TIRAMISU)
private class WindowSurface(val density: Float) {
  val jelly = GlassJelly()
  val renderer = GlassRenderer(density, density * FIELD_STEP)
  val state = GlassSurfaceState()
  val content = RenderNode("BloomMaterial.windowContent")
  val rect = RectF()
  var corner: Float? = null
  var dark = false
  var base = android.graphics.Color.BLACK
  var trigger = GlassTriggerConfigRecord()
  var overlay: WindowGlass? = null

  fun release() {
    renderer.release()
    content.discardDisplayList()
  }
}

/**
 * The window's glass layer: one per window root, its direct child, left out of the backdrop's
 * recording (`GlassBackdrop.register`). Draws each surface's glass, then its content, in the order
 * they arrived; takes no touch.
 */
@RequiresApi(Build.VERSION_CODES.TIRAMISU)
private class WindowGlass private constructor(private val root: ViewGroup) : View(root.context) {
  private val surfaces = ArrayList<WindowSurface>()
  private val backdrop = GlassBackdrop.forRoot(root)
  private val limits = Rect()
  private val menu = GlassMenuConfigRecord()
  private val rootAt = IntArray(2)
  private val ownAt = IntArray(2)

  init {
    setWillNotDraw(false)
  }

  fun add(surface: WindowSurface) {
    if (surfaces.isEmpty()) {
      root.addView(this, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
      backdrop.register(this) { surfaces.firstOrNull()?.base ?: android.graphics.Color.BLACK }
    }
    surfaces.add(surface)
    invalidate()
  }

  fun remove(surface: WindowSurface) {
    if (!surfaces.remove(surface)) return
    if (surfaces.isEmpty()) {
      backdrop.unregister(this)
      root.removeView(this)
      byRoot.remove(root)
    }
    invalidate()
  }

  /** Where the root is in the window (its views' window positions, less this). */
  fun rootOffset(): Offset {
    root.getLocationInWindow(rootAt)
    return Offset(rootAt[0].toFloat(), rootAt[1].toFloat())
  }

  override fun onDraw(canvas: Canvas) {
    if (!canvas.isHardwareAccelerated) return
    root.getLocationInWindow(rootAt)
    getLocationInWindow(ownAt)
    val ox = (ownAt[0] - rootAt[0]).toFloat()
    val oy = (ownAt[1] - rootAt[1]).toFloat()
    limits.set(0, 0, root.width, root.height)
    canvas.save()
    canvas.translate(-ox, -oy)
    for (surface in surfaces) {
      val rect = surface.rect
      if (rect.width() < 1f || rect.height() < 1f) continue
      val state = surface.state
      prepareLensState(state, surface.jelly, rect.left, rect.top, rect.width(), rect.height(), surface.corner, surface.dark, surface.trigger, menu, surface.density)
      surface.renderer.prepare(state)
      surface.renderer.drawGlass(canvas, backdrop, state, limits)
      if (surface.renderer.warmPipelines(canvas)) postInvalidateOnAnimation()
      val save = canvas.save()
      canvas.translate(state.incoming.left, state.incoming.top)
      canvas.scale(state.incoming.width() / rect.width(), state.incoming.height() / rect.height())
      canvas.drawRenderNode(surface.content)
      canvas.restoreToCount(save)
    }
    canvas.restore()
  }

  companion object {
    private val byRoot = java.util.WeakHashMap<ViewGroup, WindowGlass>()

    fun obtain(root: ViewGroup): WindowGlass = byRoot.getOrPut(root) { WindowGlass(root) }
  }
}

// bloom-lens's GlassMenuAndroidView constants (its companion is internal to the Expo module).
private const val FIELD_STEP = 4f
private const val LIGHT_RADIUS = 38f
private const val LIGHT_LIFT = .055f
private const val LIGHT_POOL = .07f
private const val LIGHT_RIM_LIFT = .3f
private const val REST_CAPTURE_MARGIN = 16f
private const val REST_GUARD = 24f

/**
 * A lens's state, as bloom-lens's base at rest sets it (`prepareRest` and `applyLight`): its shape
 * at `left, top` (px, the backdrop's coordinates) deformed by the jelly, a capsule unless `corner`
 * is smaller, the trigger's material with no menu and no refraction band, and the jelly's light.
 */
@RequiresApi(Build.VERSION_CODES.TIRAMISU)
private fun prepareLensState(
  state: GlassSurfaceState,
  jelly: GlassJelly,
  left: Float,
  top: Float,
  width: Float,
  height: Float,
  corner: Float?,
  dark: Boolean,
  trigger: GlassTriggerConfigRecord,
  menu: GlassMenuConfigRecord,
  density: Float,
) {
  state.incoming.set(0f, 0f, width, height)
  state.lockedFieldStep = 0f
  jelly.deformControl(state.incoming, density, trigger.jelly)
  state.incoming.offset(left, top)
  state.captureBounds.set(left, top, left + width, top + height)
  state.captureBounds.inset(-REST_CAPTURE_MARGIN * density, -REST_CAPTURE_MARGIN * density)
  val capsule = min(state.incoming.width(), state.incoming.height()) / 2f
  val radius = min(corner ?: capsule, capsule)
  state.radiusX = radius
  state.radiusY = radius
  state.hasSource = false
  state.members.clear()
  state.smoothing = 0f
  state.lensHeight = 0f
  state.lensAmount = 0f
  state.materialProgress = 0f
  state.surfaceOpacity = 1f
  state.dark = dark
  state.config = menu
  state.trigger = trigger
  val glow = jelly.glowValue * trigger.shine
  state.pressX = left + jelly.lightPositionX
  state.pressY = top + jelly.lightPositionY
  state.pressRadius = LIGHT_RADIUS * density
  state.poolGain = LIGHT_POOL * glow
  state.pressLift = LIGHT_LIFT * glow
  state.rimLift = LIGHT_RIM_LIFT * glow
}

/** `LENS_FILL_TINT`: a solid control's tint over its lens (`src/floating/lens/lens-tint.ts`). */
private const val LENS_FILL_TINT = 0.8f

/**
 * `.blur()`: the view floats over the content as an island (Bloom's `BlurIsland`), a capsule unless
 * a `corner` names its radius: the window's lens where the device has the engine
 * ([bloomWindowLens]), else the material's body over the floating level's fill.
 */
fun Modifier.bloomBlur(corner: Dp = Dp.Infinity): Modifier = composed {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) return@composed bloomWindowLens(GlassValue.regular, corner)
  bloomMaterial(materialShape(corner), Colors.popover)
}

/** A capsule (`Dp.Infinity`) or a rounded rectangle. */
fun materialShape(corner: Dp): Shape = if (corner == Dp.Infinity) RoundedCornerShape(50) else RoundedCornerShape(corner)

/** `.dimmed()`: the glass's body under Apple's dimming layer (35% black, `GlassOpacity.dim`). */
private fun dim(color: Color): Color {
  val a = GlassOpacity.dim.value
  return Color(
    red = color.red * (1f - a),
    green = color.green * (1f - a),
    blue = color.blue * (1f - a),
    alpha = color.alpha + (1f - color.alpha) * a,
  )
}

/** A surface's press: the engine's jelly, run each frame while it moves, and the press's haptic. */
private class MaterialPress(val modifier: Modifier)

@Composable
private fun rememberMaterialPress(): MaterialPress {
  val view = LocalView.current
  val density = LocalDensity.current.density
  val jelly = remember { GlassJelly() }
  var frame by remember { mutableIntStateOf(0) }
  var moving by remember { mutableIntStateOf(0) }
  LaunchedEffect(moving) {
    if (moving == 0) return@LaunchedEffect
    var last = 0L
    while (true) {
      val now = withFrameNanos { it }
      if (last != 0L) jelly.advance(((now - last) / 1e9f).coerceAtMost(1f / 30f))
      last = now
      frame++
      if (jelly.isSettled) break
    }
  }
  val rect = remember { RectF() }
  val modifier = Modifier
    .pointerInput(Unit) {
      awaitEachGesture {
        val down = awaitFirstDown(requireUnconsumed = false)
        jelly.down(down.position.x, down.position.y)
        GlassFeedback.tick(view)
        moving++
        while (true) {
          val event = awaitPointerEvent()
          val change = event.changes.firstOrNull { it.id == down.id } ?: break
          if (!change.pressed) break
          jelly.move(change.position.x, change.position.y)
        }
        jelly.release()
        moving++
      }
    }
    .graphicsLayer {
      // Read each frame of the jelly: the layer is drawn again, never measured again.
      frame.let { }
      val w = size.width
      val h = size.height
      if (w <= 0f || h <= 0f) return@graphicsLayer
      rect.set(0f, 0f, w, h)
      jelly.deformControl(rect, density, 1f)
      scaleX = rect.width() / w
      scaleY = rect.height() / h
      translationX = rect.centerX() - w / 2f
      translationY = rect.centerY() - h / 2f
      transformOrigin = TransformOrigin.Center
    }
  return remember(modifier) { MaterialPress(modifier) }
}
