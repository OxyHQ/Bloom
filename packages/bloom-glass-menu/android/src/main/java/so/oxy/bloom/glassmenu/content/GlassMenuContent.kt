package so.oxy.bloom.glassmenu.content

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.text.TextPaint
import android.text.TextUtils
import android.view.View
import androidx.core.graphics.PathParser
import com.facebook.react.common.assets.ReactFontManager
import so.oxy.bloom.glassmenu.records.GlassMenuItemRecord
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

private object Metrics {
  const val MinimumWidth = 250f
  const val ContentInsetY = 10f
  const val PlateInsetX = 8f
  const val RowHeight = 42f
  const val SubtitleExtra = 16f
  const val SeparatorBlock = 21f
  const val SeparatorInset = 24f
  const val HeadingHeight = 30f
  const val CheckCenter = 28f
  const val LeadingWithCheck = 44f
  const val IconCenterWithCheck = 55f
  const val TextAfterIconWithCheck = 80f
  const val LeadingPlain = 28f
  const val IconCenterPlain = 40f
  const val TextAfterIconPlain = 64f
  const val TrailingInset = 24f
  const val TitleSize = 17f
  const val SubtitleSize = 13f
  const val IconSize = 19.5f
}
internal class GlassMenuContent(
  private val context: Context,
  private val density: Float,
  private val iconView: (Int) -> View?,
) {
  private val titlePaint = TextPaint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG)
  private val subtitlePaint = TextPaint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG)
  private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeCap = Paint.Cap.ROUND
    strokeJoin = Paint.Join.ROUND
  }
  private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val iconMatrix = Matrix()
  private val iconPath = Path()
  private var reservesCheck = false

  var rows: List<GlassRow> = emptyList()
    private set
  var width = 0f
    private set
  var height = 0f
    private set
  var dark = true
  // The theme's row ink (null channels keep the built-in colours).
  var ink: so.oxy.bloom.glassmenu.records.GlassMenuConfigRecord? = null
  // Alpha of the whole content: the submenu navigation fades the level in (RowsRevealSpring).
  var contentAlpha = 1f

  // Forces the check column (the parent menu's), so the header row is laid out exactly as the row it came from.
  var forceCheckColumn: Boolean? = null
  val reservesCheckColumn: Boolean get() = reservesCheck

  // `back`: the submenu being shown (its header row returns to the parent panel), null at the root.
  fun setItems(items: List<GlassMenuItemRecord>, requestedWidth: Float?, maximumWidth: Float, fontFamily: String?, back: GlassMenuItemRecord? = null) {
    val typeface = resolveTypeface(fontFamily)
    val fontScale = min(context.resources.configuration.fontScale, 1.35f)
    titlePaint.typeface = typeface
    subtitlePaint.typeface = typeface
    titlePaint.textSize = Metrics.TitleSize * density * fontScale * FontFit
    subtitlePaint.textSize = Metrics.SubtitleSize * density * fontScale * FontFit
    titlePaint.letterSpacing = TitleTracking
    subtitlePaint.letterSpacing = 0f
    reservesCheck = forceCheckColumn ?: items.any { it.checked != null }
    val flat = ArrayList<GlassRow>()
    if (back != null) flat.add(GlassRow(back, 0, back = true))
    items.forEach { item -> flat.add(GlassRow(item, flat.size)) }
    val built: List<GlassRow> = flat

    var widest = Metrics.MinimumWidth * density
    for (row in built) {
      if (row.isSeparator) continue
      val paint = titlePaint
      val text = paint.measureText(row.item.title)
      val reserve = if (row.submenu || row.back) CHEVRON_RESERVE else 0f
      val needed = rowLeading(row) * density + text + (Metrics.TrailingInset + reserve) * density
      widest = max(widest, needed)
    }
    width = min(requestedWidth?.times(density) ?: ceil(widest), maximumWidth)

    var y = Metrics.ContentInsetY * density
    val rowScale = max(fontScale, 1f)
    for (row in built) {
      val rowHeight = when {
        row.isSeparator -> Metrics.SeparatorBlock
        row.isHeading -> Metrics.HeadingHeight * rowScale
        row.item.subtitle != null -> (Metrics.RowHeight + Metrics.SubtitleExtra) * rowScale
        else -> Metrics.RowHeight * rowScale
      } * density
      row.rect.set(Metrics.PlateInsetX * density, y, width - Metrics.PlateInsetX * density, y + rowHeight)
      y += rowHeight
      if (!row.isSeparator) {
        val available = width - rowLeading(row) * density - (Metrics.TrailingInset + (if (row.submenu || row.back) CHEVRON_RESERVE else 0f)) * density
        row.title = TextUtils.ellipsize(row.item.title, titlePaint, available, TextUtils.TruncateAt.END)
        row.subtitle = row.item.subtitle?.let { TextUtils.ellipsize(it, subtitlePaint, available, TextUtils.TruncateAt.END) }
      }
    }
    height = y + Metrics.ContentInsetY * density
    rows = built
  }

  private fun leading(item: GlassMenuItemRecord): Float = when {
    item.heading -> if (reservesCheck) Metrics.LeadingWithCheck else Metrics.LeadingPlain
    reservesCheck -> if (hasIcon(item)) Metrics.TextAfterIconWithCheck else Metrics.LeadingWithCheck
    else -> if (hasIcon(item)) Metrics.TextAfterIconPlain else Metrics.LeadingPlain
  }

  private fun hasIcon(item: GlassMenuItemRecord) = item.icon != null || item.iconPath != null || item.iconSlot != null

  private fun resolveTypeface(family: String?): Typeface {
    if (family != null) {
      return ReactFontManager.getInstance().getTypeface(family, Typeface.NORMAL, context.assets)
    }
    return runCatching { Typeface.createFromAsset(context.assets, "fonts/Inter-Regular.ttf") }
      .getOrDefault(Typeface.DEFAULT)
  }

  fun rowAt(x: Float, y: Float): GlassRow? =
    rows.firstOrNull { it.selectable && y >= it.rect.top && y < it.rect.bottom && x >= 0f && x <= width }

  fun nearestRow(x: Float, y: Float, slack: Float): GlassRow? {
    if (x < -slack || x > width + slack || y < -slack || y > height + slack) return null
    var best: GlassRow? = null
    var distance = Float.MAX_VALUE
    for (row in rows) {
      if (!row.selectable) continue
      val gap = when {
        y < row.rect.top -> row.rect.top - y
        y > row.rect.bottom -> y - row.rect.bottom
        else -> 0f
      }
      if (gap < distance) {
        distance = gap
        best = row
      }
    }
    return best
  }

  fun drawPlate(canvas: Canvas, plate: RectF, alpha: Float, lightX: Float, strength: Float, shine: Float) {
    if (alpha <= .001f) return
    val base = if (dark) PlateDark else PlateLight
    val edge = (base * alpha * strength).coerceIn(0f, 1f)
    val center = ((base + (if (dark) PlateShine else 0f) * shine) * alpha * strength).coerceIn(0f, 1f)
    val tone = if (dark) 235 else 60
    fun shade(opacity: Float) = Color.argb((opacity * 255f).toInt(), tone, tone, if (dark) 245 else 67)
    val radius = plate.height() / 2f
    fillPaint.color = Color.BLACK
    fillPaint.shader = RadialGradient(
      lightX.coerceIn(plate.left, plate.right), plate.centerY(), plate.width() * .62f,
      shade(center), shade(edge), Shader.TileMode.CLAMP,
    )
    canvas.drawRoundRect(plate, radius, radius, fillPaint)
    fillPaint.shader = null
  }

  // All rows, with the rows matching `skip` left out (the submenu's header is drawn by the submenu panel).
  fun draw(canvas: Canvas, scroll: Float, skip: ((GlassRow) -> Boolean)? = null) {
    canvas.save()
    canvas.translate(0f, -scroll)
    for (row in rows) {
      if (skip?.invoke(row) == true) continue
      drawRow(canvas, row, 0f)
    }
    canvas.restore()
  }

  // One row: its separator, text, icon, check and chevron. The same draw for every row, so a row that moves
  // (the submenu header) is drawn by the same code wherever it is. `chevronRotation` turns the trailing chevron
  // around its own centre.
  fun drawRow(canvas: Canvas, row: GlassRow, chevronRotation: Float) {
    val foreground = ink?.textColor?.toArgb() ?: if (dark) Color.argb(245, 255, 255, 255) else Color.argb(235, 0, 0, 0)
    val muted = ink?.mutedColor?.toArgb() ?: if (dark) Color.argb(153, 235, 235, 245) else Color.argb(153, 60, 60, 67)
    val destructive = ink?.destructiveColor?.toArgb() ?: if (dark) Color.rgb(255, 82, 84) else Color.rgb(220, 30, 48)
    if (row.isSeparator) {
      fillPaint.color = ink?.separatorColor?.toArgb() ?: if (dark) Color.argb(17, 255, 255, 255) else Color.argb(26, 0, 0, 0)
      val y = row.rect.centerY()
      val half = density / 2f
      canvas.drawRect(Metrics.SeparatorInset * density, y - half, width - Metrics.SeparatorInset * density, y + half, fillPaint)
      return
    }
    val alpha = if (row.item.disabled) .38f else 1f
    val base = if (row.item.destructive) destructive else foreground
    val color = withAlpha(base, alpha)
    val left = rowLeading(row) * density
    if (row.isHeading) {
      subtitlePaint.color = muted
      val baseline = row.rect.bottom - 8f * density
      canvas.drawText(row.title, 0, row.title.length, left, baseline, subtitlePaint)
      return
    }
    val centerY = row.rect.centerY()
    if (row.item.checked == true) {
      drawIcon(canvas, "check", null, Metrics.CheckCenter * density, centerY, 13.5f, color, 1.9f)
    }
    if (hasIcon(row.item)) {
      val center = (if (reservesCheck) Metrics.IconCenterWithCheck else Metrics.IconCenterPlain) * density
      val slot = row.item.iconSlot
      if (slot != null) {
        drawIconView(canvas, slot, center, centerY, alpha)
      } else {
        drawIcon(canvas, row.item.icon, row.item.iconPath, center, centerY, Metrics.IconSize, color, 1.45f)
      }
    }
    if (row.submenu || row.back) {
      drawIcon(canvas, "chevron", null, width - (Metrics.TrailingInset + 3f) * density, centerY, 18f, color, 1.6f, chevronRotation)
    }
    titlePaint.color = color
    val metrics = titlePaint.fontMetrics
    val subtitle = row.subtitle
    if (subtitle == null) {
      val baseline = centerY - (metrics.ascent + metrics.descent) / 2f
      canvas.drawText(row.title, 0, row.title.length, left, baseline, titlePaint)
    } else {
      canvas.drawText(row.title, 0, row.title.length, left, centerY - 2f * density, titlePaint)
      subtitlePaint.color = withAlpha(muted, alpha)
      canvas.drawText(subtitle, 0, subtitle.length, left, centerY + 16f * density, subtitlePaint)
    }
  }

  // The header row's title starts after its chevron column.
  private fun rowLeading(row: GlassRow): Float = leading(row.item)

  private fun withAlpha(color: Int, alpha: Float): Int =
    Color.argb((Color.alpha(color) * alpha * contentAlpha).toInt(), Color.red(color), Color.green(color), Color.blue(color))

  private fun drawIconView(canvas: Canvas, slot: Int, centerX: Float, centerY: Float, alpha: Float) {
    val view = iconView(slot) ?: return
    if (view.width == 0 || view.height == 0) return
    val save = if (alpha < 1f) {
      canvas.saveLayerAlpha(
        centerX - view.width / 2f, centerY - view.height / 2f,
        centerX + view.width / 2f, centerY + view.height / 2f, (alpha * 255f).toInt(),
      )
    } else canvas.save()
    canvas.translate(centerX - view.width / 2f, centerY - view.height / 2f)
    view.draw(canvas)
    canvas.restoreToCount(save)
  }

  private fun drawIcon(
    canvas: Canvas, name: String?, customPath: String?, centerX: Float, centerY: Float,
    size: Float, color: Int, weight: Float, rotation: Float = 0f,
  ) {
    val pixels = size * density
    val scale = pixels / 24f
    iconMatrix.setScale(scale, scale)
    iconMatrix.postTranslate(centerX - pixels / 2f, centerY - pixels / 2f)
    if (rotation != 0f) iconMatrix.postRotate(rotation, centerX, centerY)
    iconPath.reset()
    if (customPath != null) {
      val parsed = runCatching { PathParser.createPathFromPathData(customPath) }.getOrNull() ?: return
      parsed.transform(iconMatrix, iconPath)
      fillPaint.color = color
      canvas.drawPath(iconPath, fillPaint)
      return
    }
    val shape = GlassIcons.path(name ?: return) ?: return
    shape.transform(iconMatrix, iconPath)
    strokePaint.color = color
    strokePaint.strokeWidth = weight * density
    canvas.drawPath(iconPath, strokePaint)
  }

  private companion object {
    // Chevron column reserved at the trailing edge of a submenu row (dp).
    const val CHEVRON_RESERVE = 24f
    const val FontFit = .978f
    const val TitleTracking = -.012f
    const val PlateDark = .155f
    const val PlateShine = .03f
    const val PlateLight = .09f
  }
}
