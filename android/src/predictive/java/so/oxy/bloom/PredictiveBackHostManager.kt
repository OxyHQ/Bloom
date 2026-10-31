package so.oxy.bloom

import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class PredictiveBackHostManager : ViewGroupManager<PredictiveBackHost>() {
  override fun getName() = "BloomPredictiveBackHost"
  override fun createViewInstance(context: ThemedReactContext) = PredictiveBackHost(context)
  @ReactProp(name = "enabled")
  fun setEnabled(view: PredictiveBackHost, enabled: Boolean) { view.previewEnabled = enabled }
  @ReactProp(name = "destinationTag")
  fun setDestination(view: PredictiveBackHost, tag: Int) { view.destinationTag = tag }
  @ReactProp(name = "sessionKey")
  fun setSession(view: PredictiveBackHost, key: String?) { view.sessionKey = key.orEmpty() }
  @ReactProp(name = "settledGestureId")
  fun setSettledGesture(view: PredictiveBackHost, id: Int) { view.settledGestureId = id }
  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf("topBackCommitted" to mapOf("registrationName" to "onBackCommitted"))
  override fun onDropViewInstance(view: PredictiveBackHost) {
    view.dispose()
    super.onDropViewInstance(view)
  }
}
