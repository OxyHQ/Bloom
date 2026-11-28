// The colour engine's conformance on the JVM: every line of the TypeScript engine's golden
// (src/theme/__tests__/__fixtures__/golden-color-engine.txt, scripts/generate-color-engine-golden.ts)
// recomputed by so.oxy.bloom.color: every colour exactly (the theme's tokens are colours), and the engine's raw
// numbers (CAM16 hue and chroma, L*) within RELATIVE_BOUND of the TypeScript's. The port uses StrictMath (fdlibm), the same bits on
// every JVM and Android device; V8's Math.pow rounds some results an ulp or two apart from it, which an
// ill-conditioned hue (a grey's) widens to about 1e-14 relative. The colours are the same.
// Run by crates/native/scripts/color-conformance.sh. Exits 1 on any difference.
import so.oxy.bloom.color.Cam16
import so.oxy.bloom.color.Hct
import so.oxy.bloom.color.TonalPalette
import so.oxy.bloom.color.argbFromHex
import so.oxy.bloom.color.hexFromArgb
import so.oxy.bloom.color.lstarFromArgb
import java.io.File
import kotlin.system.exitProcess

const val RELATIVE_BOUND = 1e-12

val TONES = listOf(0, 4, 5, 6, 10, 12, 15, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100)

fun main(args: Array<String>) {
  val lines = File(args[0]).readLines().filter { it.isNotBlank() }
  var differences = 0
  var checked = 0
  var widest = 0.0
  for (line in lines) {
    val want = line.split(' ')
    val seed = argbFromHex(want[0])
    val cam = Cam16.fromInt(seed)
    val palette = TonalPalette.fromInt(seed)
    val key = TonalPalette.fromHueAndChroma(cam.hue, 48.0).keyColor
    val vivid = listOf(30.0, 50.0, 80.0).map { hexFromArgb(Hct.from(cam.hue, 200.0, it).toInt()) }
    val got = listOf(hexFromArgb(seed)) +
      listOf(cam.hue, cam.chroma, lstarFromArgb(seed)).map { it } +
      TONES.map { hexFromArgb(palette.tone(it.toDouble())) } +
      listOf(hexFromArgb(key.toInt())) + vivid
    for ((i, value) in got.withIndex()) {
      checked++
      val expected = want[i]
      val same = if (value is Double) {
        val want = expected.toDouble()
        val relative = kotlin.math.abs(value - want) / maxOf(1.0, kotlin.math.abs(want))
        widest = maxOf(widest, relative)
        relative <= RELATIVE_BOUND
      } else {
        value == expected
      }
      if (!same) {
        differences++
        if (differences <= 20 || value !is Double) println("${want[0]} field $i: TypeScript $expected, Kotlin $value")
      }
    }
  }
  println("color-conformance: ${lines.size} seeds, $checked values, $differences differences (colours exact; numbers within $RELATIVE_BOUND relative, the widest $widest)")
  exitProcess(if (differences == 0) 0 else 1)
}
