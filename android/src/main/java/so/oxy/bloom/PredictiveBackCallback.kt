package so.oxy.bloom

import androidx.activity.BackEventCompat
import androidx.activity.OnBackPressedCallback
import java.util.concurrent.atomic.AtomicInteger

/** AndroidX callback ownership, separate from the host's retained-view painting. */
internal class PredictiveBackCallback(
  private val session: BackPreviewSession,
  private val currentOwner: () -> BackPreviewSession.Owner?,
  private val onStart: (Int) -> Unit,
  private val onProgress: () -> Unit,
  private val onCancel: () -> Unit,
  private val onCommit: (BackPreviewSession.Owner, Int) -> Boolean,
) : OnBackPressedCallback(false) {
  var gestureId = 0
    private set
  private var gestureStarted = false
  private var invalidatedGesture = false
  private var ignoredGesture = false

  fun invalidateGesture() {
    invalidatedGesture = invalidatedGesture || gestureStarted
  }

  override fun handleOnBackStarted(event: BackEventCompat) {
    // Keep this gesture ignored even if the preceding completion is acknowledged
    // before its end event. Otherwise that end could look like a hardware Back.
    if (session.committed) { ignoredGesture = true; return }
    ignoredGesture = false
    session.cancel()
    gestureId = nextGestureId.incrementAndGet()
    gestureStarted = true
    invalidatedGesture = false
    onStart(event.swipeEdge)
    currentOwner()?.let(session::begin)
  }

  override fun handleOnBackProgressed(event: BackEventCompat) {
    if (ignoredGesture || invalidatedGesture) return
    session.progress(event.progress)
    onProgress()
  }

  override fun handleOnBackCancelled() {
    if (ignoredGesture) { ignoredGesture = false; return }
    if (session.committed) return
    gestureStarted = false
    invalidatedGesture = false
    onCancel()
  }

  override fun handleOnBackPressed() {
    if (ignoredGesture) { ignoredGesture = false; return }
    if (session.committed) return
    if (invalidatedGesture) { gestureStarted = false; invalidatedGesture = false; return }
    val owner = currentOwner() ?: return
    if (!gestureStarted) { gestureId = nextGestureId.incrementAndGet(); session.begin(owner) }
    gestureStarted = false
    if (session.commit(owner) == null) return
    if (!onCommit(owner, gestureId)) session.cancel()
    onProgress()
  }

  companion object { private val nextGestureId = AtomicInteger() }
}
