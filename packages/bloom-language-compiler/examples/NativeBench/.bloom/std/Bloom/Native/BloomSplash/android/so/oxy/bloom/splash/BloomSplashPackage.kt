// Bloom's splash hold (ADR 0002, section 7): the Android side of
// `extern native "BloomSplash"` (stdlib/Bloom/Splash.bloom).
package so.oxy.bloom.splash

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/** Registers [BloomSplashModule] as a TurboModule (autolinked by `bloom build android`). */
class BloomSplashPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == NativeBloomSplashSpec.NAME) BloomSplashModule(reactContext) else null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
      NativeBloomSplashSpec.NAME to
        ReactModuleInfo(
          NativeBloomSplashSpec.NAME,
          BloomSplashModule::class.java.name,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true, // isTurboModule
        )
    )
  }
}
