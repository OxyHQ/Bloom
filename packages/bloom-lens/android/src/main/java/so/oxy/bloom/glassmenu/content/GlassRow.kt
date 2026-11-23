package so.oxy.bloom.glassmenu.content

import android.graphics.RectF
import so.oxy.bloom.glassmenu.records.GlassMenuItemRecord

internal class GlassRow(val item: GlassMenuItemRecord, val index: Int, val back: Boolean = false) {
  val rect = RectF()
  // A submenu row: chevron; a tap enters the submenu panel (navigation).
  val submenu: Boolean get() = !back && item.items != null
  var title: CharSequence = ""
  var subtitle: CharSequence? = null
  val isSeparator get() = item.separator
  val isHeading get() = item.heading
  val selectable get() = !item.separator && !item.heading && !item.disabled
  // Action row cell: its column (0-based) of `columns`; -1 for every other row.
  var column = -1
  var columns = 1
  val isAction: Boolean get() = column >= 0
}
