package so.oxy.bloom

import com.facebook.react.bridge.BridgeReactContext
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class AvatarLoopsTest {
  @Test
  fun parsesTheRenderersPathCommands() {
    // `projectedContour` and the visibility masks write these; H and V become lines.
    val path = AvatarPathData.parse("M10.5000 -2.2500L3 4L5 6ZM-2 -2H322V322H-2Z")
    assertArrayEquals(byteArrayOf(0, 1, 1, 2, 0, 1, 1, 1, 2), path.verbs)
    assertArrayEquals(floatArrayOf(10.5f, -2.25f, 3f, 4f, 5f, 6f, -2f, -2f, 322f, -2f, 322f, 322f, -2f, 322f), path.points, 0f)
  }

  @Test(expected = IllegalArgumentException::class)
  fun refusesCommandsTheRendererNeverWrites() {
    AvatarPathData.parse("M0 0C1 1 2 2 3 3Z")
  }

  @Test
  fun aLoopReadsBackAsItWasWritten() {
    val data = AvatarLoopData(
      2.0, 2, floatArrayOf(52f, 70f, 216f, 216f),
      listOf(
        AvatarLoopData.Track(0xff112233.toInt(), 1f, null, 0f, floatArrayOf(1f, .5f),
          listOf(AvatarPathData.parse("M0 0L1 0L1 1Z"), AvatarPathData.parse("M0 0L2 0L2 2Z")), null),
        AvatarLoopData.Track(0xffffffff.toInt(), .22f, 0xffffffff.toInt(), 1.5f, floatArrayOf(1f, 1f),
          listOf(AvatarPathData.parse("M0 0L1 1Z"), AvatarPathData.parse("M0 0L1 2Z")),
          listOf(AvatarPathData.parse("M-2 -2H322V322H-2Z"), AvatarPathData.parse("M0 0L3 3Z"))),
      ),
    )
    val bytes = ByteArrayOutputStream().also { DataOutputStream(it).use(data::write) }.toByteArray()
    val read = AvatarLoopData.read(DataInputStream(ByteArrayInputStream(bytes)))!!
    assertEquals(2.0, read.duration, 0.0)
    assertEquals(2, read.length)
    assertArrayEquals(data.viewBox, read.viewBox, 0f)
    for ((written, back) in data.tracks.zip(read.tracks)) {
      assertEquals(written.fill, back.fill)
      assertEquals(written.stroke, back.stroke)
      assertEquals(written.strokeWidth, back.strokeWidth, 0f)
      assertArrayEquals(written.opacity, back.opacity, 0f)
      for ((a, b) in written.d.zip(back.d)) { assertArrayEquals(a.verbs, b.verbs); assertArrayEquals(a.points, b.points, 0f) }
      assertEquals(written.clip?.size, back.clip?.size)
    }
  }

  @Test
  fun theClockReadsTheFrameJsDoes() {
    // `vectorLoopIndex`: floor of the wrapped time over the frame length.
    val loop = AvatarLoop(5.95, 179, floatArrayOf(0f, 0f, 320f, 320f), emptyList(), 0)
    assertEquals(0, loop.index(0.0))
    assertEquals(30, loop.index(1.0))
    assertEquals(178, loop.index(5.949))
    assertEquals(0, loop.index(5.95))
    assertEquals(178, loop.index(-0.001))
  }

  @Test
  fun registersTheVersionedSurface() {
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    val manager = BloomPackage().createViewManagers(context).single { it.name == "BloomAvatarSurfaceV1" }
    val events = manager.exportedCustomDirectEventTypeConstants!!
    assertEquals(mapOf("registrationName" to "onLoop"), events["topLoop"])
    assertEquals(mapOf("registrationName" to "onCapture"), events["topCapture"])
  }
}
