// Bloom's native storage module (ADR 0002, section 7): the Android side of
// `extern native "BloomStorage"` (stdlib/Bloom/Storage.bloom).
package so.oxy.bloom.storage

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/** Registers [BloomStorageModule] as a TurboModule (autolinked by `bloom build android`). */
class BloomStoragePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeBloomStorageSpec.NAME) BloomStorageModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeBloomStorageSpec.NAME to
        ReactModuleInfo(
          NativeBloomStorageSpec.NAME,
          BloomStorageModule::class.java.name,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true, // isTurboModule
        )
    )
  }
}
