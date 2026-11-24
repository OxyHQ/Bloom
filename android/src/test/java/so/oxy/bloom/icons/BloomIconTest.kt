package so.oxy.bloom.icons

import android.graphics.Bitmap
import android.graphics.Canvas
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BloomIconTest {
  private val red = 0xffff0000.toInt()

  private fun icon(side: Int, vararg paths: String) = BloomIcon(RuntimeEnvironment.getApplication()).apply {
    sources = paths.toList()
    color = red
    layout(0, 0, side, side)
  }

  private fun pixels(view: BloomIcon): Array<IntArray> {
    val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
    try {
      view.draw(Canvas(bitmap))
      return Array(view.height) { y -> IntArray(view.width) { x -> bitmap.getPixel(x, y) } }
    } finally { bitmap.recycle() }
  }

  // An outer square with an inner square: even-odd leaves the inner one empty.
  private val frame = "M4 4H20V20H4ZM8 8H16V16H8Z"

  @Test fun fillsEvenOddOnTheViewBoxScaledToTheView() {
    val p = pixels(icon(48, frame))
    assertEquals(red, p[12][12])   // in the frame (viewBox 6, 6)
    assertEquals(0, p[24][24])     // the hole (viewBox 12, 12)
    assertEquals(0, p[2][2])       // outside (viewBox 1, 1)
  }

  @Test fun centresANonSquareViewBoxAsXMidYMidMeet() {
    val view = icon(48, "M0 0H12V12H0Z").apply { viewBox = floatArrayOf(0f, 0f, 24f, 12f) }
    val p = pixels(view)
    // 24x12 meets 48x48 at scale 2, centred vertically: the square spans x 0..24, y 12..36.
    assertEquals(red, p[24][12])
    assertEquals(0, p[6][12])
    assertEquals(0, p[24][36])
  }

  @Test fun strokesInsteadOfFillingWithAWidth() {
    val p = pixels(icon(48, "M4 4H20V20H4Z").apply { strokeWidth = 2.0 })
    assertEquals(red, p[8][24])    // on the edge, viewBox y 4
    assertEquals(0, p[24][24])     // the middle stays empty
  }

  @Test fun drawsEverySubpathOfAMultiPathGlyph() {
    val p = pixels(icon(48, "M0 0H6V6H0Z", "M18 18H24V24H18Z"))
    assertEquals(red, p[4][4])
    assertEquals(red, p[44][44])
    assertEquals(0, p[24][24])
  }

  @Test fun paintsTheGradientAcrossThePathInsteadOfTheFill() {
    val view = icon(48, "M0 0H24V24H0Z").apply {
      stops = floatArrayOf(0f, 1f)
      stopColors = intArrayOf(0xff0000ff.toInt(), 0xff00ff00.toInt())
    }
    val p = pixels(view)
    assertNotEquals(red, p[24][24])
    assertNotEquals(p[2][2], p[45][45])
  }

  @Test fun drawsNothingWithoutAPaintOrForMalformedData() {
    assertTrue(pixels(icon(24, frame).apply { color = null }).all { row -> row.all { it == 0 } })
    assertTrue(pixels(icon(24, "M4 4 L")).all { row -> row.all { it == 0 } })
  }

  @Test fun sharesOneRasterAcrossViewsOfTheSameGlyphSizeAndPaint() {
    pixels(icon(48, frame))
    val before = Raster.count()
    pixels(icon(48, frame))
    assertEquals(before, Raster.count())
    pixels(icon(48, frame).apply { color = 0xff00ff00.toInt() })
    assertEquals(before + 1, Raster.count())
  }

  @Test fun parsesAGlyphOncePerDensity() {
    assertSame(Glyph.of(listOf(frame), 2f), Glyph.of(listOf(frame), 2f))
    assertNotSame(Glyph.of(listOf(frame), 2f), Glyph.of(listOf(frame), 3f))
  }
}
