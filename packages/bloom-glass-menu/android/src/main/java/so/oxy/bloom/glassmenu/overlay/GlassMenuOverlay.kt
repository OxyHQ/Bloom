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
    super.onDetachedFromWindow()
  }

  override fun onPreDraw(): Boolean {
    if (backdropChanged() or anchorsMoved()) invalidate()
    return true
  }

  private fun backdropChanged(): Boolean {
    for (index in 0 until root.childCount) {
      val child = root.getChildAt(index)
      if (child !== this && child.isDirty) return true
    }
    return false
  }

  private fun anchorsMoved(): Boolean {
    var moved = false
    for (anchor in anchors) {
      if (!anchor.drawsGlass && session?.anchor !== anchor) continue
      anchorRect(anchor, probe)
      val alpha = if (anchor.isShown) anchor.effectiveAlpha() else 0f
      if (probe != anchor.placement || alpha != anchor.placementAlpha) {
        anchor.placement.set(probe)
        anchor.placementAlpha = alpha
        moved = true
      }
    }
    return moved
  }

  override fun onDraw(canvas: Canvas) {
    limits.set(0, 0, width, height)
    val active = session
    if (!supportsGlass || !canvas.isHardwareAccelerated) {
      active?.drawFallback(canvas)
      return
    }
    drawGlass(canvas, active)
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun drawGlass(canvas: Canvas, active: GlassMenuSession?) {
    val node = backdropProvider?.node ?: return

    for (anchor in anchors) {
      if (anchor !== active?.anchor && anchor.drawsGlass) drawRestingAnchor(canvas, node, anchor)
    }
    active?.draw(canvas, node, limits)
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  private fun drawRestingAnchor(canvas: Canvas, node: RenderNode, anchor: GlassMenuAndroidView) {
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
    val renderer = anchor.renderer(density)
    renderer.prepare(state)
    renderer.drawGlass(canvas, node, state, limits)
    if (renderer.warmPipelines(canvas)) post { invalidate() }
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
    for (anchor in anchors) {
      anchor.jelly.advance(seconds * anchor.config.speed)
      if (!anchor.jelly.isSettled) running = true
    }
    val active = session
    if (active != null) {
      val speed = active.anchor.config.speed
      // notify: a predictive back that finished the root still has to report the menu closed to its anchor.
      if (active.tick(seconds * speed)) finishSession(notify = true) else running = running || active.needsFrame
    }
    invalidate()
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
