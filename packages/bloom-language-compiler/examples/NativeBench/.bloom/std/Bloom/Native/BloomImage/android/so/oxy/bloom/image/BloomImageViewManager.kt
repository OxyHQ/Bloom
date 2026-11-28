// Bloom's native image view (ADR 0002, section 7): the Android side of
// `extern native "BloomImage"` (stdlib/Bloom/Image.bloom).
package so.oxy.bloom.image

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.viewmanagers.BloomImageViewManagerDelegate
import com.facebook.react.viewmanagers.BloomImageViewManagerInterface

/**
 * The Fabric component `BloomImageView`. [BloomImageViewManagerInterface] and its delegate
 * are React Native's codegen output for the component spec `bloom build` generates from the
 * Bloom interface, so each prop's setter is checked against it.
 *
 * The delegate also takes the box's corners and borders, which a view of its own draws
 * through [BackgroundStyleApplicator] (a round avatar is a corner radius).
 */
@ReactModule(name = BloomImageViewManager.NAME)
class BloomImageViewManager :
  SimpleViewManager<BloomImageView>(), BloomImageViewManagerInterface<BloomImageView> {
  private val generated = BloomImageViewManagerDelegate(this)

  // A delegate of its own around codegen's (a Kotlin subclass of the Java delegate clashes
  // with the interface's JVM-compatibility methods). Its overrides are the JVM names Java
  // calls, as React Native's own `BaseViewManagerDelegate`'s are.
  private val delegate: ViewManagerDelegate<BloomImageView> =
    object : ViewManagerDelegate<BloomImageView> {
      @Suppress("ACCIDENTAL_OVERRIDE")
      override fun setProperty(view: BloomImageView, propName: String, value: Any?) {
        val corner = CORNERS.indexOf(propName)
        when {
          corner >= 0 ->
            BackgroundStyleApplicator.setBorderRadius(
              view,
              BorderRadiusProp.entries[corner],
              LengthPercentage.setFromDynamic(DynamicFromObject(value)),
            )
          propName == ViewProps.BORDER_WIDTH ->
            BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.ALL, (value as? Number)?.toFloat())
          propName == ViewProps.BORDER_COLOR ->
            BackgroundStyleApplicator.setBorderColor(view, LogicalEdge.ALL, (value as? Number)?.toInt())
          else -> generated.setProperty(view, propName, value)
        }
      }

      @Suppress("ACCIDENTAL_OVERRIDE")
      override fun receiveCommand(view: BloomImageView, commandName: String, args: ReadableArray) {
        generated.receiveCommand(view, commandName, args)
      }
    }

  override fun getDelegate(): ViewManagerDelegate<BloomImageView> = delegate

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): BloomImageView = BloomImageView(context)

  override fun onAfterUpdateTransaction(view: BloomImageView) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }

  override fun onDropViewInstance(view: BloomImageView) {
    view.drop()
    super.onDropViewInstance(view)
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topLoad" to mapOf("registrationName" to "onLoad"),
      "topError" to mapOf("registrationName" to "onError"),
    )

  override fun setSource(view: BloomImageView, value: String?) {
    view.source = value
  }

  override fun setHeaders(view: BloomImageView, value: ReadableArray?) {
    view.headers = value?.let { array -> (0 until array.size()).map { array.getString(it) ?: "" } } ?: emptyList()
  }

  override fun setPlaceholder(view: BloomImageView, value: String?) {
    view.placeholder = value
  }

  override fun setContentFit(view: BloomImageView, value: String?) {
    view.contentFit = value ?: "cover"
  }

  override fun setTransition(view: BloomImageView, value: Int) {
    view.transition = value
  }

  override fun setCachePolicy(view: BloomImageView, value: String?) {
    view.cachePolicy = value ?: "memory-disk"
  }

  override fun setRecyclingKey(view: BloomImageView, value: String?) {
    view.recyclingKey = value
  }

  override fun setTint(view: BloomImageView, value: Int) {
    view.tint = value
  }

  override fun setBlurRadius(view: BloomImageView, value: Double) {
    view.blurRadius = value
  }

  companion object {
    const val NAME = "BloomImageView"

    /** The corner props, in [BorderRadiusProp]'s order. */
    private val CORNERS =
      listOf(
        ViewProps.BORDER_RADIUS,
        ViewProps.BORDER_TOP_LEFT_RADIUS,
        ViewProps.BORDER_TOP_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
      )
  }
}
