package so.oxy.bloom

import com.facebook.react.bridge.BridgeReactContext
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class ComposerLightCapabilityTest {
  @Test @Config(sdk = [30])
  fun oldAndroidDoesNotRegisterHardwareView() {
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    assertFalse(BloomPackage().createViewManagers(context).any { it.name == "BloomComposerLightV1" })
  }

  @Test @Config(sdk = [31])
  fun android12RegistersVersionedHardwareContract() {
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    val manager = BloomPackage().createViewManagers(context).single { it.name == "BloomComposerLightV1" }
    assertEquals(mapOf("registrationName" to "onUnsupported"), manager.exportedCustomDirectEventTypeConstants!!["topUnsupported"])
  }
}
