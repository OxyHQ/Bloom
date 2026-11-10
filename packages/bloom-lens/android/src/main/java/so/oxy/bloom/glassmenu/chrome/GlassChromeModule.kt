package so.oxy.bloom.glassmenu.chrome

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Native view of the chrome (tab bar, search circle, create circle). Registered in expo-module.config.json.
class GlassChromeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GlassChrome")

    View(GlassChromeHost::class) {
      Events("onTabSelect", "onSearchChange", "onCreate")

      Prop("labels") { view: GlassChromeHost, labels: List<String>? ->
        view.labels = labels ?: emptyList()
      }
      Prop("icons") { view: GlassChromeHost, icons: List<String>? ->
        view.icons = icons ?: emptyList()
      }
      Prop("selectedIndex") { view: GlassChromeHost, index: Int? ->
        view.selectedIndex = index ?: 0
      }
      Prop("bottomInset") { view: GlassChromeHost, inset: Double? ->
        view.bottomInset = (inset ?: 0.0).toFloat()
      }
      Prop("searchPlaceholder") { view: GlassChromeHost, text: String? ->
        view.searchPlaceholder = text ?: "Search"
      }
    }
  }
}
