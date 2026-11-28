// BloomUI's views for the kotlin-compose backend (ADR 0003): Bloom's nodes drawn with Compose
// Foundation (no Material), under Bloom's names and parameter names, so emitted code reads
// like the `.bloom` it came from.
package so.oxy.bloom.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import so.oxy.bloom.std.Binding
import so.oxy.bloom.std.Identifiable

/** Text traits a stack hands its children (Bloom's inherited `foreground`). */
val LocalForeground = staticCompositionLocalOf<Color?> { null }

/** The inherited foreground, or the theme's. */
val currentForeground: Color
  @Composable get() = LocalForeground.current ?: Colors.foreground

// ---- layout ---------------------------------------------------------------------------

@Composable
fun VStack(
  alignment: HAlign = HAlign.leading,
  spacing: Dp = 0.dp,
  foreground: Color? = null,
  modifier: Modifier = Modifier,
  content: @Composable ColumnScope.() -> Unit,
) {
  val across = when (alignment) {
    HAlign.center -> Alignment.CenterHorizontally
    HAlign.trailing, HAlign.end -> Alignment.End
    else -> Alignment.Start
  }
  val column = @Composable {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(spacing), horizontalAlignment = across, content = content)
  }
  if (foreground == null) column() else CompositionLocalProvider(LocalForeground provides foreground) { column() }
}

@Composable
fun HStack(
  alignment: VAlign = VAlign.center,
  spacing: Dp = 0.dp,
  foreground: Color? = null,
  modifier: Modifier = Modifier,
  content: @Composable RowScope.() -> Unit,
) {
  val across = when (alignment) {
    VAlign.top, VAlign.start -> Alignment.Top
    VAlign.bottom, VAlign.end -> Alignment.Bottom
    else -> Alignment.CenterVertically
  }
  val row = @Composable {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(spacing), verticalAlignment = across, content = content)
  }
  if (foreground == null) row() else CompositionLocalProvider(LocalForeground provides foreground) { row() }
}

@Composable
fun ZStack(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
  Box(modifier, contentAlignment = Alignment.Center) { content() }
}

/** `Spacer()` in a stack: the room left. */
@Composable
fun RowScope.Spacer(modifier: Modifier = Modifier) = androidx.compose.foundation.layout.Spacer(modifier.weight(1f))

@Composable
fun ColumnScope.Spacer(modifier: Modifier = Modifier) = androidx.compose.foundation.layout.Spacer(modifier.weight(1f))

@Composable
fun Divider(modifier: Modifier = Modifier) {
  Box(modifier.fillMaxWidth().height(0.5.dp).background(Colors.border))
}

/** A scroll's direction (`.axis()`). */
enum class Axis { horizontal, vertical }

/** `ScrollArea { … }.axis(.horizontal)`: its content scrolled along the axis. */
@Composable
fun ScrollArea(axis: Axis = Axis.vertical, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
  val state = rememberScrollState()
  val scrolled = if (axis == Axis.horizontal) modifier.horizontalScroll(state) else modifier.verticalScroll(state)
  Box(scrolled) { content() }
}

/** `ScrollView { … }`: a vertical scroll of a column. */
@Composable
fun ScrollView(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
  Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()), content = content)
}

/** `VirtualList(items, row)`: a lazy list keyed by the items' ids (recycled rows). */
@Composable
fun <T : Identifiable> VirtualList(items: List<T>, modifier: Modifier = Modifier, row: @Composable (VirtualListRow<T>) -> Unit) {
  LazyColumn(modifier.fillMaxSize()) {
    itemsIndexed(items, key = { _, item -> item.id }, contentType = { _, _ -> 0 }) { index, item -> row(VirtualListRow(item, index.toLong())) }
  }
}

/** What a list's row is handed: the item and its index (as the TypeScript runtime's FlashList row). */
class VirtualListRow<T>(val item: T, val index: Long)

// ---- text and images -----------------------------------------------------------------

/**
 * `Text(…)`: Bloom's `Text`, its body step (14/20) in Bloom's sans face, which a ramp font
 * replaces and a size rung (`.font(.md)`) resizes, keeping the step's line height; then
 * `.weight()` and `.leading()` over it, as the TypeScript runtime's `textStyle` writes them.
 */
@Composable
fun Text(
  text: String,
  font: androidx.compose.ui.text.TextStyle = Font.body,
  weight: androidx.compose.ui.text.font.FontWeight? = null,
  leading: androidx.compose.ui.unit.TextUnit = androidx.compose.ui.unit.TextUnit.Unspecified,
  foreground: Color? = null,
  lines: Long? = null,
  monospacedDigit: Boolean = false,
  modifier: Modifier = Modifier,
) {
  val color = foreground ?: currentForeground
  var style = Font.body.merge(font).copy(color = color, fontFamily = BloomFonts.sans())
  if (weight != null) style = style.copy(fontWeight = weight)
  if (leading != androidx.compose.ui.unit.TextUnit.Unspecified) style = style.copy(lineHeight = leading)
  if (monospacedDigit) style = style.copy(fontFeatureSettings = "tnum")
  BasicText(
    text,
    modifier,
    style = style,
    maxLines = lines?.toInt() ?: Int.MAX_VALUE,
    overflow = if (lines != null) TextOverflow.Ellipsis else TextOverflow.Clip,
  )
}

/**
 * Bloom's faces: `sans` is Inter, the face Bloom's `Text` names, from the app's assets
 * (`fonts/Inter.ttf`, which `bloom build` ships), at the weights the text asks for; the
 * platform's face where the app has none.
 */
object BloomFonts {
  @Volatile private var loaded: androidx.compose.ui.text.font.FontFamily? = null

  @Composable
  fun sans(): androidx.compose.ui.text.font.FontFamily {
    loaded?.let { return it }
    val context = androidx.compose.ui.platform.LocalContext.current
    return load(context).also { loaded = it }
  }

  private fun load(context: android.content.Context): androidx.compose.ui.text.font.FontFamily {
    val assets = context.applicationContext.assets
    val path = "fonts/Inter.ttf"
    val present = runCatching { assets.open(path).close() }.isSuccess
    if (!present) return androidx.compose.ui.text.font.FontFamily.Default
    // One regular face: a heavier weight is drawn as Android draws a React Native text's
    // (the platform's synthesized weight over the file's face).
    return androidx.compose.ui.text.font.FontFamily(
      androidx.compose.ui.text.font.Font(path, assets, androidx.compose.ui.text.font.FontWeight.Normal),
    )
  }
}

/** A glyph: SVG path data in a view box, filled or stroked. */
class IconData(val paths: List<String>, val width: Float, val height: Float, val stroke: Float?) {
  val parsed: List<Path> by lazy { paths.map { PathParser().parsePathString(it).toPath() } }
}

@Composable
fun Icon(icon: IconData, size: IconSize = IconSize.sm, foreground: Color? = null, modifier: Modifier = Modifier) {
  val color = foreground ?: currentForeground
  Canvas(modifier.size(size.dp)) {
    val s = this.size.width / icon.width
    scale(s, s, pivot = Offset.Zero) {
      for (p in icon.parsed) {
        if (icon.stroke != null) drawPath(p, color, style = Stroke(width = icon.stroke)) else drawPath(p, color)
      }
    }
  }
}

@Composable
fun Avatar(source: String, size: AvatarSize = AvatarSize.md, modifier: Modifier = Modifier) {
  // Bloom's avatar: a circle, filled while its picture loads (or when it has none).
  val box = modifier.size(size.dp).clip(CircleShape).background(Colors.surface)
  if (source.isEmpty()) Box(box) else Image(source, contentFit = ContentFit.cover, modifier = box)
}

/** `Image(url)`: decoded off the main thread at its drawn size, through [ImagePipeline]. */
@Composable
fun Image(source: String, contentFit: ContentFit = ContentFit.cover, modifier: Modifier = Modifier) {
  BloomImage(source, contentFit, modifier)
}

// ---- controls ------------------------------------------------------------------------

@Composable
fun ProgressView(size: ControlSize = ControlSize.md, modifier: Modifier = Modifier) {
  val d = when (size) {
    ControlSize.xs -> 12.dp
    ControlSize.sm -> 16.dp
    ControlSize.md -> 24.dp
    ControlSize.lg -> 32.dp
  }
  val turn by rememberInfiniteTransition("spin").animateFloat(
    0f, 360f, infiniteRepeatable(tween(900, easing = LinearEasing), RepeatMode.Restart), "turn",
  )
  val arc = Colors.muted
  Canvas(modifier.size(d)) {
    drawArc(arc, turn, 270f, false, style = Stroke(width = 2.dp.toPx()))
  }
}

/** `Toggle($on)`: Bloom's switch, with the thumb and track animated. */
@Composable
fun Toggle(isOn: Binding<Boolean>, label: String = "", tint: Tone = Tone.primary, modifier: Modifier = Modifier) {
  val on = isOn.get()
  val track by animateColorAsState(if (on) tint.color else Colors.mutedFill, label = "track")
  val thumb by animateDpAsState(if (on) 22.dp else 2.dp, label = "thumb")
  Box(
    modifier
      .size(width = 48.dp, height = 28.dp)
      .clip(RoundedCornerShape(14.dp))
      .background(track)
      .toggleable(
        value = on,
        interactionSource = remember { MutableInteractionSource() },
        indication = null,
        role = Role.Switch,
        onValueChange = { isOn.set(it) },
      )
      .semantics { contentDescription = label },
  ) {
    Box(Modifier.offset(x = thumb, y = 2.dp).size(24.dp).clip(CircleShape).background(Colors.white))
  }
}

/** `TextField($text, "Placeholder")`: a single-line field over a binding. */
@Composable
fun TextField(text: Binding<String>, placeholder: String = "", modifier: Modifier = Modifier) {
  val value = text.get()
  val fg = currentForeground
  Box(modifier.fillMaxWidth().clip(RoundedCornerShape(Corner.md)).background(Colors.mutedFill).padding(horizontal = Space.md, vertical = Space.sm)) {
    if (value.isEmpty()) BasicText(placeholder, style = Font.body.copy(color = Colors.muted))
    androidx.compose.foundation.text.BasicTextField(
      value = value,
      onValueChange = { text.set(it) },
      singleLine = true,
      textStyle = Font.body.copy(color = fg),
      modifier = Modifier.fillMaxWidth(),
    )
  }
}

/** `Button("Save") { … }`: a label's button. */
@Composable
fun Button(
  label: String,
  onPress: () -> Unit,
  size: ControlSize = ControlSize.md,
  style: ButtonStyle = ButtonStyle.solid,
  tint: Tone = Tone.primary,
  modifier: Modifier = Modifier,
) {
  Button(content = { BasicText(label, style = buttonFont(size).copy(color = currentForeground, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)) }, onPress, size, style, tint, modifier)
}

private fun buttonFont(size: ControlSize) = when (size) {
  ControlSize.xs -> Font.caption1
  ControlSize.sm -> Font.body2
  ControlSize.md -> Font.body
  ControlSize.lg -> Font.headline
}

/** `Button(Text("Like")).onPress { … }`: a button whose content is a view; its text takes the button's foreground. */
@Composable
fun Button(
  content: @Composable () -> Unit,
  onPress: () -> Unit = {},
  size: ControlSize = ControlSize.md,
  style: ButtonStyle = ButtonStyle.solid,
  tint: Tone = Tone.primary,
  modifier: Modifier = Modifier,
) {
  val (bg, fg) = when (style) {
    ButtonStyle.solid, ButtonStyle.glassProminent -> tint.color to Colors.onPrimary
    ButtonStyle.subtle, ButtonStyle.glass -> Colors.mutedFill to Colors.foreground
    ButtonStyle.outline, ButtonStyle.plain -> Colors.transparent to tint.color
  }
  val (h, padX) = when (size) {
    ControlSize.xs -> 24.dp to 8.dp
    ControlSize.sm -> 32.dp to 12.dp
    ControlSize.md -> 40.dp to 16.dp
    ControlSize.lg -> 48.dp to 20.dp
  }
  Box(
    modifier.height(h).clip(RoundedCornerShape(h / 2)).background(bg).clickable(onClick = onPress).padding(horizontal = padX),
    contentAlignment = Alignment.Center,
  ) {
    CompositionLocalProvider(LocalForeground provides fg) { content() }
  }
}

// ---- grouped settings ----------------------------------------------------------------

/** `GroupedSection { … }.title(t)`: a titled card of rows with hairlines between them. */
@Composable
fun GroupedSection(title: String? = null, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
  Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Space.sm)) {
    if (title != null) {
      BasicText(title, Modifier.padding(horizontal = Space.xs), style = Font.body2.copy(color = Colors.muted, fontWeight = androidx.compose.ui.text.font.FontWeight.Medium))
    }
    val ys = remember { IntArrayHolder() }
    val hairline = Colors.border
    Layout(
      content = content,
      modifier = Modifier
        .fillMaxWidth()
        .clip(RoundedCornerShape(Corner.lg))
        .background(Colors.surface)
        .drawBehind {
          for (i in 1 until ys.count) drawRect(hairline, Offset(16.dp.toPx(), ys.values[i].toFloat()), androidx.compose.ui.geometry.Size(size.width, 0.5.dp.toPx()))
        },
    ) { measurables, constraints ->
      val placeables = measurables.map { it.measure(constraints.copy(minHeight = 0)) }
      val height = placeables.sumOf { it.height }
      ys.ensure(placeables.size)
      layout(constraints.maxWidth, height) {
        var y = 0
        placeables.forEachIndexed { i, p ->
          ys.values[i] = y
          p.place(0, y)
          y += p.height
        }
      }
    }
  }
}

internal class IntArrayHolder {
  var values = IntArray(8)
  var count = 0
  fun ensure(n: Int) {
    if (values.size < n) values = IntArray(n)
    count = n
  }
}

/** A row of a grouped section: a title, its description, and a trailing control. */
@Composable
fun GroupedSectionItem(
  title: String,
  description: String? = null,
  wrapControl: Boolean = false,
  trailing: (@Composable () -> Unit)? = null,
  onPress: (() -> Unit)? = null,
  modifier: Modifier = Modifier,
) {
  val press = if (onPress != null) Modifier.clickable(onClick = onPress) else Modifier
  Row(
    modifier.fillMaxWidth().then(press).padding(horizontal = Space.lg, vertical = Space.md),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(Space.md),
  ) {
    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(Space._2xs)) {
      BasicText(title, style = Font.body.copy(color = Colors.foreground, fontWeight = androidx.compose.ui.text.font.FontWeight.Medium))
      if (description != null) BasicText(description, style = Font.body2.copy(color = Colors.muted))
    }
    if (trailing != null) trailing()
  }
}

// ---- the post's action bar -----------------------------------------------------------
// Bloom's EngagementBar (src/engagement-bar), at its `md` geometry: a 20 glyph, 6/2 padding,
// a 4 gap to a 13 tabular count, the bar bled 6 on both sides so the first glyph lines up with
// the content; an action on in its tone's text colour (`resolveAccentColors(…, 'outlined')`),
// held on its tone's subtle wash; the pop when a press turns it on, and the count's roll.

private const val ENGAGEMENT_PAD_X = 6
private const val ENGAGEMENT_PAD_Y = 2
private const val ENGAGEMENT_COUNT_GAP = 4
private const val ENGAGEMENT_ICON = 20
private const val ROLL_DISTANCE = 10

private val LocalCountFormat = staticCompositionLocalOf<(Long) -> String> { { it.toString() } }

/** `ActionBar { … }.trailing { … }.countFormat(f)`: the actions, the trailing ones at the far edge. */
@Composable
fun ActionBar(
  trailing: (@Composable RowScope.() -> Unit)? = null,
  countFormat: ((Long) -> String)? = null,
  size: ControlSize = ControlSize.md,
  modifier: Modifier = Modifier,
  content: @Composable RowScope.() -> Unit,
) {
  val format = countFormat ?: LocalCountFormat.current
  CompositionLocalProvider(LocalCountFormat provides format) {
    Row(modifier.fillMaxWidth().bleed(ENGAGEMENT_PAD_X.dp), verticalAlignment = Alignment.CenterVertically) {
      content()
      if (trailing != null) {
        Row(Modifier.weight(1f), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
          trailing()
        }
      }
    }
  }
}

/** Wider than its parent by `x` on both sides (a negative margin). */
private fun Modifier.bleed(x: androidx.compose.ui.unit.Dp): Modifier = layout { measurable, constraints ->
  val px = x.roundToPx()
  val wide = if (constraints.hasBoundedWidth) {
    constraints.copy(minWidth = constraints.minWidth + 2 * px, maxWidth = constraints.maxWidth + 2 * px)
  } else constraints
  val placeable = measurable.measure(wide)
  layout((placeable.width - 2 * px).coerceAtLeast(0), placeable.height) { placeable.place(-px, 0) }
}

/** A tone's text colour (the outlined foreground) and its subtle wash: `tonePalette`'s. */
private val Tone.text: Color
  @Composable get() = when (this) {
    Tone.success -> BloomTheme.palette.successText
    Tone.warning -> BloomTheme.palette.warningText
    Tone.error, Tone.danger -> BloomTheme.palette.errorText
    Tone.info -> BloomTheme.palette.infoText
    Tone.secondary, Tone.support -> BloomTheme.palette.secondaryText
    Tone.tertiary, Tone.action -> BloomTheme.palette.tertiaryText
    Tone.neutral -> BloomTheme.palette.mutedForeground
    else -> BloomTheme.palette.primaryText
  }

private val Tone.wash: Color
  @Composable get() = when (this) {
    Tone.success -> BloomTheme.palette.successSubtle
    Tone.warning -> BloomTheme.palette.warningSubtle
    Tone.error, Tone.danger -> BloomTheme.palette.errorSubtle
    Tone.info -> BloomTheme.palette.infoSubtle
    Tone.secondary, Tone.support -> BloomTheme.palette.secondarySubtle
    Tone.tertiary, Tone.action -> BloomTheme.palette.tertiarySubtle
    else -> BloomTheme.palette.primarySubtle
  }

/** Bloom's `outExpo` (motion's `pop` and `roll`). */
private val OutExpo = androidx.compose.animation.core.CubicBezierEasing(0.16f, 1f, 0.3f, 1f)
private val InOutQuad = androidx.compose.animation.core.CubicBezierEasing(0.455f, 0.03f, 0.515f, 0.955f)

/** The pop's glyph scale at `t` (0…1): it dips to 0.7 by 1/10, swells to 1.2 by 4/10, settles. */
private fun popScale(t: Float): Float = when {
  t < 0.1f -> 1f - 0.3f * InOutQuad.transform(t / 0.1f)
  t < 0.4f -> 0.7f + 0.5f * ((t - 0.1f) / 0.3f)
  else -> 1.2f - 0.2f * ((t - 0.4f) / 0.6f)
}

/** One engagement action: a glyph, its count, its active state and tone. */
@Composable
fun Action(
  icon: IconData,
  label: String,
  count: Long? = null,
  active: Boolean = false,
  tint: Tone = Tone.primary,
  onPress: (() -> Unit)? = null,
  modifier: Modifier = Modifier,
) {
  val format = LocalCountFormat.current
  val onColor = tint.text
  val color = if (active) onColor else Colors.muted
  val glyph = if (active) Icons.active(icon) else icon
  val interaction = remember { MutableInteractionSource() }
  val pressed by interaction.collectIsPressedAsState()
  val pop = remember { androidx.compose.animation.core.Animatable(1f) }
  var pressedOn by remember { mutableStateOf(false) }
  // The pop plays when a press turns the action on (not when the props arrive on).
  androidx.compose.runtime.LaunchedEffect(active) {
    if (active && pressedOn) {
      pop.snapTo(0f)
      pop.animateTo(1f, tween(300, easing = OutExpo))
    }
    pressedOn = false
  }
  Row(
    modifier
      .clip(RoundedCornerShape(50))
      .background(if (pressed) tint.wash else Color.Transparent)
      .clickable(interactionSource = interaction, indication = null) {
        pressedOn = !active
        onPress?.invoke()
      }
      .semantics { contentDescription = label }
      .padding(horizontal = ENGAGEMENT_PAD_X.dp, vertical = ENGAGEMENT_PAD_Y.dp),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(ENGAGEMENT_COUNT_GAP.dp),
  ) {
    Box(Modifier.size(ENGAGEMENT_ICON.dp), contentAlignment = Alignment.Center) {
      val t = pop.value
      if (t < 1f) {
        // The ring bursts from 0.4 to 1.6 and fades from 0.6.
        Canvas(Modifier.size(ENGAGEMENT_ICON.dp)) {
          val r = size.minDimension / 2 * (0.4f + 1.2f * t)
          drawCircle(color, radius = r, alpha = 0.6f * (1f - t), style = Stroke(width = 2.dp.toPx()))
        }
      }
      val scale = if (t < 1f) popScale(t) else 1f
      Icon(glyph, IconSize.md, color, Modifier.graphicsLayer { scaleX = scale; scaleY = scale })
    }
    val shown = count?.takeIf { it != 0L }
    if (shown != null) {
      RollingCount(format(shown), shown, color, active)
    }
  }
}

/** The count, rolled 10 up (or down) as it changes: the new value in, the old one out. */
@Composable
private fun RollingCount(text: String, value: Long, color: Color, active: Boolean) {
  val style = androidx.compose.ui.text.TextStyle(
    fontFamily = BloomFonts.sans(),
    fontSize = Font.sm.fontSize,
    fontFeatureSettings = "tnum",
    fontWeight = if (active) androidx.compose.ui.text.font.FontWeight(600) else null,
    color = color,
  )
  var previous by remember { mutableStateOf(text to value) }
  val roll = remember { androidx.compose.animation.core.Animatable(1f) }
  var shownOld by remember { mutableStateOf<String?>(null) }
  var up by remember { mutableStateOf(true) }
  androidx.compose.runtime.LaunchedEffect(text) {
    if (previous.first != text) {
      up = value > previous.second
      shownOld = previous.first
      previous = text to value
      roll.snapTo(0f)
      roll.animateTo(1f, tween(400, easing = OutExpo))
      shownOld = null
    }
  }
  val t = roll.value
  val d = ROLL_DISTANCE * (if (up) 1 else -1)
  Box(Modifier.clipToBounds()) {
    val old = shownOld
    if (old != null && t < 1f) {
      BasicText(old, Modifier.graphicsLayer { translationY = -d * t * density; alpha = 1f - t }, style = style)
    }
    BasicText(text, Modifier.graphicsLayer { translationY = if (t < 1f) d * (1f - t) * density else 0f; alpha = if (t < 1f) t else 1f }, style = style)
  }
}

// ---- navigation ----------------------------------------------------------------------

/** A tab of a `NavigationStack`: its route, title and icon name. */
class Tab<T>(val route: T, val title: String, val icon: String)

/** `NavigationStack(root:tabs:) { route in … }`: the tab in front over a bottom bar. */
@Composable
fun <T : Any> NavigationStack(root: T, tabs: List<Tab<T>> = emptyList(), modifier: Modifier = Modifier, content: @Composable (T) -> Unit) {
  var selected by remember { mutableStateOf(root) }
  val holder = rememberSaveableStateHolder()
  Column(modifier.fillMaxSize().background(Colors.background).windowInsetsPadding(WindowInsets.statusBars)) {
    Box(Modifier.weight(1f).fillMaxWidth()) {
      holder.SaveableStateProvider(selected.toString()) { content(selected) }
    }
    if (tabs.isNotEmpty()) {
      Divider()
      Row(
        Modifier.fillMaxWidth().background(Colors.background).windowInsetsPadding(WindowInsets.navigationBars).height(56.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
      ) {
        for (tab in tabs) {
          val on = tab.route == selected
          val (icon, fill) = Icons.named(tab.icon)
          Column(
            Modifier
              .weight(1f)
              .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { selected = tab.route }
              .semantics { contentDescription = tab.title },
            horizontalAlignment = Alignment.CenterHorizontally,
          ) {
            Icon(if (on) fill else icon, IconSize.lg, if (on) Colors.foreground else Colors.muted)
            BasicText(tab.title, style = Font.caption2.copy(color = if (on) Colors.foreground else Colors.muted))
          }
        }
      }
    }
  }
}

// ---- effects -------------------------------------------------------------------------

/** `.onChange(of: v) { old, new in … }`: after a composition that changed `value`. */
@Composable
fun <T> OnChange(value: T, action: (T, T) -> Unit) {
  val last = remember { arrayOfNulls<Any?>(1).also { it[0] = value } }
  SideEffect {
    @Suppress("UNCHECKED_CAST")
    val old = last[0] as T
    if (old != value) {
      last[0] = value
      action(old, value)
    }
  }
}

