// Bloom's splash hold (ADR 0002, section 7): the Android side of
// `extern native "BloomSplash"` (stdlib/Bloom/Splash.bloom).
package so.oxy.bloom.splash

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

/**
 * `Splash` (`preventAutoHide`, `hide`) over [SplashHold].
 *
 * [NativeBloomSplashSpec] is React Native's codegen output for the spec `bloom build`
 * generates from the Bloom interface, so the Kotlin compiler checks this class against it.
 */
class BloomSplashModule(context: ReactApplicationContext) : NativeBloomSplashSpec(context) {
  override fun preventAutoHide(promise: Promise) {
    SplashHold.preventAutoHide()
    promise.resolve(true)
  }

  override fun hide(promise: Promise) {
    SplashHold.release()
    promise.resolve(true)
  }
}
