package so.oxy.bloom

import org.junit.Assert.*
import org.junit.Test

class ComposerLightSnapshotTest {
  @Test fun noBlurPreservesPixelsWithoutAliasingInput() {
    val input = intArrayOf(0x8044aa66.toInt(), 0)
    val output = blurSnapshotPixels(input, 2, 1, 0f)
    assertArrayEquals(input, output)
    assertNotSame(input, output)
  }

  @Test fun invisibleRgbCannotTintAnOpaqueImpulse() {
    val input = IntArray(21 * 21) { 0x000000ff }
    input[10 * 21 + 10] = 0xffff0000.toInt()
    val output = blurSnapshotPixels(input, 21, 21, 1f)
    assertTrue(output.any { it ushr 24 > 0 })
    for (color in output) if (color ushr 24 > 0) {
      assertEquals(255, (color ushr 16) and 255)
      assertEquals(0, color and 0xffff)
    }
    assertTrue(output.sumOf { it ushr 24 } in 240..270)
  }

  @Test fun blurIsSymmetricAndDoesNotWrapAcrossRows() {
    val input = IntArray(21 * 21)
    input[10 * 21 + 10] = 0xffffffff.toInt()
    val output = blurSnapshotPixels(input, 21, 21, 1.5f)
    for (y in 0..20) for (x in 0..20) {
      assertEquals(output[y * 21 + x], output[y * 21 + 20 - x])
      assertEquals(output[y * 21 + x], output[(20 - y) * 21 + x])
    }
    assertTrue(output.take(21).all { it == 0 })
  }
}
