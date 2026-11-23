package so.oxy.bloom.glassmenu.chrome

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path

// Icons on a 24-unit grid. Approximations of the Ionicons used by the web bar (same names). Not pixel-identical.
internal object ChromeIcons {
  private class Icon(val path: Path, val stroke: Float?)

  private val icons: Map<String, Icon> by lazy {
    mapOf(
      "home" to Icon(Path().apply {
        moveTo(12f, 3f); lineTo(21.5f, 11.3f); lineTo(19f, 11.3f); lineTo(19f, 20.5f); lineTo(14.5f, 20.5f)
        lineTo(14.5f, 15f); lineTo(9.5f, 15f); lineTo(9.5f, 20.5f); lineTo(5f, 20.5f); lineTo(5f, 11.3f)
        lineTo(2.5f, 11.3f); close()
      }, null),
      "tv" to Icon(Path().apply {
        addRoundRect(2.5f, 5.5f, 21.5f, 17.5f, 2.5f, 2.5f, Path.Direction.CW)
        addRect(8f, 19f, 16f, 20.8f, Path.Direction.CW)
      }, null),
      "storefront" to Icon(Path().apply {
        moveTo(3f, 9.5f); lineTo(4.8f, 3.5f); lineTo(19.2f, 3.5f); lineTo(21f, 9.5f); close()
        addRect(4f, 10.5f, 20f, 21f, Path.Direction.CW)
        addRect(9.5f, 14.5f, 14.5f, 21f, Path.Direction.CCW)
      }, null),
      "albums" to Icon(Path().apply {
        addRoundRect(3f, 8f, 21f, 21f, 2f, 2f, Path.Direction.CW)
        addRoundRect(6f, 4.5f, 18f, 7f, 1f, 1f, Path.Direction.CW)
        addRoundRect(9f, 1f, 15f, 3.5f, 1f, 1f, Path.Direction.CW)
      }, null),
      "search" to Icon(Path().apply {
        addCircle(10.5f, 10.5f, 6.5f, Path.Direction.CW)
        moveTo(15.5f, 15.5f); lineTo(20.5f, 20.5f)
      }, 2.4f),
      "close" to Icon(Path().apply {
        moveTo(6f, 6f); lineTo(18f, 18f); moveTo(18f, 6f); lineTo(6f, 18f)
      }, 2.6f),
      "add" to Icon(Path().apply {
        moveTo(12f, 4f); lineTo(12f, 20f); moveTo(4f, 12f); lineTo(20f, 12f)
      }, 2.6f),
    )
  }

  // Draws icon `name` centred at (cx, cy) with a box of `size` dp. Canvas is already in dp units.
  fun draw(canvas: Canvas, paint: Paint, name: String, cx: Float, cy: Float, size: Float, color: Int, alpha: Float) {
    val icon = icons[name] ?: return
    if (alpha <= 0f) return
    val scale = size / 24f
    canvas.save()
    canvas.translate(cx - size / 2f, cy - size / 2f)
    canvas.scale(scale, scale)
    paint.reset()
    paint.isAntiAlias = true
    paint.color = withAlpha(color, alpha)
    val stroke = icon.stroke
    if (stroke != null) {
      paint.style = Paint.Style.STROKE
      paint.strokeWidth = stroke
      paint.strokeCap = Paint.Cap.ROUND
      paint.strokeJoin = Paint.Join.ROUND
    } else {
      paint.style = Paint.Style.FILL
    }
    canvas.drawPath(icon.path, paint)
    canvas.restore()
  }

  fun withAlpha(color: Int, alpha: Float): Int {
    val a = (Color.alpha(color) * alpha.coerceIn(0f, 1f)).toInt()
    return Color.argb(a, Color.red(color), Color.green(color), Color.blue(color))
  }
}
