// Bloom's native image view (ADR 0002, section 7): the Android side of
// `extern native "BloomImage"` (stdlib/Bloom/Image.bloom).
package so.oxy.bloom.image

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

/**
 * Registers [BloomImageModule] as a TurboModule and [BloomImageViewManager] as the Fabric
 * component `BloomImageView` (autolinked by `bloom build android`).
 */
class BloomImagePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeBloomImageSpec.NAME) BloomImageModule(reactContext) else null

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    listOf(BloomImageViewManager())

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeBloomImageSpec.NAME to
        ReactModuleInfo(
          NativeBloomImageSpec.NAME,
          BloomImageModule::class.java.name,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true, // isTurboModule
        )
    )
  }
}
