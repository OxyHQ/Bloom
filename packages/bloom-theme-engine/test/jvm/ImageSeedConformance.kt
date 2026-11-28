// The image seed's Bloom part (the assignment of colours to the Wu representatives, and the
// scoring), as bloom-native emits it for kotlin-compose, held on the JVM to
// src/theme/__tests__/fixtures/image-seed-golden.txt (scripts/generate-image-seed-golden.ts). The Wu
// quantizer's output comes from the golden. Run by scripts/kotlin-golden.sh. Exits 1 on any difference.
import bloom.bloomthemeengine.colorengine.ScoreOptions
import bloom.bloomthemeengine.colorengine.assignToRepresentatives
import bloom.bloomthemeengine.colorengine.score
import java.io.File
import kotlin.system.exitProcess

fun hex8(n: Long): String = n.toString(16).padStart(8, '0')

fun pairsOf(s: String): Map<Long, Long> =
  if (s.isEmpty()) emptyMap() else s.split(',').associate { p -> p.substringBefore(':').toLong(16) to p.substringAfter(':').toLong() }.let { LinkedHashMap(it) }

fun main(args: Array<String>) {
  val lines = File(args[0]).parentFile.parentFile.resolve("fixtures/image-seed-golden.txt").readLines().filter { it.isNotBlank() }
  var checked = 0
  var differences = 0
  for (line in lines) {
    val parts = line.split('\t')
    val f = parts.drop(1).associate { it.substringBefore('=') to it.substringAfter('=') }
    val wu = f.getValue("wu").let { if (it.isEmpty()) emptyList() else it.split(',').map { h -> h.toLong(16) } }
    val quantized = assignToRepresentatives(wu, pairsOf(f.getValue("counts")))
    val got = listOf(
      "quantized" to quantized.entries.joinToString(",") { "${hex8(it.key)}:${it.value}" },
      "score" to score(quantized).joinToString(",") { hex8(it) },
      "score1" to score(quantized, ScoreOptions(desired = 1L)).joinToString(",") { hex8(it) },
      "unfiltered" to score(quantized, ScoreOptions(filter = false)).joinToString(",") { hex8(it) },
    )
    for ((field, value) in got) {
      checked += if (field == "quantized") quantized.size else 1
      if (value != f.getValue(field)) {
        differences++
        println("${parts[0]} $field: TypeScript ${f.getValue(field)}, Kotlin $value")
      }
    }
  }
  println("image seed (Kotlin backend, JVM): ${lines.size} images, $checked populations and rankings, $differences differences")
  exitProcess(if (differences == 0) 0 else 1)
}
