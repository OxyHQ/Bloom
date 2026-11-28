// Slice 1 of the colour engine written in Bloom (packages/bloom-theme-engine), as bloom-native emits
// it for kotlin-compose, held to the TypeScript engine's golden
// (src/theme/__tests__/__fixtures__/golden-color-engine.txt) on the JVM: every colour exactly, every
// raw number (CAM16 hue and chroma, L*) within RELATIVE_BOUND of the TypeScript's (StrictMath's
// fdlibm `pow` rounds a few inputs an ulp apart from JavaScript's). It also says how many numbers are
// bit-identical. Run by scripts/kotlin-golden.sh. Exits 1 on any difference.
import bloom.bloomthemeengine.colorengine.argbFromHex
import bloom.bloomthemeengine.colorengine.cam16FromInt
import bloom.bloomthemeengine.colorengine.hctFrom
import bloom.bloomthemeengine.colorengine.hexFromArgb
import bloom.bloomthemeengine.colorengine.lstarFromArgb
import bloom.bloomthemeengine.colorengine.tonalPaletteFromHueAndChroma
import bloom.bloomthemeengine.colorengine.tonalPaletteFromInt
import java.io.File
import kotlin.system.exitProcess

const val RELATIVE_BOUND = 1e-12

val TONES = listOf(0, 4, 5, 6, 10, 12, 15, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100)

/** JavaScript's `String(number)` for the doubles the golden holds: the shortest round trip. */
fun jsNumber(d: Double): String {
  if (d == StrictMath.rint(d) && StrictMath.abs(d) < 1e21) return d.toLong().toString()
  return d.toString()
}

fun main(args: Array<String>) {
  val lines = File(args[0]).readLines().filter { it.isNotBlank() }
  var differences = 0
  var checked = 0
  var identical = 0
  var widest = 0.0
  for (line in lines) {
    val want = line.split(' ')
    val seed = argbFromHex(want[0])
    val cam = cam16FromInt(seed)
    val palette = tonalPaletteFromInt(seed)
    val key = tonalPaletteFromHueAndChroma(cam.hue, 48.0).keyColor()
    val vivid = listOf(30.0, 50.0, 80.0).map { hexFromArgb(hctFrom(cam.hue, 200.0, it).argb) }
    val got: List<Any> = listOf(hexFromArgb(seed)) +
      listOf(cam.hue, cam.chroma, lstarFromArgb(seed)) +
      TONES.map { hexFromArgb(palette.tone(it.toDouble())) } +
      listOf(hexFromArgb(key.argb)) + vivid
    for ((i, value) in got.withIndex()) {
      checked++
      val expected = want[i]
      val same = if (value is Double) {
        val w = expected.toDouble()
        if (value == w) identical++
        val relative = StrictMath.abs(value - w) / maxOf(1.0, StrictMath.abs(w))
        widest = maxOf(widest, relative)
        relative <= RELATIVE_BOUND
      } else {
        val equal = value == expected
        if (equal) identical++
        equal
      }
      if (!same) {
        differences++
        if (differences <= 20) println("${want[0]} field $i: TypeScript $expected, Kotlin ${if (value is Double) jsNumber(value) else value}")
      }
    }
  }
  println(
    "slice 1 (Kotlin backend, JVM): ${lines.size} seeds, $checked values, $differences differences " +
      "(colours exact; numbers within $RELATIVE_BOUND relative, the widest $widest); $identical of $checked bit-identical",
  )
  exitProcess(if (differences == 0) 0 else 1)
}
