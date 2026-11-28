package so.oxy.bloom.ui

import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measured
import androidx.compose.ui.layout.ParentDataModifier
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.layout.VerticalAlignmentLine
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp

private class FlexColumnData(private val update: FlexItem.() -> Unit) : ParentDataModifier {
  override fun Density.modifyParentData(parentData: Any?): Any = ((parentData as? FlexItem) ?: FlexItem()).apply(update)
}

/** The scope a Bloom `VStack`'s content is in: Compose's `ColumnScope`, over a [FlexColumn]. */
object FlexColumnScope : ColumnScope {
  override fun Modifier.weight(weight: Float, fill: Boolean): Modifier {
    require(weight > 0f) { "invalid weight $weight; must be greater than zero" }
    return this.then(FlexColumnData { this.weight = weight; this.fill = fill })
  }

  override fun Modifier.align(alignment: Alignment.Horizontal): Modifier = this.then(FlexColumnData { alignX = alignment })

  override fun Modifier.alignBy(alignmentLine: VerticalAlignmentLine): Modifier = this

  override fun Modifier.alignBy(alignmentLineBlock: (Measured) -> Int): Modifier = this
}

/**
 * A Bloom stack's column, on React Native's pixel grid (`Grid.kt`): each child starts where its
 * unrounded top rounds to, the unrounded heights before it summed with the spacing, and the
 * column is as tall as its unrounded bottom rounds to. `.grow()` children share the room left by
 * weight, as Compose's `Column` gives it.
 */
@Composable
fun FlexColumn(
  spacing: Dp,
  across: Alignment.Horizontal,
  modifier: Modifier = Modifier,
  content: @Composable ColumnScope.() -> Unit,
) {
  val ref = remember { GridRef() }
  Layout(content = { FlexColumnScope.content() }, modifier = modifier.gridRoot(ref)) { measurables, constraints ->
    val own = ref.state
    val cx0 = own.cx
    val cy0 = own.cy
    val ax0 = own.ax
    val ay0 = own.ay
    val n = measurables.size
    val gap = spacing.roundToPx()
    val gapU = spacing.toPx()
    val items = measurables.map { it.parentData as? FlexItem }
    val placeables = arrayOfNulls<Placeable>(n)
    val unroundedW = FloatArray(n)
    val unroundedH = FloatArray(n)
    val boundedH = constraints.hasBoundedHeight
    val maxH = if (boundedH) constraints.maxHeight else Constraints.Infinity
    val cross = Constraints(0, constraints.maxWidth, 0, maxH)
    var used = if (n > 1) gap * (n - 1) else 0
    var accY = 0f
    fun measure(i: Int, c: Constraints) {
      val g = items[i]?.grid
      // The child's top: after the unrounded heights before it (exact for the rigid ones, which
      // come first in order; a growing child's is set when it is measured, after them).
      g?.reset(cx0, gridCarry(cy0 + accY), ax0, ay0)
      val p = measurables[i].measure(c)
      placeables[i] = p
      unroundedW[i] = g?.uw?.takeUnless { it.isNaN() } ?: p.width.toFloat()
      unroundedH[i] = g?.uh?.takeUnless { it.isNaN() } ?: p.height.toFloat()
    }
    for (i in 0 until n) {
      if ((items[i]?.weight ?: 0f) > 0f) {
        accY += gapU
        continue
      }
      val room = if (boundedH) (maxH - used).coerceAtLeast(0) else Constraints.Infinity
      measure(i, cross.copy(maxHeight = room))
      used += placeables[i]!!.height
      accY += unroundedH[i] + gapU
    }
    val growing = (0 until n).filter { (items[it]?.weight ?: 0f) > 0f }
    if (growing.isNotEmpty()) {
      val room = if (boundedH) (maxH - used).coerceAtLeast(0) else 0
      val sum = growing.sumOf { (items[it]?.weight ?: 0f).toDouble() }
      var left = room
      accY = 0f
      growing.forEachIndexed { k, i ->
        val share = if (k == growing.lastIndex) left else (room * (items[i]?.weight ?: 0f) / sum).toInt()
        left -= share
        val c = if (items[i]?.fill != false) cross.copy(minHeight = share, maxHeight = share) else cross.copy(maxHeight = share)
        measure(i, c)
        used += placeables[i]!!.height
      }
    }
    // On the grid: each child at its unrounded top rounded.
    val ys = IntArray(n)
    accY = 0f
    for (i in 0 until n) {
      ys[i] = gridRound(cy0 + accY).toInt()
      accY += unroundedH[i] + gapU
    }
    val contentH = if (n > 0) accY - gapU else 0f
    val contentW = (0 until n).maxOfOrNull { unroundedW[it] } ?: 0f
    val bottom = (0 until n).maxOfOrNull { ys[it] + placeables[it]!!.height } ?: 0
    val width = maxOf(
      (placeables.maxOfOrNull { it?.width ?: 0 } ?: 0),
      gridRound(cx0 + contentW).toInt(),
    ).coerceIn(constraints.minWidth, constraints.maxWidth)
    val height = maxOf(bottom, gridRound(cy0 + contentH).toInt()).coerceIn(constraints.minHeight, if (boundedH) maxH else Int.MAX_VALUE)
    own.uw = contentW
    own.uh = contentH
    layout(width, height) {
      for (i in 0 until n) {
        val p = placeables[i] ?: continue
        val align = items[i]?.alignX ?: across
        val x = when (align) {
          Alignment.Start -> 0
          Alignment.End -> width - p.width
          else -> (gridRound(cx0 + (maxOf(contentW, width.toFloat()) - unroundedW[i]) / 2f) - gridRound(cx0)).toInt()
        }
        p.placeRelative(x, ys[i])
      }
    }
  }
}
