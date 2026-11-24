package so.oxy.bloom.glassmenu.overlay

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderNode
import android.os.Build
import so.oxy.bloom.glassmenu.backdrop.GlassBackdrop
import android.os.Bundle
import android.provider.Settings
import android.view.Choreographer
import android.view.HapticFeedbackConstants
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.WindowInsets
import android.window.BackEvent
import android.window.OnBackAnimationCallback
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import androidx.annotation.RequiresApi
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.customview.widget.ExploreByTouchHelper
import so.oxy.bloom.glassmenu.GlassMenuAndroidView
import java.util.WeakHashMap
import kotlin.math.min

internal class GlassMenuOverlay private constructor(
  context: Context,
  private val root: ViewGroup,
) : View(context), ViewTreeObserver.OnPreDrawListener, Choreographer.FrameCallback {
  private val anchors = ArrayList<GlassMenuAndroidView>()
  private val density = resources.displayMetrics.density
  private val limits = Rect()
  private val location = IntArray(2)
  private val restRect = RectF()
  private val probe = RectF()
  private val supportsGlass = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
  // The window backdrop (page behind the glass), shared with the tab bar and the other chrome surfaces.
  private val backdropProvider: GlassBackdrop? by lazy { if (supportsGlass) GlassBackdrop.forRoot(root) else null }
  private var session: GlassMenuSession? = null
  private var framePending = false
  private var lastFrameNanos = 0L
  private val accessibility = MenuAccessibility()
  private var backCallback: Any? = null
  private var animationScale = 1f
  private var startupFrames = 0
  // What the overlay draws (the resting lenses and the open menu), in a node of its own: a frame of the page that moves
  // a trigger or redraws its content records it again from the pre-draw, without invalidating the overlay.
  private var drawing: Any? = null
  // The open menu, in a node bounded by what it draws this frame (sessionNode, clipped to it), around a node of its
  // drawing at window coordinates (sessionContent). A frame of the menu alone records only these, without invalidating
  // the overlay, so the window's damage is the menu's area of this frame and the last, not the whole window: the
  // page outside it is not drawn again, and the glass's blur and material run only where the menu is.
  private var sessionNode: Any? = null
  private var sessionContent: Any? = null
  private val sessionBounds = Rect()

  init {
    setWillNotDraw(false)
    isClickable = false
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    ViewCompat.setAccessibilityDelegate(this, accessibility)
  }

  val menuSession get() = session

  fun register(anchor: GlassMenuAndroidView) {
    if (anchor !in anchors) anchors.add(anchor)
    invalidate()
  }

  fun unregister(anchor: GlassMenuAndroidView) {
    if (session?.anchor === anchor) finishSession(notify = false)
    anchors.remove(anchor)
    if (anchors.isEmpty()) {
      root.post {
        if (anchors.isEmpty()) {
          overlays.remove(root)
          root.removeView(this)
        }
      }
    } else {
      invalidate()
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnPreDrawListener(this)
    backdropProvider?.register(this) { if (anchors.firstOrNull()?.isDark() != false) Color.BLACK else Color.WHITE }
  }

  override fun onDetachedFromWindow() {
    backdropProvider?.unregister(this)
    viewTreeObserver.removeOnPreDrawListener(this)
    Choreographer.getInstance().removeFrameCallback(this)
    framePending = false
    if (supportsGlass) {
      (drawing as? RenderNode)?.discardDisplayList()
      (sessionNode as? RenderNode)?.discardDisplayList()
      (sessionContent as? RenderNode)?.discardDisplayList()
    }
    drawing = null
    sessionNode = null
    sessionContent = null
    super.onDetachedFromWindow()
  }

  // The page behind the glass reaches it through the backdrop's node (GlassBackdrop): what is drawn here is recorded
  // again only for a trigger that moved or faded, and from here, into the node onDraw draws, unless the overlay is
  // already invalidated for this frame. An invalidation from a pre-draw would schedule another frame. A trigger whose
  // content redrew records only that content, into the node this overlay already draws (an animated avatar in a
  // header trigger records no glass).
  override fun onPreDraw(): Boolean {
    if (!supportsGlass || !isHardwareAccelerated) return true
    if (anchorsMoved()) {
      if (!isDirty) recordGlass()
    } else if (!isDirty) {
      for (anchor in anchors) if (drawnHere(anchor) && (anchor.isDirty || anchor.contentStale)) anchor.refreshContent()
    }
    return true
  }

  // A view inside [anchor]'s content redrew (GlassMenuAndroidView.onDescendantInvalidated): when that content is drawn
  // here, the window is asked for a frame and the pre-draw records the content again; no view in the page is marked.
  // False when it is not drawn here, or this overlay draws nothing yet: the change goes up the page as usual.
  fun takeContent(anchor: GlassMenuAndroidView, target: View): Boolean {
    if (!supportsGlass || !isAttachedToWindow || !isHardwareAccelerated || !drawnHere(anchor)) return false
    val window = root.parent ?: return false
    window.onDescendantInvalidated(root, target)
    return true
  }

  private fun drawnHere(anchor: GlassMenuAndroidView): Boolean =
    (anchor.drawsGlass && !anchor.inPlace) || session?.anchor === anchor

  private fun anchorsMoved(): Boolean {
    var moved = false
    for (anchor in anchors) {
      if (!drawnHere(anchor)) continue
      anchorRect(anchor, probe)
      val alpha = if (anchor.isShown) anchor.effectiveAlpha() else 0f
      if (probe != anchor.placement || alpha != anchor.placementAlpha) {
        anchor.placement.set(probe)
        anchor.placementAlpha = alpha
        moved = true
      }
      // A group's glasses follow their views: one that moved, arrived or left is drawn again now, and springs on.
      if (anchor.group.measure(anchor)) {
        moved = true
        if (!anchor.group.isSettled) requestFrame()
      }
    }
    return moved
  }

  override fun onDraw(canvas: Canvas) {
    if (!supportsGlass || !canvas.isHardwareAccelerated) {
      session?.drawFallback(canvas)
      return
    }
    canvas.drawRenderNode(recordGlass() ?: return)
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun recordGlass(): RenderNode? {
    if (width <= 0 || height <= 0) return null
    val node = drawing as? RenderNode ?: RenderNode("GlassMenuOverlay").also { drawing = it }
    node.setPosition(0, 0, width, height)
    val canvas = node.beginRecording(width, height)
    try {
      drawGlass(canvas, session)
    } finally {
      node.endRecording()
    }
    return node
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun drawGlass(canvas: Canvas, active: GlassMenuSession?) {
    val page = backdropProvider ?: return
    limits.set(0, 0, width, height)

    for (anchor in anchors) {
      // A trigger that draws its lens in place (restBackdrop) is drawn here only while its menu is open.
      if (anchor !== active?.anchor && anchor.drawsGlass && !anchor.inPlace) drawRestingAnchor(canvas, page, anchor)
    }
    if (active != null) canvas.drawRenderNode(recordSession(active, page))
  }

  // The menu's drawing, and the node that bounds it to what it draws this frame (GlassMenuSession.drawnBounds).
  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun recordSession(active: GlassMenuSession, page: GlassBackdrop): RenderNode {
    val content = sessionContent as? RenderNode ?: RenderNode("GlassMenu.session").also { sessionContent = it }
    content.setPosition(0, 0, width, height)
    val drawing = content.beginRecording(width, height)
    try {
      active.draw(drawing, page, limits)
    } finally {
      content.endRecording()
    }
    active.drawnBounds(sessionBounds, limits)
    val node = sessionNode as? RenderNode ?: RenderNode("GlassMenu.sessionBounds").also { sessionNode = it }
    node.setPosition(sessionBounds)
    val bounded = node.beginRecording(sessionBounds.width().coerceAtLeast(1), sessionBounds.height().coerceAtLeast(1))
    bounded.translate(-sessionBounds.left.toFloat(), -sessionBounds.top.toFloat())
    bounded.drawRenderNode(content)
    node.endRecording()
    return node
  }

  // A frame of the menu alone: its nodes again, and a frame of the window asked for, with nothing in the page or the
  // overlay marked (the overlay's node draws the menu's node, and only that changed). An overlay already marked, or
  // not drawn yet, is drawn again as a whole.
  private fun redrawSession(active: GlassMenuSession) {
    val page = backdropProvider
    val window = root.parent
    if (!supportsGlass || !isHardwareAccelerated || page == null || window == null || drawing == null || isDirty ||
      width <= 0 || height <= 0) {
      invalidate()
      return
    }
    limits.set(0, 0, width, height)
    recordSession(active, page)
    window.onDescendantInvalidated(root, this)
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun drawRestingAnchor(canvas: Canvas, page: GlassBackdrop, anchor: GlassMenuAndroidView) {
    if (!anchor.isShown || anchor.width == 0 || anchor.height == 0) return
    val opacity = anchor.effectiveAlpha()
    if (opacity <= 0f) return
    val state = anchor.surfaceState
    anchorRect(anchor, restRect)
    state.incoming.set(restRect)
    state.captureBounds.set(restRect)
    state.captureBounds.inset(-RestCaptureMargin * density, -RestCaptureMargin * density)
    state.lockedFieldStep = 0f
    anchor.jelly.deformControl(state.incoming, density, anchor.triggerConfig.jelly)
    val radius = anchor.cornerRadiusPx(state.incoming)
    state.radiusX = radius
    state.radiusY = radius
    state.hasSource = false
    state.smoothing = 0f
    state.lensHeight = 0f
    state.lensAmount = 0f
    state.materialProgress = 0f
    state.surfaceOpacity = opacity
    state.dark = anchor.isDark()
    state.config = anchor.config
    state.trigger = anchor.triggerConfig
    anchor.applyLight(state, restRect, 1f)
    // A group draws its glasses, and none while it has none (its first views not laid out yet).
    if (anchor.group.place(state.members, state.incoming, anchor.width, anchor.height, density)) {
      val renderer = anchor.renderer(density)
      renderer.prepare(state)
      renderer.drawGlass(canvas, page, state, limits)
      if (renderer.warmPipelines(canvas)) post { invalidate() }
    }
    val content = anchor.recordContent()
    content.alpha = opacity
    content.setScaleX(state.incoming.width() / anchor.width)
    content.setScaleY(state.incoming.height() / anchor.height)
    val save = canvas.save()
    canvas.translate(state.incoming.left, state.incoming.top)
    canvas.drawRenderNode(content)
    canvas.restoreToCount(save)
  }

  fun anchorRect(anchor: View, out: RectF) {
    anchor.getLocationInWindow(location)
    val x = location[0].toFloat()
    val y = location[1].toFloat()
    getLocationInWindow(location)
    out.set(x - location[0], y - location[1], x - location[0] + anchor.width, y - location[1] + anchor.height)
  }

  fun open(anchor: GlassMenuAndroidView, through: RectF?) {
    if (session?.anchor !== anchor) finishSession(notify = true)
    val current = session
    if (current != null) {
      current.reopen()
    } else {
      session = GlassMenuSession(this, anchor, density, supportsGlass, through, width, height, insets())
    }
    startupFrames = StartupFrames
    isFocusable = true
    isFocusableInTouchMode = true
    requestFocus()
    registerBack()
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
    accessibility.invalidateRoot()
    anchor.notifyOpenChange(true)
    requestFrame()
    invalidate()
  }

  private fun insets(): Rect {
    val window = rootWindowInsets ?: return Rect()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val insets = window.getInsets(WindowInsets.Type.systemBars())
      return Rect(insets.left, insets.top, insets.right, insets.bottom)
    }
    @Suppress("DEPRECATION")
    return Rect(window.systemWindowInsetLeft, window.systemWindowInsetTop, window.systemWindowInsetRight, window.systemWindowInsetBottom)
  }

  fun requestClose() {
    val active = session ?: return
    if (!active.expanded) return
    active.close()
    releaseInput()
    active.anchor.notifyOpenChange(false)
    requestFrame()
  }

  private fun releaseInput() {
    clearFocus()
    isFocusable = false
    isFocusableInTouchMode = false
    unregisterBack()
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  private fun finishSession(notify: Boolean) {
    val active = session ?: return
    active.release()
    session = null
    if (supportsGlass) {
      (sessionNode as? RenderNode)?.discardDisplayList()
      (sessionContent as? RenderNode)?.discardDisplayList()
    }
    releaseInput()
    if (notify && active.expanded) active.anchor.notifyOpenChange(false)
    active.anchor.onSessionFinished()
    invalidate()
  }

  fun requestFrame() {
    if (framePending || !isAttachedToWindow) return
    framePending = true
    lastFrameNanos = 0L
    animationScale = Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
    Choreographer.getInstance().postFrameCallback(this)
  }

  override fun doFrame(frameTimeNanos: Long) {
    framePending = false
    val scale = animationScale
    val interval = 1f / (display?.refreshRate ?: DefaultRefreshRate).coerceAtLeast(MinimumRefreshRate)
    val elapsed = if (lastFrameNanos == 0L) interval / 2f else (frameTimeNanos - lastFrameNanos) / 1_000_000_000f
    val limit = interval * (if (startupFrames > 0) 1f else MaxSkippedFrames)
    startupFrames = (startupFrames - 1).coerceAtLeast(0)
    val seconds = if (scale == 0f) 10f else min(elapsed, limit) / scale
    lastFrameNanos = frameTimeNanos
    var running = false
    val active = session
    // A resting lens the overlay draws moved (its press jelly, its group's springs): the overlay is drawn again whole.
    var restingMoved = false
    for (anchor in anchors) {
      val wasSettled = anchor.jelly.isSettled
      anchor.jelly.advance(seconds * anchor.config.speed)
      if (!anchor.jelly.isSettled) running = true
      if (!wasSettled || !anchor.jelly.isSettled) anchor.jellyFrame()
      val groupWasSettled = anchor.group.isSettled
      anchor.group.advance(seconds)
      if (!anchor.group.isSettled) running = true
      val moved = !wasSettled || !anchor.jelly.isSettled || !groupWasSettled || !anchor.group.isSettled
      if (moved && anchor !== active?.anchor && drawnHere(anchor)) restingMoved = true
    }
    var drawn = false
    if (active != null) {
      val speed = active.anchor.config.speed
      // notify: a predictive back that finished the root still has to report the menu closed to its anchor.
      if (active.tick(seconds * speed)) {
        finishSession(notify = true)
      } else {
        running = running || active.needsFrame
        if (!restingMoved) {
          redrawSession(active)
          drawn = true
        }
      }
    }
    if (!drawn) invalidate()
    if (running) {
      framePending = true
      Choreographer.getInstance().postFrameCallback(this)
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (oldw != 0 && oldh != 0) finishSession(notify = true)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    val active = session ?: return false
    if (!active.expanded) return false
    active.onTouch(event)
    requestFrame()
    return true
  }

  fun hapticTick() = GlassFeedback.tick(this)

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (session?.expanded == true && event.keyCode == KeyEvent.KEYCODE_BACK) {
      if (event.action == KeyEvent.ACTION_UP) requestClose()
      return true
    }
    return super.dispatchKeyEvent(event)
  }

  private fun registerBack() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || backCallback != null) return
    val dispatcher = findOnBackInvokedDispatcher() ?: return
    val callback: OnBackInvokedCallback =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) PredictiveBack() else OnBackInvokedCallback { requestClose() }
    dispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_OVERLAY, callback)
    backCallback = callback
  }

  // Predictive back (Android 14+). With a submenu open the gesture drives it back into its row, frame by frame;
  // with only the root open, the menu closes with its own close animation. The app is never closed while the
  // menu is open: this callback consumes the back event.
  @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  private inner class PredictiveBack : OnBackAnimationCallback {
    override fun onBackStarted(backEvent: BackEvent) {
      session?.backGestureStart()
    }

    override fun onBackProgressed(backEvent: BackEvent) {
      session?.backGestureProgress(backEvent.progress)
    }

    override fun onBackCancelled() {
      session?.backGestureCancel()
    }

    override fun onBackInvoked() {
      val active = session
      if (active == null || !active.backGestureInvoke()) requestClose()
    }
  }

  private fun unregisterBack() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
    val callback = backCallback as? OnBackInvokedCallback ?: return
    findOnBackInvokedDispatcher()?.unregisterOnBackInvokedCallback(callback)
    backCallback = null
  }

  override fun dispatchHoverEvent(event: MotionEvent): Boolean =
    accessibility.dispatchHoverEvent(event) || super.dispatchHoverEvent(event)

  private inner class MenuAccessibility : ExploreByTouchHelper(this) {
    override fun getVirtualViewAt(x: Float, y: Float): Int =
      session?.rowIndexAt(x, y)?.takeIf { it >= 0 } ?: INVALID_ID

    override fun getVisibleVirtualViews(ids: MutableList<Int>) {
      session?.accessibleRows()?.forEach { ids.add(it.index) }
    }

    override fun onPopulateNodeForVirtualView(id: Int, node: AccessibilityNodeInfoCompat) {
      val row = session?.accessibleRows()?.firstOrNull { it.index == id }
      node.text = row?.item?.title ?: ""
      node.className = "android.widget.Button"
      node.isCheckable = row?.item?.checked != null
      node.isChecked = row?.item?.checked == true
      node.isEnabled = row?.selectable == true
      node.isClickable = row?.selectable == true
      if (row?.selectable == true) node.addAction(AccessibilityNodeInfoCompat.ACTION_CLICK)
      val bounds = session?.screenRect(row) ?: Rect(0, 0, 1, 1)
      @Suppress("DEPRECATION")
      node.setBoundsInParent(bounds)
    }

    override fun onPerformActionForVirtualView(id: Int, action: Int, arguments: Bundle?): Boolean {
      if (action != AccessibilityNodeInfoCompat.ACTION_CLICK) return false
      session?.select(id) ?: return false
      return true
    }
  }

  companion object {
    private const val RestCaptureMargin = 16f
    private const val DefaultRefreshRate = 60f
    private const val MinimumRefreshRate = 30f
    private const val MaxSkippedFrames = 2.5f
    private const val StartupFrames = 4

    private val overlays = WeakHashMap<ViewGroup, GlassMenuOverlay>()

    fun obtain(root: ViewGroup): GlassMenuOverlay = overlays.getOrPut(root) {
      GlassMenuOverlay(root.context, root).also { overlay ->
        root.post {
          if (overlay.parent == null && overlay.anchors.isNotEmpty()) {
            root.addView(overlay, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
          }
        }
      }
    }
  }
}
