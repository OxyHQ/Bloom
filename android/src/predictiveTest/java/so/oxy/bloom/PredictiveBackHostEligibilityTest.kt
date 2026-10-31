package so.oxy.bloom

import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.lifecycle.Lifecycle
import com.facebook.react.BackNavigationCoordinator
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.uimanager.ThemedReactContext
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Runs the production host gate, independently of the callback's owner supplier. */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
@Suppress("DEPRECATION")
class PredictiveBackHostEligibilityTest {
  private class Fixture : AutoCloseable {
    val controller = Robolectric.buildActivity(ComponentActivity::class.java).setup()
    val activity = controller.get()
    val coordinator = BackNavigationCoordinator()
    val context = ThemedReactContext(BridgeReactContext(activity.application), activity, "test", 1)
    val host = PredictiveBackHost(context)

    init {
      activity.setContentView(host, ViewGroup.LayoutParams(-1, -1))
      controller.visible().windowFocusChanged(true)
      // Only inject the Activity-scoped dependency. Attachment, dispatcher
      // registration, lifecycle and window focus all come from the real View.
      // This avoids starting ReactHost/Hermes just to test View eligibility.
      PredictiveBackHost::class.java.getDeclaredField("coordinator").apply {
        isAccessible = true
        set(host, coordinator)
      }
      coordinator.update(this, true, false)
      host.sessionKey = "history-with-unresolved-target"
      host.previewEnabled = true
    }

    fun owner(): BackPreviewSession.Owner? =
      PredictiveBackHost::class.java.getDeclaredMethod("currentOwner").apply {
        isAccessible = true
      }.invoke(host) as BackPreviewSession.Owner?

    fun callback(): OnBackPressedCallback =
      PredictiveBackHost::class.java.getDeclaredField("callback").apply {
        isAccessible = true
      }.get(host) as OnBackPressedCallback

    override fun close() {
      if (activity.lifecycle.currentState == Lifecycle.State.RESUMED) controller.pause()
      controller.stop().destroy()
    }
  }

  @Test fun attachedHostConsumesBackBeforeDestinationReceivesANativeTag() {
    Fixture().use { test ->
      assertEquals(Lifecycle.State.RESUMED, test.activity.lifecycle.currentState)
      assertTrue(test.host.isAttachedToWindow)
      assertTrue(test.host.hasWindowFocus())
      assertTrue(test.host.isShown)
      assertEquals(0, test.host.destinationTag)
      // Restoring the old `destinationTag <= 0` host guard makes this fail.
      assertNotNull(test.owner())
      assertEquals(0, test.owner()?.destinationTag)
      assertTrue(test.callback().isEnabled)
      assertTrue(test.activity.onBackPressedDispatcher.hasEnabledCallbacks())
    }
  }

  @Test fun unresolvedDestinationDoesNotBypassOtherHostOwnershipRequirements() {
    Fixture().use { test ->
      assertNotNull(test.owner())
      test.host.previewEnabled = false
      assertNull(test.owner())
      assertFalse(test.callback().isEnabled)
      test.host.previewEnabled = true
      assertNotNull(test.owner())
      test.coordinator.update(test, true, true)
      assertNull(test.owner())
      test.coordinator.update(test, true, false)
      assertNotNull(test.owner())
      test.controller.pause()
      assertNull(test.owner())
      assertFalse(test.callback().isEnabled)
    }
  }
}
