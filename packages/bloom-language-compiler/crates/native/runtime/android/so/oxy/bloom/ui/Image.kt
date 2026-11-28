// The image pipeline of the kotlin-compose backend (ADR 0003): what BloomImage's Kotlin
// does over Fresco for React Native, here with no image library: HTTP into a disk cache,
// decoded off the main thread at the drawn size (`inSampleSize`), into a memory cache of
// decoded bitmaps. A production backend would take Coil (or Bloom's own pipeline); the bench
// keeps the APK free of it to measure Compose itself.
package so.oxy.bloom.ui

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.asCoroutineDispatcher
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

object ImagePipeline {
  @Volatile private var drawn = false

  /** The first content picture drawn in the process (not an avatar): one `BLOOM_BENCH island-first-image` line (the bench's mark, as React Native's `feed-image`). */
  fun markFirstDraw() {
    if (drawn) return
    drawn = true
    Log.i("Bloom", "BLOOM_BENCH island-first-image")
  }

  private val maxBytes = (Runtime.getRuntime().maxMemory() / 4).coerceAtMost(96L * 1024 * 1024).toInt()
  private val memory = object : LruCache<String, ImageBitmap>(maxBytes) {
    override fun sizeOf(key: String, value: ImageBitmap): Int = value.width * value.height * 4
  }
  private val inflight = HashMap<String, Deferred<ImageBitmap?>>()

  /** Fetches and decodes, four at a time (Fresco's decode pool is per core; the bench's rows need fewer). */
  private val io = java.util.concurrent.Executors.newFixedThreadPool(4).asCoroutineDispatcher()
  private val scope = CoroutineScope(SupervisorJob() + io)

  /** A decoded size bucket: a size rounded up to 64 px, so close sizes share a decode. */
  private fun bucket(n: Int) = ((n + 63) / 64) * 64

  fun cached(url: String, w: Int, h: Int): ImageBitmap? = memory.get("$url@${bucket(w)}x${bucket(h)}")

  /**
   * The picture at `url` decoded for a `w`×`h` view. The work belongs to the pipeline, not to
   * the caller: a row scrolled away (its effect cancelled) leaves the decode to finish into
   * the cache, and a second caller of the same key awaits the same work.
   */
  suspend fun load(context: Context, url: String, w: Int, h: Int): ImageBitmap? {
    val key = "$url@${bucket(w)}x${bucket(h)}"
    memory.get(key)?.let { return it }
    val app = context.applicationContext
    val work = synchronized(inflight) {
      inflight.getOrPut(key) {
        scope.async {
          val bytes = runCatching { bytes(app, url) }.onFailure { Log.w("BloomImage", "$url: $it") }.getOrNull()
          val decoded = bytes?.let { runCatching { decode(it, bucket(w), bucket(h)) }.getOrNull() }
          if (decoded != null) memory.put(key, decoded)
          synchronized(inflight) { inflight.remove(key) }
          decoded
        }
      }
    }
    return work.await()
  }

  private fun bytes(context: Context, url: String): ByteArray {
    if (url.startsWith("data:")) return android.util.Base64.decode(url.substringAfter(','), android.util.Base64.DEFAULT)
    val name = MessageDigest.getInstance("SHA-1").digest(url.toByteArray()).joinToString("") { "%02x".format(it) }
    val dir = File(context.cacheDir, "bloom-images").apply { mkdirs() }
    val file = File(dir, name)
    if (file.exists()) return file.readBytes()
    var connection = open(URL(url))
    var hops = 0
    while (connection.responseCode in 300..399 && hops < 5) {
      val next = connection.getHeaderField("Location") ?: break
      connection.disconnect()
      connection = open(URL(URL(url), next))
      hops++
    }
    val data = connection.inputStream.use { it.readBytes() }
    connection.disconnect()
    val tmp = File(dir, "$name.tmp")
    tmp.writeBytes(data)
    tmp.renameTo(file)
    return data
  }

  private fun open(url: URL): HttpURLConnection =
    (url.openConnection() as HttpURLConnection).apply {
      connectTimeout = 10_000
      readTimeout = 10_000
      instanceFollowRedirects = true
    }

  private fun decode(data: ByteArray, w: Int, h: Int): ImageBitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(data, 0, data.size, bounds)
    var sample = 1
    while (bounds.outWidth / (sample * 2) >= w && bounds.outHeight / (sample * 2) >= h) sample *= 2
    val options = BitmapFactory.Options().apply {
      inSampleSize = sample
      inPreferredConfig = Bitmap.Config.ARGB_8888
    }
    val bitmap = BitmapFactory.decodeByteArray(data, 0, data.size, options) ?: return null
    bitmap.prepareToDraw()
    return bitmap.asImageBitmap()
  }
}

/** Draws `url` at the view's size, `cover` or `contain`; a placeholder fill until it arrives. */
@Composable
fun BloomImage(url: String, contentFit: ContentFit, modifier: Modifier = Modifier, benchMark: Boolean = true) {
  val context = LocalContext.current
  var size by remember { mutableStateOf(IntSize.Zero) }
  var bitmap by remember(url) { mutableStateOf<ImageBitmap?>(null) }
  if (size != IntSize.Zero && bitmap == null) {
    ImagePipeline.cached(url, size.width, size.height)?.let { bitmap = it }
  }
  LaunchedEffect(url, size) {
    if (size != IntSize.Zero && bitmap == null) bitmap = ImagePipeline.load(context, url, size.width, size.height)
  }
  val current = bitmap
  Box(
    modifier
      .onSizeChanged { size = it }
      .background(Colors.mutedFill)
      .drawWithCache {
        onDrawBehind {
          if (current != null) {
            if (benchMark) ImagePipeline.markFirstDraw()
            // The draw scope's size (floats), not the state above it.
            val box = this.size
            val sw = box.width / current.width
            val sh = box.height / current.height
            val s = if (contentFit == ContentFit.contain) minOf(sw, sh) else maxOf(sw, sh)
            val dw = (current.width * s).toInt()
            val dh = (current.height * s).toInt()
            val dx = ((box.width - dw) / 2).toInt()
            val dy = ((box.height - dh) / 2).toInt()
            drawImage(current, dstOffset = IntOffset(dx, dy), dstSize = IntSize(dw, dh))
          }
        }
      },
  )
}
