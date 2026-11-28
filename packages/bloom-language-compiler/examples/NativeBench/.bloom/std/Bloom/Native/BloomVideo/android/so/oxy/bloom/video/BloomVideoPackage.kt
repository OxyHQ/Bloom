// Bloom's native video player (ADR 0002, section 7): the Android side of
// `extern native "BloomVideo"` (stdlib/Bloom/Video.bloom).
package so.oxy.bloom.video

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

/**
 * Registers [BloomVideoModule] as a TurboModule and [BloomVideoViewManager] as the Fabric
 * component `BloomVideoView` (autolinked by `bloom build android`).
 */
class BloomVideoPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeBloomVideoSpec.NAME) BloomVideoModule(reactContext) else null

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    listOf(BloomVideoViewManager())

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeBloomVideoSpec.NAME to
        ReactModuleInfo(
          NativeBloomVideoSpec.NAME,
          BloomVideoModule::class.java.name,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true, // isTurboModule
        )
    )
  }
}
