package so.oxy.bloom.editorlab

import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
    window.decorView.viewTreeObserver.addOnGlobalFocusChangeListener { old, next ->
      android.util.Log.i("EDITOR434_NATIVE", "focus old=" + describeChain(old) + " next=" + describeChain(next))
      observeChain(next)
    }
  }

  private val observedViews = java.util.Collections.newSetFromMap(java.util.WeakHashMap<android.view.View, Boolean>())

  private fun describeChain(view: android.view.View?): String {
    var current = view
    val parts = mutableListOf<String>()
    while (current != null) {
      parts.add(current.javaClass.simpleName + "#" + current.id + "@" + System.identityHashCode(current) + ":" + current.left + "," + current.top)
      current = current.parent as? android.view.View
    }
    return parts.joinToString(" > ")
  }

  private fun observeChain(view: android.view.View?) {
    var current = view
    while (current != null) {
      if (observedViews.add(current)) current.addOnAttachStateChangeListener(object : android.view.View.OnAttachStateChangeListener {
        override fun onViewAttachedToWindow(v: android.view.View) {
          android.util.Log.i("EDITOR434_NATIVE", "attach " + describeChain(v))
        }
        override fun onViewDetachedFromWindow(v: android.view.View) {
          android.util.Log.i("EDITOR434_NATIVE", "detach " + describeChain(v))
        }
      })
      current = current.parent as? android.view.View
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
