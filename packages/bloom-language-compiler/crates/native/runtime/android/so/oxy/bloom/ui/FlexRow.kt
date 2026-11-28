package so.oxy.bloom.ui

import androidx.compose.foundation.layout.RowScope
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.HorizontalAlignmentLine
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measured
import androidx.compose.ui.layout.ParentDataModifier
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp

/**
 * A child's place in a [FlexRow]: `.grow()` is a weight (the room left, as Compose's `Row` gives
 * it), `.shrink(…)` a flex-shrink factor (React Native's: `.first` 10, `.normal` 1), `.align` its
 * own cross alignment.
 */
internal class FlexItem(
  var weight: Float = 0f,
  var fill: Boolean = true,
  var shrink: Float = 0f,
  var align: Alignment.Vertical? = null,
)

private class FlexData(private val update: FlexItem.() -> Unit) : ParentDataModifier {
  override fun Density.modifyParentData(parentData: Any?): Any = ((parentData as? FlexItem) ?: FlexItem()).apply(update)
}

/** The scope a Bloom `HStack`'s content is in: Compose's `RowScope`, over a [FlexRow]. */
object FlexRowScope : RowScope {
  override fun Modifier.weight(weight: Float, fill: Boolean): Modifier {
    require(weight > 0f) { "invalid weight $weight; must be greater than zero" }
    return this.then(FlexData { this.weight = weight; this.fill = fill })
  }

  override fun Modifier.align(alignment: Alignment.Vertical): Modifier = this.then(FlexData { align = alignment })

  // Baselines are not a flex row's: a child aligned by one keeps the row's alignment.
  override fun Modifier.alignByBaseline(): Modifier = this

  override fun Modifier.alignBy(alignmentLine: HorizontalAlignmentLine): Modifier = this

  override fun Modifier.alignBy(alignmentLineBlock: (Measured) -> Int): Modifier = this
}

/** In a [FlexRow]: gives way when the row is too narrow, by `factor` times its width (flex-shrink). */
fun Modifier.flexShrink(factor: Float): Modifier = this.then(FlexData { shrink = factor })

/**
 * A Bloom stack's row, laid out as React Native's flexbox lays out an `HStack`: the children
 * marked neither `.grow()` nor `.shrink(…)` take their width first, in order, and never give way
 * (a name line's time, its badge); when the row is too narrow for the rest, the shrinking children
 * give way by their factor times their width (the handle, `.first`, before the name), each down
 * to nothing and its text ellipsized; the growing children then share the room left by weight.
 * A row with neither is laid out as Compose's `Row` lays it out.
 */
@Composable
fun FlexRow(
  spacing: Dp,
  across: Alignment.Vertical,
  modifier: Modifier = Modifier,
  content: @Composable RowScope.() -> Unit,
) {
  Layout(content = { FlexRowScope.content() }, modifier = modifier) { measurables, constraints ->
    val gap = spacing.roundToPx()
    val n = measurables.size
    val items = measurables.map { (it.parentData as? FlexItem) ?: FlexItem() }
    val bounded = constraints.hasBoundedWidth
    val max = if (bounded) constraints.maxWidth else Int.MAX_VALUE
    // Unbounded (a horizontal scroll): each child at its own width.
    val child = { w: Int -> Constraints(0, if (bounded) w else Constraints.Infinity, 0, constraints.maxHeight) }
    val placeables = arrayOfNulls<Placeable>(n)
    var used = if (n > 1) gap * (n - 1) else 0
    // The rigid children: their own width, in order, from the room there is.
    for (i in 0 until n) {
      if (items[i].weight > 0f || items[i].shrink > 0f) continue
      val p = measurables[i].measure(child((max - used).coerceAtLeast(0)))
      placeables[i] = p
      used += p.width
    }
    // The shrinking children: their width, less their share of what does not fit.
    val shrinking = (0 until n).filter { items[it].weight == 0f && items[it].shrink > 0f }
    if (shrinking.isNotEmpty()) {
      val base = IntArray(n)
      for (i in shrinking) base[i] = measurables[i].maxIntrinsicWidth(constraints.maxHeight)
      val target = base.copyOf()
      if (bounded) {
        var over = used + shrinking.sumOf { base[it] } - max
        val open = shrinking.toMutableList()
        // Each pass takes what does not fit from the open children by factor × width; a child
        // taken down to nothing leaves the rest to the others.
        while (over > 0 && open.isNotEmpty()) {
          val total = open.sumOf { (items[it].shrink * base[it]).toDouble() }
          if (total <= 0.0) break
          var taken = 0
          val closed = ArrayList<Int>()
          for (i in open) {
            val cut = Math.ceil(over * (items[i].shrink * base[i]) / total).toInt().coerceAtMost(target[i])
            target[i] -= cut
            taken += cut
            if (target[i] == 0) closed.add(i)
          }
          over -= taken
          if (taken == 0) break
          open.removeAll(closed)
        }
      }
      for (i in shrinking) {
        val p = measurables[i].measure(child(target[i].coerceAtLeast(0)))
        placeables[i] = p
        used += p.width
      }
    }
    // The growing children: the room left, by weight.
    val weights = (0 until n).filter { items[it].weight > 0f }
    if (weights.isNotEmpty()) {
      val room = if (bounded) (max - used).coerceAtLeast(0) else 0
      val sum = weights.sumOf { items[it].weight.toDouble() }
      var left = room
      weights.forEachIndexed { k, i ->
        val share = if (k == weights.lastIndex) left else (room * items[i].weight / sum).toInt()
        left -= share
        val c = if (items[i].fill) Constraints(share, share, 0, constraints.maxHeight) else child(share)
        val p = measurables[i].measure(c)
        placeables[i] = p
        used += p.width
      }
    }
    val width = used.coerceIn(constraints.minWidth, max)
    val height = placeables.maxOf { it?.height ?: 0 }.coerceIn(constraints.minHeight, constraints.maxHeight)
    layout(width, height) {
      var x = 0
      for (i in 0 until n) {
        val p = placeables[i] ?: continue
        val align = items[i].align ?: across
        p.placeRelative(x, align.align(p.height, height))
        x += p.width + gap
      }
    }
  }
}
