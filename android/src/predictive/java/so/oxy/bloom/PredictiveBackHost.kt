package so.oxy.bloom

import android.animation.ValueAnimator
import android.graphics.Canvas
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.MotionEvent
import androidx.activity.BackEventCompat
import androidx.activity.findViewTreeOnBackPressedDispatcherOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.findViewTreeLifecycleOwner
import com.facebook.react.ReactActivity
import com.facebook.react.BackNavigationCoordinator
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

/** Draws the existing retained destination; it never mounts, reparents or focuses a page. */
class PredictiveBackHost(private val reactContext: ThemedReactContext) : ViewGroup(reactContext) {
  var previewEnabled = false
    set(value) { if (field != value) { field = value; ownershipChanged() } }
  var destinationTag = 0
    set(value) { if (field != value) { field = value; ownershipChanged() } }
  var sessionKey = ""
    set(value) { if (field != value) { field = value; ownershipChanged() } }

  var settledGestureId = 0
    set(value) {
      field = value
      if (value == callback.gestureId && session.committed) {
        session.cancel()
        invalidate()
        updateEligibility()
      }
    }
  private val session = BackPreviewSession()
  private var lifecycleOwner: LifecycleOwner? = null
  private var destination: View? = null
  private var resolvedDestinationTag = 0
  private var initialized = false
  private var edge = BackEventCompat.EDGE_LEFT
  private var animator: ValueAnimator? = null
  private var registered = false
  private var coordinator: BackNavigationCoordinator? = null
  private val ownershipListener = Runnable { updateEligibility() }
  private val lifecycleObserver = LifecycleEventObserver { _, _ -> updateEligibility() }

  private val callback = PredictiveBackCallback(
    session = session,
    currentOwner = ::currentOwner,
    onStart = { swipeEdge -> animator?.cancel(); edge = swipeEdge },
    onProgress = { invalidate() },
    onCancel = { animateTo(0f) { session.cancel(); invalidate(); updateEligibility() } },
    onCommit = { owner, gestureId ->
      val dispatcher = UIManagerHelper.getEventDispatcher(reactContext)
      if (dispatcher == null) false else {
        dispatcher.dispatchEvent(BackCommittedEvent(UIManagerHelper.getSurfaceId(this), id, owner.key, gestureId))
        true
      }
    },
  )

  init { clipChildren = true; clipToPadding = true; initialized = true }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    coordinator = (reactContext.currentActivity as? ReactActivity)?.backNavigationCoordinator
    coordinator?.addListener(ownershipListener)
    lifecycleOwner = findViewTreeLifecycleOwner()
    lifecycleOwner?.lifecycle?.addObserver(lifecycleObserver)
    findViewTreeOnBackPressedDispatcherOwner()?.let { owner ->
      // Lifecycle enablement is additionally checked below: an underlying root
      // may remain STARTED while a pushed screen owns Back.
      owner.onBackPressedDispatcher.addCallback(callback)
      registered = true
    }
    updateEligibility()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (oldw != w || oldh != h) ownershipChanged()
  }

  override fun onDetachedFromWindow() { dispose(); super.onDetachedFromWindow() }
  override fun onVisibilityChanged(changedView: View, visibility: Int) {
    super.onVisibilityChanged(changedView, visibility)
    if (initialized) updateEligibility()
  }

  override fun onWindowFocusChanged(hasWindowFocus: Boolean) {
    super.onWindowFocusChanged(hasWindowFocus)
    updateEligibility()
  }

  fun dispose() {
    animator?.cancel()
    animator = null
    callback.remove()
    callback.isEnabled = false
    registered = false
    coordinator?.removeListener(ownershipListener)
    coordinator = null
    lifecycleOwner?.lifecycle?.removeObserver(lifecycleObserver)
    lifecycleOwner = null
    destination = null
    resolvedDestinationTag = 0
    session.cancel()
    callback.invalidateGesture()
  }

  private fun currentOwner(): BackPreviewSession.Owner? {
    if (coordinator?.isNativeNavigationEnabled != true || coordinator?.isJavaScriptEnabled != false ||
      !registered || !previewEnabled || sessionKey.isEmpty() || destinationTag <= 0 ||
      !isAttachedToWindow || !hasWindowFocus() || !isShown ||
      lifecycleOwner?.lifecycle?.currentState != Lifecycle.State.RESUMED) return null
    if (resolvedDestinationTag != destinationTag || destination == null) {
      val manager = UIManagerHelper.getUIManagerForReactTag(reactContext, destinationTag) ?: return null
      val target = try { manager.resolveView(destinationTag) } catch (_: IllegalViewOperationException) { null }
      destination = target?.takeIf { it !== this }
      resolvedDestinationTag = destinationTag
    }
    return BackPreviewSession.Owner(sessionKey, destinationTag)
  }

  private fun ownershipChanged() {
    animator?.cancel()
    session.cancel()
    destination = null
    resolvedDestinationTag = 0
    callback.invalidateGesture()
    invalidate()
    updateEligibility()
  }

  private fun updateEligibility() {
    val owner = currentOwner()
    if (session.owner != null && owner != session.owner) {
      animator?.cancel()
      session.cancel()
      callback.invalidateGesture()
      invalidate()
    }
    callback.isEnabled = owner != null
  }

  private fun animateTo(value: Float, complete: () -> Unit) {
    animator?.cancel()
    if (session.owner == null) { complete(); return }
    if (Build.VERSION.SDK_INT >= 26 && !ValueAnimator.areAnimatorsEnabled()) { session.progress(value); complete(); return }
    animator = ValueAnimator.ofFloat(session.progress, value).apply {
      duration = 160
      addUpdateListener { session.progress(it.animatedValue as Float); invalidate() }
      addListener(object : android.animation.AnimatorListenerAdapter() {
        private var cancelled = false
        override fun onAnimationCancel(animation: android.animation.Animator) { cancelled = true }
        override fun onAnimationEnd(animation: android.animation.Animator) { if (!cancelled) complete() }
      })
      start()
    }
  }

  override fun dispatchDraw(canvas: Canvas) {
    val target = destination
    if (session.owner == null || target == null || target.width <= 0 || target.height <= 0) { super.dispatchDraw(canvas); return }
    val progress = session.progress
    val destinationSave = canvas.save()
    canvas.scale(width.toFloat() / target.width, height.toFloat() / target.height)
    target.draw(canvas)
    canvas.restoreToCount(destinationSave)
    val sourceSave = canvas.save()
    val direction = if (edge == BackEventCompat.EDGE_LEFT) 1 else -1
    val translation = if (session.committed) width.toFloat() else width * 0.25f * progress
    canvas.translate(direction * translation, 0f)
    val scale = 1f - 0.05f * progress
    canvas.scale(scale, scale, width / 2f, height / 2f)
    super.dispatchDraw(canvas)
    canvas.restoreToCount(sourceSave)
  }

  // Fabric lays out the React children. The host only changes drawing during a gesture.
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) = Unit

  // The drawn destination is not yet the interactive route. A second touch must
  // not operate the source pager or commit a competing swipe during handoff.
  override fun onInterceptTouchEvent(event: MotionEvent): Boolean =
    session.owner != null || super.onInterceptTouchEvent(event)

  override fun onTouchEvent(event: MotionEvent): Boolean =
    session.owner != null || super.onTouchEvent(event)
}

private class BackCommittedEvent(surfaceId: Int, viewId: Int, private val key: String, private val gestureId: Int) : Event<BackCommittedEvent>(surfaceId, viewId) {
  override fun getEventName() = "topBackCommitted"
  override fun canCoalesce() = false
  override fun getEventData() = Arguments.createMap().apply { putString("sessionKey", key); putInt("gestureId", gestureId) }
}
