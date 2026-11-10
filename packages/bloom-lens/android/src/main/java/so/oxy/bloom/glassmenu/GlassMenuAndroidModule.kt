package so.oxy.bloom.glassmenu

import so.oxy.bloom.glassmenu.records.GlassMenuConfigRecord
import so.oxy.bloom.glassmenu.records.GlassMenuItemRecord
import so.oxy.bloom.glassmenu.records.GlassTriggerConfigRecord
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GlassMenuAndroidModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BloomLensMenu")

    View(GlassMenuAndroidView::class) {
      Events("onItemSelect", "onMenuOpenChange")

      Prop("items") { view: GlassMenuAndroidView, items: List<GlassMenuItemRecord>? ->
        view.items = items ?: emptyList()
      }
      Prop("lens") { view: GlassMenuAndroidView, glass: Boolean? ->
        view.glass = glass ?: true
      }
      Prop("cornerRadius") { view: GlassMenuAndroidView, radius: Float? ->
        view.cornerRadius = radius
      }
      Prop("colorScheme") { view: GlassMenuAndroidView, scheme: String? ->
        view.colorScheme = scheme ?: "auto"
      }
      Prop("menuWidth") { view: GlassMenuAndroidView, width: Float? ->
        view.menuWidth = width
      }
      Prop("fontFamily") { view: GlassMenuAndroidView, family: String? ->
        view.fontFamily = family
      }
      Prop("config") { view: GlassMenuAndroidView, config: GlassMenuConfigRecord? ->
        view.config = config ?: GlassMenuConfigRecord()
      }
      Prop("triggerConfig") { view: GlassMenuAndroidView, config: GlassTriggerConfigRecord? ->
        view.triggerConfig = config ?: GlassTriggerConfigRecord()
      }
      Prop("alignment") { view: GlassMenuAndroidView, alignment: String? ->
        view.alignment = alignment ?: "auto"
      }

      AsyncFunction("open") { view: GlassMenuAndroidView, x: Double?, y: Double?, width: Double?, height: Double? ->
        view.post { view.open(x, y, width, height) }
      }
      AsyncFunction("close") { view: GlassMenuAndroidView ->
        view.post { view.close() }
      }
    }
  }
}
