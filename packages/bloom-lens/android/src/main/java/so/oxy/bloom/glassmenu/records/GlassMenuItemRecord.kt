package so.oxy.bloom.glassmenu.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class GlassMenuItemRecord : Record {
  @Field val id: String = ""
  @Field val title: String = ""
  @Field val subtitle: String? = null
  @Field val icon: String? = null
  @Field val iconPath: String? = null
  @Field val iconSlot: Int? = null
  @Field val checked: Boolean? = null
  @Field val destructive: Boolean = false
  @Field val disabled: Boolean = false
  @Field val keepOpen: Boolean = false
  @Field val separator: Boolean = false
  @Field val heading: Boolean = false
  // Submenu rows: the child items. Null for plain items.
  @Field val items: List<GlassMenuItemRecord>? = null
  // Action row: its cells (one icon action each), in order. Null for every other row.
  @Field val actions: List<GlassMenuItemRecord>? = null
}
