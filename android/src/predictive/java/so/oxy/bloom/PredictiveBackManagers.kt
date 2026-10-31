package so.oxy.bloom

import com.facebook.react.uimanager.ViewManager
internal object PredictiveBackManagers {
  fun create(): List<ViewManager<*, *>> = listOf(PredictiveBackHostManager())
}
