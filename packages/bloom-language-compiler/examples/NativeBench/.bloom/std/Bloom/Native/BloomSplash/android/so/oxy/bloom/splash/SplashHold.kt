// Bloom's splash hold (ADR 0002, section 7): the Android side of
// `extern native "BloomSplash"` (stdlib/Bloom/Splash.bloom).
package so.oxy.bloom.splash

import android.app.Activity
import android.view.View
import android.view.ViewTreeObserver
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.UiThreadUtil

/**
 * Keeps the launch splash (the window's starting splash, Android 12's `SplashScreen` on
 * 12 and later) on screen until the app's first content is ready, by drawing no frame of
 * the activity's window before then.
 *
 * - **Why.** A window that draws at once draws every frame of the loading app (its gates,
 *   placeholders and their animations) on the threads the JS bundle and the first screen
 *   need. Measured on Mention's hybrid build (medians of 12 cold starts): JS `main` at 525
 *   against 622 ms and the first feed row at 895 against 1,148 ms with the splash held, the
 *   Expo build's 532 and 902 ms.
 * - **Until.** The first content of the root view (React Native's `CONTENT_APPEARED`), or,
 *   for an app that called `preventAutoHide`, its `hide`.
 * - **How.** A pre-draw listener on the content view that cancels each draw while held (the
 *   splash stays, layout goes on), as AndroidX's `setKeepOnScreenCondition` does.
 *
 * Once released, the hold stays released for the process: an activity recreated later
 * draws at once.
 */
object SplashHold {
  @Volatile private var held = true
  @Volatile private var prevented = false
  private var content: View? = null

  private val appeared =
    ReactMarker.MarkerListener { name, _, _ ->
      if (name == ReactMarkerConstants.CONTENT_APPEARED && !prevented) release()
    }

  /** Holds `activity`'s first frames (its `onCreate`, after `setContentView`). */
  @JvmStatic
  fun install(activity: Activity) {
    if (!held) return
    val view = activity.findViewById<View>(android.R.id.content) ?: return
    content = view
    ReactMarker.addListener(appeared)
    view.viewTreeObserver.addOnPreDrawListener(
      object : ViewTreeObserver.OnPreDrawListener {
        override fun onPreDraw(): Boolean {
          if (held) return false
          view.viewTreeObserver.removeOnPreDrawListener(this)
          return true
        }
      }
    )
  }

  /** Keeps the splash past the first content, until [release]. */
  fun preventAutoHide() {
    if (held) prevented = true
  }

  /** Draws the app's next frame. */
  fun release() {
    if (!held) return
    held = false
    ReactMarker.removeListener(appeared)
    UiThreadUtil.runOnUiThread {
      content?.invalidate()
      content = null
    }
  }
}
