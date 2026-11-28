// Bloom's native video player (ADR 0002, section 7): the Android side of
// `extern native "BloomVideo"` (stdlib/Bloom/Video.bloom).
package so.oxy.bloom.video

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.BloomVideoViewManagerDelegate
import com.facebook.react.viewmanagers.BloomVideoViewManagerInterface

/**
 * The Fabric component `BloomVideoView`. [BloomVideoViewManagerInterface] and its delegate
 * are React Native's codegen output for the component spec `bloom build` generates from the
 * Bloom interface, so each prop's setter is checked against it.
 */
@ReactModule(name = BloomVideoViewManager.NAME)
class BloomVideoViewManager :
  SimpleViewManager<BloomVideoView>(), BloomVideoViewManagerInterface<BloomVideoView> {
  private val generated = BloomVideoViewManagerDelegate(this)

  // A delegate of its own around codegen's, as `BloomImageViewManager`'s (a Kotlin subclass
  // of the Java delegate clashes with the interface's JVM-compatibility methods).
  private val delegate: ViewManagerDelegate<BloomVideoView> =
    object : ViewManagerDelegate<BloomVideoView> {
      @Suppress("ACCIDENTAL_OVERRIDE")
      override fun setProperty(view: BloomVideoView, propName: String, value: Any?) {
        generated.setProperty(view, propName, value)
      }

      @Suppress("ACCIDENTAL_OVERRIDE")
      override fun receiveCommand(view: BloomVideoView, commandName: String, args: ReadableArray) {
        generated.receiveCommand(view, commandName, args)
      }
    }

  override fun getDelegate(): ViewManagerDelegate<BloomVideoView> = delegate

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): BloomVideoView = BloomVideoView(context)

  override fun onDropViewInstance(view: BloomVideoView) {
    view.drop()
    super.onDropViewInstance(view)
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
    mapOf("topFirstFrame" to mapOf("registrationName" to "onFirstFrame"))

  override fun setPlayer(view: BloomVideoView, value: Int) {
    view.playerId = value
  }

  override fun setContentFit(view: BloomVideoView, value: String?) {
    view.contentFit = value ?: "contain"
  }

  companion object {
    const val NAME = "BloomVideoView"
  }
}
