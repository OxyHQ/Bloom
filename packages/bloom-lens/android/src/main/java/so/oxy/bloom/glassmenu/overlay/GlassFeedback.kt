package so.oxy.bloom.glassmenu.overlay

import android.os.Build
import android.view.HapticFeedbackConstants
import android.view.View

// The haptic feedback of the glass gestures. Used by the menu (a row changes under the finger) and by the chrome
// (a tab changes under the dragged pill): the same constant on the same API levels.
internal object GlassFeedback {
  fun tick(view: View) {
    val constant = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      HapticFeedbackConstants.SEGMENT_FREQUENT_TICK
    } else {
      HapticFeedbackConstants.CLOCK_TICK
    }
    view.performHapticFeedback(constant)
  }
}
