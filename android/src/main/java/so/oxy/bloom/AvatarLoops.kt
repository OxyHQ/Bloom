package so.oxy.bloom

import android.content.Context
import android.graphics.Path
import android.os.Handler
import android.os.Looper
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import java.io.File
import java.util.concurrent.Executors

/**
 * One outline of an avatar frame, as the renderer writes it: absolute `M`, `L`, `H`, `V` and `Z`
 * commands (`vector-contour.ts`, `vector-visibility.ts`). `H` and `V` are kept as lines.
 */
class AvatarPathData(val verbs: ByteArray, val points: FloatArray) {
  fun toPath(): Path {
    val path = Path()
    path.fillType = Path.FillType.WINDING
    var p = 0
    for (verb in verbs) {
      when (verb) {
        MOVE -> { path.moveTo(points[p], points[p + 1]); p += 2 }
        LINE -> { path.lineTo(points[p], points[p + 1]); p += 2 }
        else -> path.close()
      }
    }
    return path
  }

  companion object {
    const val MOVE: Byte = 0
    const val LINE: Byte = 1
    const val CLOSE: Byte = 2

    /** Parses SVG path data with absolute M/L/H/V/Z commands; anything else is an error. */
    fun parse(d: String): AvatarPathData {
      val verbs = ByteArray(d.length / 2 + 1)
      val points = FloatArray(d.length + 2)
      var verbCount = 0
      var pointCount = 0
      var x = 0f
      var y = 0f
      var startX = 0f
      var startY = 0f
      var i = 0
      val n = d.length
      fun number(): Float {
        while (i < n && (d[i] == ' ' || d[i] == ',')) i++
        val start = i
        if (i < n && (d[i] == '-' || d[i] == '+')) i++
        while (i < n && (d[i].isDigit() || d[i] == '.' || d[i] == 'e' || d[i] == 'E' ||
            ((d[i] == '-' || d[i] == '+') && (d[i - 1] == 'e' || d[i - 1] == 'E')))) i++
        require(i > start) { "Avatar path: number expected at $start" }
        return d.substring(start, i).toFloat()
      }
      fun add(verb: Byte, px: Float, py: Float) {
        verbs[verbCount++] = verb
        points[pointCount++] = px
        points[pointCount++] = py
        x = px
        y = py
      }
      while (i < n) {
        val command = d[i]
        if (command == ' ' || command == ',') { i++; continue }
        i++
        when (command) {
          'M' -> { add(MOVE, number(), number()); startX = x; startY = y }
          'L' -> add(LINE, number(), number())
          'H' -> add(LINE, number(), y)
          'V' -> add(LINE, x, number())
          'Z', 'z' -> { verbs[verbCount++] = CLOSE; x = startX; y = startY }
          else -> throw IllegalArgumentException("Avatar path: unsupported command $command")
        }
        // Repeated coordinate pairs after M or L continue as lines, as in SVG.
        while (command == 'M' || command == 'L') {
          var j = i
          while (j < n && d[j] == ' ') j++
          if (j >= n || !(d[j].isDigit() || d[j] == '-' || d[j] == '.')) break
          add(LINE, number(), number())
        }
      }
      return AvatarPathData(verbs.copyOf(verbCount), points.copyOf(pointCount))
    }
  }
}

/** The paint and outlines one path of a loop has on every frame. */
class AvatarTrack(
  val fill: Int,
  val fillOpacity: Float,
  val stroke: Int?,
  val strokeWidth: Float,
  val opacity: FloatArray,
  val d: Array<Path>,
  val clip: Array<Path>?,
)

/** A character's rest loop: `length` frames evenly over `duration` seconds. */
class AvatarLoop(val duration: Double, val length: Int, val viewBox: FloatArray, val tracks: List<AvatarTrack>, val bytes: Int) {
  /** The frame a loop clock reads at `seconds` (`vectorLoopIndex` in vector-loop.ts). */
  fun index(seconds: Double): Int {
    if (duration <= 0) return 0
    val elapsed = ((seconds % duration) + duration) % duration
    return minOf(length - 1, kotlin.math.floor(elapsed / duration * length).toInt()).coerceAtLeast(0)
  }
}

/** A loop as JS hands it over, still as numbers: what is parsed once, written to disk and read back. */
class AvatarLoopData(
  val duration: Double,
  val length: Int,
  val viewBox: FloatArray,
  val tracks: List<Track>,
) {
  class Track(
    val fill: Int,
    val fillOpacity: Float,
    val stroke: Int?,
    val strokeWidth: Float,
    val opacity: FloatArray,
    val d: List<AvatarPathData>,
    val clip: List<AvatarPathData>?,
  )

  fun toLoop(): AvatarLoop {
    var bytes = 0
    val built = tracks.map { track ->
      fun paths(list: List<AvatarPathData>) = Array(list.size) { list[it].also { data -> bytes += data.points.size * 4 + data.verbs.size }.toPath() }
      AvatarTrack(track.fill, track.fillOpacity, track.stroke, track.strokeWidth, track.opacity, paths(track.d), track.clip?.let(::paths))
    }
    return AvatarLoop(duration, length, viewBox, built, bytes)
  }

  fun write(out: DataOutputStream) {
    out.writeInt(FORMAT)
    out.writeDouble(duration)
    out.writeInt(length)
    viewBox.forEach(out::writeFloat)
    out.writeInt(tracks.size)
    for (track in tracks) {
      out.writeInt(track.fill)
      out.writeFloat(track.fillOpacity)
      out.writeBoolean(track.stroke != null)
      out.writeInt(track.stroke ?: 0)
      out.writeFloat(track.strokeWidth)
      track.opacity.forEach(out::writeFloat)
      track.d.forEach { writePath(out, it) }
      out.writeBoolean(track.clip != null)
      track.clip?.forEach { writePath(out, it) }
    }
  }

  companion object {
    private const val FORMAT = 1

    private fun writePath(out: DataOutputStream, path: AvatarPathData) {
      out.writeInt(path.verbs.size)
      out.write(path.verbs)
      out.writeInt(path.points.size)
      path.points.forEach(out::writeFloat)
    }

    private fun readPath(input: DataInputStream): AvatarPathData {
      val verbs = ByteArray(input.readInt())
      input.readFully(verbs)
      val points = FloatArray(input.readInt()) { input.readFloat() }
      return AvatarPathData(verbs, points)
    }

    fun read(input: DataInputStream): AvatarLoopData? {
      if (input.readInt() != FORMAT) return null
      val duration = input.readDouble()
      val length = input.readInt()
      val viewBox = FloatArray(4) { input.readFloat() }
      val tracks = List(input.readInt()) {
        val fill = input.readInt()
        val fillOpacity = input.readFloat()
        val stroked = input.readBoolean()
        val stroke = input.readInt()
        val strokeWidth = input.readFloat()
        val opacity = FloatArray(length) { input.readFloat() }
        val d = List(length) { readPath(input) }
        val clip = if (input.readBoolean()) List(length) { readPath(input) } else null
        Track(fill, fillOpacity, if (stroked) stroke else null, strokeWidth, opacity, d, clip)
      }
      return AvatarLoopData(duration, length, viewBox, tracks)
    }
  }
}

/**
 * The rest loops this process has, shared by every avatar surface: the ones in use in memory, and
 * every loop JS has ever handed over in the app's cache directory, so a cold start plays a
 * character's loop without computing it again. Keys come from JS (`vectorLoopKey`) and name the
 * loop's content, so a loop is never read back for anything but what it was made from.
 *
 * Memory is touched on the main thread only; parsing and file work run on one background thread.
 */
object AvatarLoops {
  /** Loops kept in memory, in bytes of path data. */
  private const val MEMORY_BYTES = 24 shl 20
  /** Loops kept on disk, in bytes of files. */
  private const val DISK_BYTES = 48L shl 20
  private val KEY = Regex("^[0-9a-z]{1,64}$")

  private val main = Handler(Looper.getMainLooper())
  private val worker = Executors.newSingleThreadExecutor { runnable -> Thread(runnable, "BloomAvatarLoops") }
  private val memory = LinkedHashMap<String, AvatarLoop>(16, .75f, true)
  private var held = 0
  private val waiting = HashMap<String, MutableList<(AvatarLoop?) -> Unit>>()

  fun validKey(key: String) = KEY.matches(key)

  private fun directory(context: Context) = File(context.cacheDir, "bloom-avatar-loops")

  /** The loop `key` names, from memory or disk; `null` when this device has never been given it. */
  fun get(context: Context, key: String, done: (AvatarLoop?) -> Unit) {
    memory[key]?.let { done(it); return }
    if (enqueue(key, done)) return
    val file = File(directory(context), "$key.loop")
    worker.execute {
      val loop = try {
        if (!file.isFile) null else DataInputStream(BufferedInputStream(file.inputStream(), 1 shl 16)).use { input ->
          AvatarLoopData.read(input)?.toLoop()
        }?.also { file.setLastModified(System.currentTimeMillis()) }
      } catch (_: Exception) {
        file.delete()
        null
      }
      main.post { finish(key, loop) }
    }
  }

  /** Keeps the loop JS computed, in memory and on disk, then hands it to whoever asked for it. */
  fun put(context: Context, key: String, data: () -> AvatarLoopData, done: (AvatarLoop?) -> Unit) {
    memory[key]?.let { done(it); return }
    if (enqueue(key, done)) return
    val directory = directory(context)
    worker.execute {
      val parsed = try { data() } catch (_: Exception) { null }
      val loop = parsed?.toLoop()
      main.post { finish(key, loop) }
      if (parsed != null) save(directory, key, parsed)
    }
  }

  private fun enqueue(key: String, done: (AvatarLoop?) -> Unit): Boolean {
    val list = waiting[key]
    if (list != null) { list.add(done); return true }
    waiting[key] = mutableListOf(done)
    return false
  }

  private fun finish(key: String, loop: AvatarLoop?) {
    if (loop != null) remember(key, loop)
    waiting.remove(key)?.forEach { it(loop) }
  }

  private fun remember(key: String, loop: AvatarLoop) {
    memory.remove(key)?.let { held -= it.bytes }
    memory[key] = loop
    held += loop.bytes
    val oldest = memory.entries.iterator()
    while (held > MEMORY_BYTES && oldest.hasNext()) {
      val entry = oldest.next()
      if (entry.key == key) continue
      held -= entry.value.bytes
      oldest.remove()
    }
  }

  private fun save(directory: File, key: String, data: AvatarLoopData) {
    try {
      directory.mkdirs()
      val file = File(directory, "$key.loop")
      val partial = File(directory, "$key.part")
      DataOutputStream(BufferedOutputStream(partial.outputStream(), 1 shl 16)).use(data::write)
      if (!partial.renameTo(file)) partial.delete()
      val files = directory.listFiles()?.sortedByDescending { it.lastModified() } ?: return
      var total = 0L
      for (old in files) {
        total += old.length()
        if (total > DISK_BYTES) old.delete()
      }
    } catch (_: Exception) {
      // A loop that cannot be written is computed again on the next start; nothing else changes.
    }
  }
}
