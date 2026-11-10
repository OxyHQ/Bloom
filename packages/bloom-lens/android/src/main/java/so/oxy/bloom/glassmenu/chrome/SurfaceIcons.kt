package so.oxy.bloom.glassmenu.chrome

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF

// Icons of the glass node layer that ChromeIcons does not have. Names are the Ionicons names used by the web renderer
// (surface-nodes-view.web.tsx), so one name draws the same glyph on both platforms. Other names go to ChromeIcons.
// Paths are on a 24 dp grid, drawn stroked (round caps) unless filled is set.
internal object SurfaceIcons {
  private class Glyph(val path: Path, val filled: Boolean)

  private fun line(path: Path, x0: Float, y0: Float, x1: Float, y1: Float) {
    path.moveTo(x0, y0)
    path.lineTo(x1, y1)
  }

  private val glyphs: Map<String, Glyph> by lazy {
    mapOf(
      "chevron-back" to Glyph(Path().apply { moveTo(15f, 5f); lineTo(8f, 12f); lineTo(15f, 19f) }, false),
      "chevron-forward" to Glyph(Path().apply { moveTo(9f, 5f); lineTo(16f, 12f); lineTo(9f, 19f) }, false),
      "chevron-down" to Glyph(Path().apply { moveTo(5f, 9f); lineTo(12f, 16f); lineTo(19f, 9f) }, false),
      "ellipsis-horizontal" to Glyph(Path().apply {
        addCircle(5f, 12f, 2f, Path.Direction.CW)
        addCircle(12f, 12f, 2f, Path.Direction.CW)
        addCircle(19f, 12f, 2f, Path.Direction.CW)
      }, true),
      "options" to Glyph(Path().apply {
        line(this, 4f, 7f, 20f, 7f)
        line(this, 4f, 17f, 20f, 17f)
        addCircle(9f, 7f, 2.5f, Path.Direction.CW)
        addCircle(15f, 17f, 2.5f, Path.Direction.CW)
      }, false),
      "volume-high" to Glyph(Path().apply {
        moveTo(4f, 9f); lineTo(8f, 9f); lineTo(13f, 5f); lineTo(13f, 19f); lineTo(8f, 15f); lineTo(4f, 15f); close()
        moveTo(16f, 9f); quadTo(18f, 12f, 16f, 15f)
        moveTo(18.5f, 6.5f); quadTo(22f, 12f, 18.5f, 17.5f)
      }, false),
      "videocam" to Glyph(Path().apply {
        addRoundRect(RectF(3f, 6.5f, 14f, 17.5f), 2.5f, 2.5f, Path.Direction.CW)
        moveTo(14f, 10f); lineTo(21f, 6f); lineTo(21f, 18f); lineTo(14f, 14f); close()
      }, false),
      "mic-off" to Glyph(Path().apply {
        addRoundRect(RectF(9f, 3f, 15f, 14f), 3f, 3f, Path.Direction.CW)
        moveTo(6f, 11f); quadTo(6f, 18f, 12f, 18f); quadTo(18f, 18f, 18f, 11f)
        line(this, 12f, 18f, 12f, 21f)
        line(this, 4f, 4f, 20f, 20f)
      }, false),
      "call" to Glyph(Path().apply {
        moveTo(6.6f, 10.8f)
        quadTo(8.3f, 14.2f, 13.2f, 17.4f)
        lineTo(15.6f, 14.9f)
        quadTo(16.2f, 14.4f, 17f, 14.7f)
        quadTo(18.6f, 15.2f, 20f, 15.6f)
        quadTo(20.6f, 15.8f, 20.6f, 16.5f)
        lineTo(20.6f, 19f)
        quadTo(20.6f, 20.4f, 19.2f, 20.4f)
        quadTo(10f, 20f, 4.4f, 13.4f)
        quadTo(3.6f, 12.2f, 3.6f, 5f)
        quadTo(3.6f, 3.6f, 5f, 3.6f)
        lineTo(7.5f, 3.6f)
        quadTo(8.2f, 3.6f, 8.4f, 4.4f)
        quadTo(8.8f, 6f, 9.4f, 7.2f)
        quadTo(9.6f, 7.8f, 9f, 8.4f)
        lineTo(7.6f, 9.6f)
        close()
      }, true),
      "keypad" to Glyph(Path().apply {
        for (row in 0..2) for (col in 0..2) addCircle(6f + col * 6f, 6f + row * 6f, 1.7f, Path.Direction.CW)
      }, true),
      "person-add" to Glyph(Path().apply {
        addCircle(9f, 8f, 3.8f, Path.Direction.CW)
        moveTo(2.5f, 20f); quadTo(2.5f, 13f, 9f, 13f); quadTo(15.5f, 13f, 15.5f, 20f)
        line(this, 19f, 8f, 19f, 14f)
        line(this, 16f, 11f, 22f, 11f)
      }, false),
      "share-outline" to Glyph(Path().apply {
        moveTo(12f, 3f); lineTo(12f, 15f)
        moveTo(7.5f, 7.5f); lineTo(12f, 3f); lineTo(16.5f, 7.5f)
        moveTo(7f, 11f); lineTo(5f, 11f); lineTo(5f, 21f); lineTo(19f, 21f); lineTo(19f, 11f); lineTo(17f, 11f)
      }, false),
      "play" to Glyph(Path().apply { moveTo(7f, 4.5f); lineTo(19.5f, 12f); lineTo(7f, 19.5f); close() }, true),
      "checkmark" to Glyph(Path().apply { moveTo(5f, 12.5f); lineTo(10f, 17.5f); lineTo(19f, 7f) }, false),
    )
  }

  // Draws icon `name` centred at (cx, cy) in a box of `size` dp. The canvas is already in dp units.
  fun draw(canvas: Canvas, paint: Paint, name: String, cx: Float, cy: Float, size: Float, color: Int, alpha: Float) {
    val glyph = glyphs[name]
    if (glyph == null) {
      ChromeIcons.draw(canvas, paint, name, cx, cy, size, color, alpha)
      return
    }
    if (alpha <= 0f) return
    val scale = size / 24f
    canvas.save()
    canvas.translate(cx - size / 2f, cy - size / 2f)
    canvas.scale(scale, scale)
    paint.reset()
    paint.isAntiAlias = true
    paint.color = ChromeIcons.withAlpha(color, alpha)
    if (glyph.filled) {
      paint.style = Paint.Style.FILL
    } else {
      paint.style = Paint.Style.STROKE
      paint.strokeWidth = 2f
      paint.strokeCap = Paint.Cap.ROUND
      paint.strokeJoin = Paint.Join.ROUND
    }
    canvas.drawPath(glyph.path, paint)
    canvas.restore()
  }
}
