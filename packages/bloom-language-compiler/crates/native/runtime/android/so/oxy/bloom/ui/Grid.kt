package so.oxy.bloom.ui

import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.node.LayoutModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.ParentDataModifierNode
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.offset
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import kotlin.math.ceil
import kotlin.math.floor

// React Native's pixel grid, so a Bloom view lands on the same pixels on both. Yoga lays out in
// unrounded points and then rounds every node's absolute edges to the pixel grid (half up), so a
// node's size is round(its unrounded end) - round(its unrounded start), not its unrounded size
// rounded: 12 dp margins at 2.625 put a capsule at x 32..1049 (1017 px wide) where Compose's
// rounded paddings give 1016. Compose places at whole pixels, so each Bloom node carries what
// Yoga would have kept: the `carry` of its start (its unrounded start less its rounded start, in
// [-0.5, 0.5) px) on each axis, set by its stack before it is measured, and the unrounded size it
// reports back. The paddings and frames round against it; the stacks place each child at its
// unrounded offset rounded. A view outside a Bloom stack starts on the grid (a carry of 0).

/** Half-up rounding, as Yoga rounds a point on the grid. */
internal fun gridRound(px: Float): Float = floor(px + 0.5f)

/**
 * A child's carry and unrounded size, in its [FlexItem] (the parent data every Bloom node's
 * modifiers share): `cx`/`cy` are the carry of the start at the current point of its modifier
 * chain (each padding moves it inward); `ax`/`ay` the carry of the end of the room it is given
 * (its constraints' maximum: a node that fills it ends there); `uw`/`uh` its unrounded size,
 * reported outward by its grid-aware nodes (NaN: its measured size).
 */
internal class GridState {
  var cx = 0f
  var cy = 0f
  var ax = 0f
  var ay = 0f
  var uw = Float.NaN
  var uh = Float.NaN

  fun reset(x: Float, y: Float, endX: Float, endY: Float) {
    cx = x
    cy = y
    ax = endX
    ay = endY
    uw = Float.NaN
    uh = Float.NaN
  }
}

/** The carry of `px` on the grid: what rounding it drops, in [-0.5, 0.5). */
internal fun gridCarry(px: Float): Float = px - gridRound(px)

/** A node of a Bloom modifier chain that shares its view's [FlexItem] (and so its grid state). */
internal abstract class GridItemNode : Modifier.Node(), ParentDataModifierNode {
  var item: FlexItem? = null

  override fun Density.modifyParentData(parentData: Any?): Any? {
    // Another layout's parent data (a Compose `Column`'s weight) is kept: the node is then off the
    // grid (its carry is the grid's 0), not the other layout's data lost.
    if (parentData != null && parentData !is FlexItem) {
      item = null
      return parentData
    }
    val shared = (parentData as? FlexItem) ?: FlexItem()
    item = shared
    return shared
  }

  val grid: GridState? get() = item?.grid
}

/**
 * `.padding(…)` on the grid: each side's pixels are where Yoga would put the content's edge, from
 * the carry at this point of the chain, and the content's carry is what is left.
 */
internal class GridPaddingNode(var start: Dp, var top: Dp, var end: Dp, var bottom: Dp) : GridItemNode(), LayoutModifierNode {
  override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
    val g = grid ?: GridState()
    val ms = start.toPx()
    val mt = top.toPx()
    val me = end.toPx()
    val mb = bottom.toPx()
    val sx = g.cx
    val sy = g.cy
    val ax = g.ax
    val ay = g.ay
    // Where the content's start rounds to, and the end of its room.
    val ps = gridRound(sx + ms).toInt()
    val pt = gridRound(sy + mt).toInt()
    val pe = ceil(me - ax - 0.5f).toInt()
    val pb = ceil(mb - ay - 0.5f).toInt()
    g.cx = sx + ms - ps
    g.cy = sy + mt - pt
    g.ax = gridCarry(ax - me)
    g.ay = gridCarry(ay - mb)
    g.uw = Float.NaN
    g.uh = Float.NaN
    val room = constraints.offset(-(ps + pe), -(pt + pb))
    val inner = measurable.measure(room)
    // The chain's cursor back where this node found it: the next measure starts from what the
    // parent sets (or the grid, under a parent that sets nothing).
    g.cx = sx
    g.cy = sy
    g.ax = ax
    g.ay = ay
    val innerCx = sx + ms - ps
    val innerCy = sy + mt - pt
    val innerAx = gridCarry(ax - me)
    val innerAy = gridCarry(ay - mb)
    val fillsW = room.hasBoundedWidth && inner.width >= room.maxWidth
    val fillsH = room.hasBoundedHeight && inner.height >= room.maxHeight
    val uw = if (fillsW) room.maxWidth + innerAx - innerCx else if (g.uw.isNaN()) inner.width.toFloat() else g.uw
    val uh = if (fillsH) room.maxHeight + innerAy - innerCy else if (g.uh.isNaN()) inner.height.toFloat() else g.uh
    // Filling its room, it ends at the room's end; sized by its content, where its unrounded end
    // rounds to.
    val width = if (fillsW) ps + inner.width + pe else gridRound(sx + ms + uw + me).toInt()
    val height = if (fillsH) pt + inner.height + pb else gridRound(sy + mt + uh + mb).toInt()
    g.uw = ms + uw + me
    g.uh = mt + uh + mb
    return layout(constraints.constrainWidth(width), constraints.constrainHeight(height)) {
      inner.placeRelative(ps, pt)
    }
  }
}

private data class GridPaddingElement(val start: Dp, val top: Dp, val end: Dp, val bottom: Dp) : ModifierNodeElement<GridPaddingNode>() {
  override fun create() = GridPaddingNode(start, top, end, bottom)

  override fun update(node: GridPaddingNode) {
    node.start = start
    node.top = top
    node.end = end
    node.bottom = bottom
  }
}

/** Padding on React Native's pixel grid (see the top of this file). */
internal fun Modifier.gridPadding(start: Dp, top: Dp, end: Dp, bottom: Dp): Modifier =
  this.then(GridPaddingElement(start, top, end, bottom))

/**
 * `.frame(…)` on the grid: a fixed side is its points (unrounded), rounded from its carry; a
 * least or most side bounds the content's unrounded size. `Dp.Unspecified` leaves a side alone.
 */
internal class GridFrameNode(
  var width: Dp,
  var height: Dp,
  var minWidth: Dp,
  var maxWidth: Dp,
  var minHeight: Dp,
  var maxHeight: Dp,
) : GridItemNode(), LayoutModifierNode {
  override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
    val g = grid ?: GridState()
    val sx = g.cx
    val sy = g.cy
    fun px(d: Dp) = if (d == Dp.Unspecified) Float.NaN else d.toPx()
    val fw = px(width)
    val fh = px(height)
    val minW = px(minWidth)
    val maxW = px(maxWidth)
    val minH = px(minHeight)
    val maxH = px(maxHeight)
    // Rounded sizes from the carry: what a fixed or bounding side takes on the grid.
    fun onGrid(carry: Float, size: Float) = gridRound(carry + size).toInt()
    var c = constraints
    if (!fw.isNaN()) {
      val w = constraints.constrainWidth(onGrid(sx, fw))
      c = c.copy(minWidth = w, maxWidth = w)
    } else {
      if (!minW.isNaN()) c = c.copy(minWidth = constraints.constrainWidth(onGrid(sx, minW)).coerceAtMost(c.maxWidth))
      if (!maxW.isNaN()) {
        c = c.copy(maxWidth = constraints.constrainWidth(onGrid(sx, maxW)).coerceAtLeast(c.minWidth))
      }
    }
    if (!fh.isNaN()) {
      val h = constraints.constrainHeight(onGrid(sy, fh))
      c = c.copy(minHeight = h, maxHeight = h)
    } else {
      if (!minH.isNaN()) c = c.copy(minHeight = constraints.constrainHeight(onGrid(sy, minH)).coerceAtMost(c.maxHeight))
      if (!maxH.isNaN()) c = c.copy(maxHeight = constraints.constrainHeight(onGrid(sy, maxH)).coerceAtLeast(c.minHeight))
    }
    // A fixed side's end is the end of the content's room.
    val ax = g.ax
    val ay = g.ay
    if (!fw.isNaN()) g.ax = gridCarry(sx + fw)
    if (!fh.isNaN()) g.ay = gridCarry(sy + fh)
    g.uw = Float.NaN
    g.uh = Float.NaN
    val inner = measurable.measure(c)
    g.ax = ax
    g.ay = ay
    var uw = if (g.uw.isNaN()) inner.width.toFloat() else g.uw
    var uh = if (g.uh.isNaN()) inner.height.toFloat() else g.uh
    if (!fw.isNaN()) uw = fw else {
      if (!minW.isNaN() && uw < minW) uw = minW
      if (!maxW.isNaN() && uw > maxW) uw = maxW
    }
    if (!fh.isNaN()) uh = fh else {
      if (!minH.isNaN() && uh < minH) uh = minH
      if (!maxH.isNaN() && uh > maxH) uh = maxH
    }
    g.uw = uw
    g.uh = uh
    val w = c.constrainWidth(maxOf(inner.width, if (fw.isNaN() && minW.isNaN()) 0 else onGrid(sx, uw)))
    val h = c.constrainHeight(maxOf(inner.height, if (fh.isNaN() && minH.isNaN()) 0 else onGrid(sy, uh)))
    return layout(w, h) {
      inner.placeRelative((w - inner.width) / 2, (h - inner.height) / 2)
    }
  }
}

private data class GridFrameElement(
  val width: Dp,
  val height: Dp,
  val minWidth: Dp,
  val maxWidth: Dp,
  val minHeight: Dp,
  val maxHeight: Dp,
) : ModifierNodeElement<GridFrameNode>() {
  override fun create() = GridFrameNode(width, height, minWidth, maxWidth, minHeight, maxHeight)

  override fun update(node: GridFrameNode) {
    node.width = width
    node.height = height
    node.minWidth = minWidth
    node.maxWidth = maxWidth
    node.minHeight = minHeight
    node.maxHeight = maxHeight
  }
}

/** A frame on React Native's pixel grid (see the top of this file). */
internal fun Modifier.gridFrame(
  width: Dp = Dp.Unspecified,
  height: Dp = Dp.Unspecified,
  minWidth: Dp = Dp.Unspecified,
  maxWidth: Dp = Dp.Unspecified,
  minHeight: Dp = Dp.Unspecified,
  maxHeight: Dp = Dp.Unspecified,
): Modifier = this.then(GridFrameElement(width, height, minWidth, maxWidth, minHeight, maxHeight))

/**
 * The grid state of a stack's own node, for its measure policy: the root of its chain hands the
 * shared [FlexItem] over, so the stack reads the carry its paddings left and reports its
 * content's unrounded size to them.
 */
internal class GridRef {
  var item: FlexItem? = null
  val state: GridState get() = item?.grid ?: fallback
  private val fallback = GridState()
}

internal class GridRootNode(var ref: GridRef) : GridItemNode() {
  override fun Density.modifyParentData(parentData: Any?): Any? {
    if (parentData != null && parentData !is FlexItem) {
      item = null
      ref.item = null
      return parentData
    }
    val shared = (parentData as? FlexItem) ?: FlexItem()
    item = shared
    ref.item = shared
    return shared
  }
}

private data class GridRootElement(val ref: GridRef) : ModifierNodeElement<GridRootNode>() {
  override fun create() = GridRootNode(ref)

  override fun update(node: GridRootNode) {
    node.ref = ref
  }
}

/** The innermost node of a stack's chain: hands the stack its grid state. */
internal fun Modifier.gridRoot(ref: GridRef): Modifier = this.then(GridRootElement(ref))
