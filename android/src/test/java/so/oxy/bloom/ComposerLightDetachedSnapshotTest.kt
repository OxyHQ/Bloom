package so.oxy.bloom

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
@Config(manifest = Config.NONE, sdk = [31])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ComposerLightDetachedSnapshotTest {
  private fun snapshot(view: ComposerLight): IntArray {
    val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
    try {
      view.draw(Canvas(bitmap))
      return IntArray(view.width * view.height).also { bitmap.getPixels(it, 0, view.width, 0, 0, view.width, view.height) }
    } finally { bitmap.recycle() }
  }

  @Test fun detachedSnapshotsPaintCurrentPhasePaletteAndGeometry() {
    val view = ComposerLight(RuntimeEnvironment.getApplication())
    view.layout(0, 0, 240, 52)
    view.boxWidth = 240f; view.boxHeight = 52f; view.radius = 26f; view.perimeter = 540f
    view.palette = IntArray(5) { 0xffff0000.toInt() }
    view.strokes = listOf(LightStroke("bloom", 20f, 14f, .3f, 30f, 0.0), LightStroke("line", 2.5f, .5f, 1f, 33f, 0.0))
    view.seconds = 1.0
    view.rebuild()
    val first = snapshot(view)
    assertTrue(first.any { it ushr 24 > 0 })
    assertEquals(1.0, view.seconds, 0.0)
    view.seconds = 2.0
    val moved = snapshot(view)
    assertFalse(first.contentEquals(moved))
    view.palette = IntArray(5) { 0xff00ff00.toInt() }
    view.boxWidth = 180f; view.radius = 12f; view.rebuild()
    val recolored = snapshot(view)
    assertTrue(recolored.any { it ushr 24 > 0 })
    assertFalse(moved.contentEquals(recolored))
    // Discarding hardware display lists on detach must not discard snapshot data.
    ComposerLight::class.java.getDeclaredMethod("onDetachedFromWindow").apply { isAccessible = true }.invoke(view)
    assertArrayEquals(recolored, snapshot(view))
  }
}
