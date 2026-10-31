package so.oxy.bloom

import org.junit.Assert.*
import org.junit.Test

class BackPreviewSessionTest {
  private val first = BackPreviewSession.Owner("account-a:history-2", 42)
  private val second = BackPreviewSession.Owner("account-b:history-2", 42)

  @Test fun cancellationNeverCommitsOrRetainsAPreview() {
    val gesture = BackPreviewSession()
    gesture.begin(first)
    gesture.progress(0.7f)
    gesture.cancel()
    assertNull(gesture.commit(first))
    assertNull(gesture.owner)
    assertEquals(0f, gesture.progress)
  }

  @Test fun changedAccountOrHistoryCannotCommitStartedGesture() {
    val gesture = BackPreviewSession()
    gesture.begin(first)
    assertNull(gesture.commit(second))
    assertFalse(gesture.committed)
  }

  @Test fun nativeDestinationChangeRejectsCommitEvenWithSameRouteKey() {
    val gesture = BackPreviewSession()
    gesture.begin(first)
    assertNull(gesture.commit(first.copy(destinationTag = 43)))
  }

  @Test fun completionIsDeliveredExactlyOnceAndHoldsDestination() {
    val gesture = BackPreviewSession()
    gesture.begin(first)
    assertEquals(first, gesture.commit(first))
    assertNull(gesture.commit(first))
    gesture.progress(0.1f)
    assertEquals(1f, gesture.progress)
    assertTrue(gesture.committed)
  }

  @Test fun nextGestureCanReturnToTheSameHistoryAfterCancellation() {
    val gesture = BackPreviewSession()
    gesture.begin(first)
    gesture.cancel()
    gesture.begin(first)
    assertEquals(first, gesture.commit(first))
  }
}
