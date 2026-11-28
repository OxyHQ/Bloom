package so.oxy.bloom.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.ParentDataModifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import so.oxy.bloom.std.Binding
import kotlin.math.roundToInt
import kotlinx.coroutines.launch

/** `Tabs(…).style(…)`: Bloom's tab strip styles (`spec`'s `tabsStyle`). */
enum class TabsStyle { underline, pill, filled }

private class TabsState(val selection: Binding<*>, val style: TabsStyle)

private val LocalTabs = staticCompositionLocalOf<TabsState?> { null }

/** A tab's value, in its parent data (shared with the grid's), for the strip to find the chosen tab. */
private class TabValue(val value: Any?) : ParentDataModifier {
  override fun Density.modifyParentData(parentData: Any?): Any = ((parentData as? FlexItem) ?: FlexItem()).also { it.tag = value }
}

/**
 * `hairlineOn(theme, parent)`: the hairline that reads on `parent`, the text colour mixed over it
 * (14% light, 20% dark), each channel rounded as JS's `Math.round` rounds it (Bloom's
 * `styles/surface-levels.ts`).
 */
internal fun hairlineOn(parent: Color, text: Color, dark: Boolean): Color {
  val a = if (dark) 0.2 else 0.14
  fun ch(x: Float, y: Float): Float = Math.floor(y * 255.0 * a + x * 255.0 * (1 - a) + 0.5).toFloat() / 255f
  return Color(ch(parent.red, text.red), ch(parent.green, text.green), ch(parent.blue, text.blue))
}

/**
 * Bloom's `Tabs` (`src/tabs/Tabs.tsx`), its underline style: the tabs in a row 4 dp apart, a 1 dp
 * baseline across the strip in the hairline of the surface it sits on, and the chosen tab's 2 dp
 * underline in the primary colour over it, sliding to a new tab in 200 ms. A tab's press sets
 * `selection`. `fullWidth` shares the strip's width among the tabs.
 */
@Composable
fun <V> Tabs(
  selection: Binding<V>,
  style: TabsStyle = TabsStyle.underline,
  fullWidth: Boolean = false,
  modifier: Modifier = Modifier,
  content: @Composable () -> Unit,
) {
  val state = remember(selection, style) { TabsState(selection, style) }
  val dark = LocalDark.current
  val baseline = hairlineOn(LocalBacking.current ?: Colors.background, Colors.foreground, dark)
  val underline = Colors.primary
  val chosen = selection.value
  val indicatorX = remember { Animatable(Float.NaN) }
  val indicatorW = remember { Animatable(Float.NaN) }
  var target by remember { mutableStateOf<Pair<Float, Float>?>(null) }
  LaunchedEffect(target) {
    val (x, w) = target ?: return@LaunchedEffect
    if (indicatorX.value.isNaN()) {
      indicatorX.snapTo(x)
      indicatorW.snapTo(w)
      return@LaunchedEffect
    }
    val spec = tween<Float>(200, easing = SLIDE)
    launch { indicatorX.animateTo(x, spec) }
    launch { indicatorW.animateTo(w, spec) }
  }
  val underlined = style == TabsStyle.underline
  CompositionLocalProvider(LocalTabs provides state) {
    Layout(
      content = content,
      modifier = modifier.drawBehind {
        if (!underlined) return@drawBehind
        val line = 1.dp.toPx()
        drawRect(baseline, Offset(0f, size.height - line), Size(size.width, line))
        val x = indicatorX.value
        val w = indicatorW.value
        if (!x.isNaN() && !w.isNaN()) {
          val bar = 2.dp.toPx()
          drawRect(underline, Offset(x, size.height - bar), Size(w, bar))
        }
      },
    ) { measurables, constraints ->
      val gap = 4.dp.roundToPx()
      val line = if (underlined) 1.dp.toPx() else 0f
      val n = measurables.size
      val share = if (fullWidth && n > 0 && constraints.hasBoundedWidth) (constraints.maxWidth - gap * (n - 1)) / n else -1
      val child = Constraints(
        minWidth = if (share >= 0) share else 0,
        maxWidth = if (share >= 0) share else Constraints.Infinity,
        maxHeight = constraints.maxHeight,
      )
      val placeables = measurables.map { it.measure(child) }
      val rowW = placeables.sumOf { it.width } + if (n > 1) gap * (n - 1) else 0
      // The strip runs the container's width (`flexGrow: 1`): its baseline does too.
      val width = (if (constraints.hasBoundedWidth) maxOf(rowW, constraints.maxWidth) else rowW).coerceIn(constraints.minWidth, constraints.maxWidth)
      val tallest = placeables.maxOfOrNull { it.height } ?: 0
      val height = maxOf(tallest + line.roundToInt(), constraints.minHeight).coerceAtMost(constraints.maxHeight)
      var chosenPlace: Pair<Float, Float>? = null
      val xs = IntArray(n)
      var x = 0
      for (i in 0 until n) {
        xs[i] = x
        if ((measurables[i].parentData as? FlexItem)?.tag == chosen) chosenPlace = x.toFloat() to placeables[i].width.toFloat()
        x += placeables[i].width + gap
      }
      if (chosenPlace != target) target = chosenPlace
      layout(width, height) {
        // Centred in the box above the baseline (`alignItems: center` inside the border).
        val inner = height - line
        for (i in 0 until n) {
          val y = gridRound((inner - placeables[i].height) / 2f).toInt()
          placeables[i].placeRelative(xs[i], y)
        }
      }
    }
  }
}

/**
 * Bloom's `TabItem(value, label)` in a [Tabs]: its label centred, the chosen tab's in the
 * strip's chosen ink (`primary-text`) and the others' in the text colour; a press chooses it.
 * The label's type is the item's `.font`/`.weight`/`.leading`, else the strip's (medium when
 * chosen, regular otherwise).
 */
@Composable
fun TabItem(
  value: Any?,
  label: String,
  font: TextStyle? = null,
  weight: FontWeight? = null,
  leading: TextUnit = TextUnit.Unspecified,
  modifier: Modifier = Modifier,
) {
  val tabs = LocalTabs.current
  val chosen = tabs?.selection?.value == value
  val ink = if (chosen) Colors.primaryText else Colors.foreground
  @Suppress("UNCHECKED_CAST")
  val select = { (tabs?.selection as? Binding<Any?>)?.set?.invoke(value) }
  Box(
    modifier
      .then(TabValue(value))
      .clickable(interactionSource = null, indication = null) { select() },
    contentAlignment = Alignment.Center,
  ) {
    Text(
      label,
      font = font ?: Font.body,
      weight = weight ?: if (chosen) Weight.medium else Weight.regular,
      leading = leading,
      foreground = ink,
      lines = 1L,
    )
  }
}

/** Bloom's `MOTION.slide`: `ease`. */
private val SLIDE = CubicBezierEasing(0.25f, 0.1f, 0.25f, 1f)
