// Slice 3 of the colour engine written in Bloom (the colour policy, a seed's canonical tokens, the
// JS theme's colours), as bloom-native emits it for kotlin-compose, held on the JVM to
// src/theme/__tests__/fixtures/seed-tokens-golden.txt (scripts/generate-seed-tokens-golden.ts),
// whose preset lines are golden-resolved-tokens.json's entries. Every token and colour exactly.
// Run by scripts/kotlin-golden.sh. Exits 1 on any difference.
import bloom.bloomthemeengine.colorengine.SchemeVariant
import bloom.bloomthemeengine.colorengine.SeedThemeOptions
import bloom.bloomthemeengine.colorengine.seedThemeColors
import bloom.bloomthemeengine.colorengine.seedTokens
import java.io.File
import kotlin.system.exitProcess

fun main(args: Array<String>) {
  val all = File(args[0]).parentFile.parentFile.resolve("fixtures/seed-tokens-golden.txt").readLines().filter { it.isNotBlank() }
  val tokenNames = all[0].split('\t').drop(1)
  val colorNames = all[1].split('\t').drop(1)
  var checked = 0
  var differences = 0
  for (line in all.drop(2)) {
    val f = line.split('\t')
    val options = SeedThemeOptions(
      seed = f[0],
      isDark = f[1] == "dark",
      variant = if (f[2] == "-") null else SchemeVariant.valueOf(f[2]),
      contrastLevel = f[3].toDouble(),
      secondarySeed = f[4].takeIf { it != "-" },
      tertiarySeed = f[5].takeIf { it != "-" },
    )
    val tokens = seedTokens(options)
    val colors = seedThemeColors(options)
    val got = tokenNames.map { tokens[it] } + colors.map { it.second }
    val names = tokenNames + colors.map { "colors.${it.first}" }
    if (tokens.keys.toList() != tokenNames || colors.map { it.first } != colorNames) {
      differences++
      println("${f.take(6).joinToString(" ")}: names or order differ")
    }
    for (i in got.indices) {
      checked++
      if (got[i] != f[6 + i]) {
        differences++
        if (differences <= 20) println("${f.take(6).joinToString(" ")} ${names[i]}: TypeScript ${f[6 + i]}, Kotlin ${got[i]}")
      }
    }
  }
  println("slice 3 (Kotlin backend, JVM): ${all.size - 2} seeds, $checked tokens and colours, $differences differences")
  exitProcess(if (differences == 0) 0 else 1)
}
