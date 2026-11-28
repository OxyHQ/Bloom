// Slice 2 of the colour engine written in Bloom (the roles, the schemes, generateRoleColors), as
// bloom-native emits it for kotlin-compose, held on the JVM to the role goldens:
// src/theme/__tests__/fixtures/color-roles-golden.txt (scripts/generate-color-roles-golden.ts) and
// fixtures/color-engine-golden.json (the frozen Material reference). Colours, exactly.
// Run by scripts/kotlin-golden.sh (HARNESS=Slice2ConformanceKt). Exits 1 on any difference.
import bloom.bloomthemeengine.colorengine.GenerateOptions
import bloom.bloomthemeengine.colorengine.SchemeVariant
import bloom.bloomthemeengine.colorengine.generateRoleColors
import java.io.File
import kotlin.system.exitProcess

fun rgbToHex(rgb: String): String {
  val m = Regex("""rgb\((\d+) (\d+) (\d+)\)""").matchEntire(rgb) ?: error("expected rgb(r g b), got $rgb")
  return "#" + (1..3).joinToString("") { m.groupValues[it].toInt().toString(16).padStart(2, '0') }
}

val PRESETS = mapOf("oxy" to "#C46EDE", "blue" to "#1D9BF0", "green" to "#10B981", "pink" to "#EC4899", "faircoin" to "#9FFB50")

/** The flat `{ "a|b|c": { "role": "#hex", … }, … }` of color-engine-golden.json, without a JSON library. */
fun materialGolden(text: String): List<Pair<String, List<Pair<String, String>>>> =
  Regex(""""([^"]+)":\s*\{([^}]*)\}""").findAll(text).map { combo ->
    combo.groupValues[1] to Regex(""""(\w+)":\s*"(#[0-9a-f]{6})"""").findAll(combo.groupValues[2]).map { it.groupValues[1] to it.groupValues[2] }.toList()
  }.toList()

fun main(args: Array<String>) {
  val fixtures = File(args[0]).parentFile.parentFile.resolve("fixtures")
  val all = fixtures.resolve("color-roles-golden.txt").readLines().filter { it.isNotBlank() }
  val names = all.first().removePrefix("# ").split(' ')
  var checked = 0
  var differences = 0
  for (line in all.drop(1)) {
    val f = line.split(' ')
    val options = GenerateOptions(
      seed = f[0],
      variant = SchemeVariant.valueOf(f[1]),
      isDark = f[2] == "dark",
      contrastLevel = f[3].toDouble(),
      secondarySeed = f[4].takeIf { it != "-" },
      tertiarySeed = f[5].takeIf { it != "-" },
    )
    val roles = generateRoleColors(options)
    for ((i, name) in names.withIndex()) {
      checked++
      val got = rgbToHex(roles[name] ?: "missing")
      if (got != f[6 + i]) {
        differences++
        if (differences <= 20) println("${f.take(6).joinToString(" ")} $name: TypeScript ${f[6 + i]}, Kotlin $got")
      }
    }
  }
  var materialChecked = 0
  for ((combo, roles) in materialGolden(fixtures.resolve("color-engine-golden.json").readText())) {
    val (seed, variant, mode) = combo.split('|')
    val got = generateRoleColors(GenerateOptions(seed = PRESETS.getValue(seed), variant = SchemeVariant.valueOf(variant), isDark = mode == "dark"))
    for ((role, want) in roles) {
      materialChecked++
      val hex = rgbToHex(got[role] ?: "missing")
      if (hex != want) {
        differences++
        if (differences <= 40) println("$combo $role: golden $want, Kotlin $hex")
      }
    }
  }
  println(
    "slice 2 (Kotlin backend, JVM): ${all.size - 1} schemes, $checked role colours, and $materialChecked of " +
      "color-engine-golden.json: $differences differences",
  )
  exitProcess(if (differences == 0 && materialChecked > 0) 0 else 1)
}
