package so.oxy.bloom.glassmenu.overlay

import so.oxy.bloom.glassmenu.motion.GlassJelly

// The scrub gesture shared by the menu and the chrome: a press on a control deforms it with the jelly, a drag moves the
// jelly with the finger, a release (or a cancel) lets the jelly settle. The controller tracks the item under the finger
// (a row of the menu, a tab of the chrome) so the owner can tell when the finger crosses to another item.
// The highlight, the haptic rule and the selection stay with the owner: they differ between the menu and the chrome.
internal class GlassScrub(private val jelly: GlassJelly) {
  // The item under the finger, NONE when there is none.
  var current: Int = NONE
    private set

  fun press(x: Float, y: Float, item: Int): Boolean {
    jelly.down(x, y)
    return update(item)
  }

  fun drag(x: Float, y: Float, item: Int): Boolean {
    jelly.move(x, y)
    return update(item)
  }

  fun release() {
    jelly.release()
    current = NONE
  }

  fun cancel() = release()

  // True when the item under the finger changed.
  private fun update(item: Int): Boolean {
    val changed = item != current
    current = item
    return changed
  }

  companion object {
    const val NONE = -1
  }
}
