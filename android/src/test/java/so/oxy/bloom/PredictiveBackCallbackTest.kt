package so.oxy.bloom

import androidx.activity.BackEventCompat
import androidx.activity.OnBackPressedDispatcher
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class PredictiveBackCallbackTest {
  private class Harness {
    val session = BackPreviewSession()
    var owner = BackPreviewSession.Owner("history-a", 1)
    val completions = mutableListOf<Pair<BackPreviewSession.Owner, Int>>()
    var cancellations = 0
    var systemBacks = 0
    val dispatcher = OnBackPressedDispatcher { systemBacks++ }
    val callback = PredictiveBackCallback(
      session, { owner }, {}, {},
      { cancellations++; session.cancel() },
      { target, id -> completions.add(target to id); true },
    )
    init { callback.isEnabled = true; dispatcher.addCallback(callback) }
    fun start() = dispatcher.dispatchOnBackStarted(BackEventCompat(0f, 0f, 0f, BackEventCompat.EDGE_LEFT))
    fun finish() = dispatcher.onBackPressed()
    fun acknowledge() = session.cancel()
  }

  @Test fun destinationWithoutANativeTagStillConsumesAndCommitsBackOnce() {
    val test = Harness()
    test.owner = BackPreviewSession.Owner("history-with-unresolved-view", 0)
    test.start(); test.finish(); test.finish()
    assertEquals(1, test.completions.size)
    assertEquals(0, test.systemBacks)
    assertEquals(0, test.completions.single().first.destinationTag)
  }

  @Test fun secondGestureRemainsIgnoredIfFirstAcknowledgementArrivesBeforeItsEnd() {
    val test = Harness()
    test.start(); test.finish()
    test.start()
    test.acknowledge()
    test.owner = BackPreviewSession.Owner("history-b", 2)
    test.finish()
    assertEquals(1, test.completions.size)
    assertEquals(0, test.systemBacks)
    test.start(); test.finish()
    assertEquals(2, test.completions.size)
    assertEquals(test.owner, test.completions.last().first)
    assertTrue(test.completions.last().second > test.completions.first().second)
  }

  @Test fun cancellingIgnoredGestureAfterAcknowledgementDoesNotCancelTheNewOwner() {
    val test = Harness()
    test.start(); test.finish(); test.start(); test.acknowledge()
    test.dispatcher.dispatchOnBackCancelled()
    assertEquals(0, test.cancellations)
    test.start(); test.finish()
    assertEquals(2, test.completions.size)
  }

  @Test fun cancellationChangesNeitherHistoryNorCompletionCount() {
    val test = Harness()
    test.start()
    test.dispatcher.dispatchOnBackProgressed(BackEventCompat(20f, 0f, 0.6f, BackEventCompat.EDGE_LEFT))
    assertEquals(0.6f, test.session.progress)
    test.dispatcher.dispatchOnBackCancelled()
    assertEquals(0, test.completions.size)
    assertFalse(test.session.committed)
    assertEquals(1, test.cancellations)
  }

  @Test fun invalidatedEdgeCompletionCannotBecomeANewHardwarePress() {
    val test = Harness()
    test.start()
    test.callback.invalidateGesture()
    test.session.cancel()
    test.owner = BackPreviewSession.Owner("another-account", 3)
    test.finish()
    assertTrue(test.completions.isEmpty())
    test.finish()
    assertEquals(listOf(test.owner), test.completions.map { it.first })
  }

  @Test fun extraHardwareBackIsConsumedUntilTheCommittedTransitionSettles() {
    val test = Harness()
    test.finish(); test.finish()
    assertEquals(1, test.completions.size)
    assertEquals(0, test.systemBacks)
    test.acknowledge(); test.finish()
    assertEquals(2, test.completions.size)
  }
}
