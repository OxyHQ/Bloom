package so.oxy.bloom.glassmenu.chrome

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Native view of a glass node layer (gallery components of chrome/). Registered in expo-module.config.json.
class SurfaceNodesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GlassSurfaceNodes")

    View(SurfaceNodesHost::class) {
      Events("onNodePress", "onFieldText", "onFieldFocus")

      Prop("nodes") { view: SurfaceNodesHost, nodes: List<Map<String, Any?>>? ->
        view.nodes = (nodes ?: emptyList()).mapNotNull { SurfaceNode.parse(it) }
      }
      Prop("focusedField") { view: SurfaceNodesHost, id: String? ->
        view.focusedField = id
      }
    }
  }
}
