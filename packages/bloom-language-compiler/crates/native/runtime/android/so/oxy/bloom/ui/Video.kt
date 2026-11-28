package so.oxy.bloom.ui

import android.content.Context
import android.graphics.Matrix
import android.view.TextureView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.VideoSize
import androidx.media3.exoplayer.ExoPlayer
import kotlinx.coroutines.delay

/**
 * `VideoPlayer(url:)` (the stdlib's `@Observable` player, AVPlayer's shape): what plays, muted or
 * not, looping or not, whether it is playing, and where. The picture and the decoder are the
 * [Video] that shows it: a player holds no decoder of its own, so a feed's players cost nothing
 * until one plays, and one that gives its decoder up keeps its position and resumes from there.
 * It is the Kotlin runtime's: the stdlib's `url` is a `URL`, and the backend passes its text.
 */
@Stable
class VideoPlayer(val url: String) {
  var isMuted by mutableStateOf(false)
  var loops by mutableStateOf(false)

  /** Whether it is playing (asked to play and holding a decoder, or about to take one). */
  var isPlaying by mutableStateOf(false)
    private set

  /** The position, in seconds from the start. */
  var currentTime by mutableStateOf(0.0)
    internal set

  /** The video's length in seconds, once known (0 before). */
  var duration by mutableStateOf(0.0)
    internal set

  /** The decoder it plays on now, lent by [VideoPool] to its [Video]. */
  internal var decoder: ExoPlayer? = null

  fun play() {
    isPlaying = true
  }

  fun pause() {
    decoder?.let { currentTime = it.currentPosition / 1000.0 }
    isPlaying = false
  }

  fun seek(to: Double) {
    currentTime = maxOf(0.0, to)
    decoder?.seekTo((currentTime * 1000).toLong())
  }
}

/** `.videoGravity(…)`: `fill` covers the box (cropped), `fit` shows the whole picture. */
enum class VideoGravity { fill, fit }

/** `.controls(…)`: `hidden` draws none; `automatic`'s playback controls are not drawn yet. */
enum class VideoControls { hidden, automatic }

/**
 * The decoders every [Video] borrows while its player plays: one for the app by default (the
 * ruled contract; [max] raises it). A player that starts takes the decoder of the least
 * recently played one, which pauses, gives its source up and keeps its position, to resume
 * from there when it plays again.
 */
internal object VideoPool {
  var max = 1
  private val free = ArrayDeque<ExoPlayer>()

  /** Lent decoders by their views, least recently played first. */
  private val lent = LinkedHashMap<Any, Pair<ExoPlayer, VideoPlayer>>()

  fun acquire(context: Context, owner: Any, player: VideoPlayer): ExoPlayer {
    lent.remove(owner)?.let { (exo, _) ->
      lent[owner] = exo to player
      return exo
    }
    val exo = free.removeFirstOrNull() ?: if (lent.size + free.size < max) {
      ExoPlayer.Builder(context.applicationContext).build()
    } else {
      val (oldest, entry) = lent.entries.first()
      lent.remove(oldest)
      val (taken, from) = entry
      from.pause()
      from.decoder = null
      taken.stop()
      taken.clearMediaItems()
      taken.clearVideoSurface()
      taken
    }
    lent[owner] = exo to player
    return exo
  }

  fun release(owner: Any) {
    val (exo, player) = lent.remove(owner) ?: return
    if (player.decoder === exo) {
      player.currentTime = exo.currentPosition / 1000.0
      player.decoder = null
    }
    exo.stop()
    exo.clearMediaItems()
    exo.clearVideoSurface()
    free.addLast(exo)
  }

  /** How many decoders exist (lent or free): the pool's bound, for the bench. */
  fun decoders(): Int = lent.size + free.size
}

/**
 * A source as media3 plays it: an HLS playlist named as one, since HLS is not found by
 * extractor sniffing (Mention's `utils/hlsSource.ts` rule); else as it comes.
 */
internal fun mediaItem(url: String): MediaItem {
  val uri = android.net.Uri.parse(url)
  fun playlist(u: android.net.Uri): Boolean =
    u.path.orEmpty().trimEnd('/').lowercase().endsWith(".m3u8") || u.getQueryParameter("variant") == "hls_master"
  // Oxy's ladder (`?variant=hls_master`, no extension), a `.m3u8` path, or one proxied (`?url=`).
  val hls = playlist(uri) || uri.getQueryParameter("url")?.let { playlist(android.net.Uri.parse(it)) } == true
  return if (hls) {
    MediaItem.Builder().setUri(url).setMimeType(androidx.media3.common.MimeTypes.APPLICATION_M3U8).build()
  } else {
    MediaItem.fromUri(url)
  }
}

/** A video view's own state: its picture, the player it borrowed, and the first frame. */
private class VideoSlot {
  var texture: TextureView? = null
  var player: ExoPlayer? = null
  var firstFrame by mutableStateOf(false)
  var size: VideoSize = VideoSize.UNKNOWN
  var fit: ContentFit = ContentFit.cover
  val listener = object : Player.Listener {
    override fun onRenderedFirstFrame() {
      firstFrame = true
    }

    override fun onVideoSizeChanged(videoSize: VideoSize) {
      size = videoSize
      fitTexture()
    }
  }

  /** The picture fitted to its box: `cover` fills it (cropped), `contain` fits inside it. */
  fun fitTexture() {
    val view = texture ?: return
    val vw = size.width * size.pixelWidthHeightRatio
    val vh = size.height.toFloat()
    val w = view.width.toFloat()
    val h = view.height.toFloat()
    if (vw <= 0f || vh <= 0f || w <= 0f || h <= 0f) return
    val scale = when (fit) {
      ContentFit.cover -> maxOf(w / vw, h / vh)
      else -> minOf(w / vw, h / vh)
    }
    val m = Matrix()
    // TextureView stretches the picture to the view: undo that, then scale it as fitted.
    m.setScale(vw * scale / w, vh * scale / h, w / 2f, h / 2f)
    view.setTransform(m)
  }
}

/**
 * `Video(player:)`: the picture of [player], on a TextureView (it clips and scrolls with the
 * page), with its `.poster(url)` until the first frame is on screen, fitted by `.videoGravity`
 * (or `contentFit`). It borrows the pool's decoder only while its player plays.
 */
@Composable
fun Video(
  player: VideoPlayer,
  poster: String? = null,
  contentFit: ContentFit = ContentFit.cover,
  videoGravity: VideoGravity? = null,
  controls: VideoControls = VideoControls.hidden,
  modifier: Modifier = Modifier,
) {
  val context = LocalContext.current
  val slot = remember(player) { VideoSlot() }
  slot.fit = when (videoGravity) {
    VideoGravity.fill -> ContentFit.cover
    VideoGravity.fit -> ContentFit.contain
    null -> contentFit
  }
  val playing = player.isPlaying
  val muted = player.isMuted
  val loops = player.loops
  DisposableEffect(player, playing) {
    if (playing) {
      val exo = VideoPool.acquire(context, slot, player)
      slot.player = exo
      player.decoder = exo
      exo.addListener(slot.listener)
      slot.texture?.let { exo.setVideoTextureView(it) }
      exo.setMediaItem(mediaItem(player.url), (player.currentTime * 1000).toLong())
      exo.prepare()
      exo.playWhenReady = true
    }
    onDispose {
      slot.player?.removeListener(slot.listener)
      slot.player = null
      slot.firstFrame = false
      VideoPool.release(slot)
    }
  }
  slot.player?.let { exo ->
    exo.volume = if (muted) 0f else 1f
    exo.repeatMode = if (loops) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
  }
  // The position and the length, while it plays.
  LaunchedEffect(player, playing) {
    while (playing) {
      slot.player?.let { exo ->
        player.currentTime = exo.currentPosition / 1000.0
        if (exo.duration != C.TIME_UNSET) player.duration = exo.duration / 1000.0
      }
      delay(250)
    }
  }
  // Clipped: a covering picture is scaled past the box (the TextureView's transform).
  Box(modifier.clipToBounds()) {
    AndroidView(
      factory = { c ->
        TextureView(c).also { view ->
          slot.texture = view
          slot.player?.setVideoTextureView(view)
          view.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ -> slot.fitTexture() }
        }
      },
      modifier = Modifier.fillMaxSize(),
    )
    if (poster != null && !slot.firstFrame) {
      BloomImage(poster, slot.fit, Modifier.fillMaxSize(), benchMark = false)
    }
  }
}

/**
 * `Video(url:, poster:)` with `.muted()`, `.loops()` and `.autoplay()`: a player of its own;
 * autoplaying, it plays as it comes half on screen (in its window) and pauses as it leaves, as
 * a feed's video does. It acts on those changes only: a video another one took the decoder from
 * stays paused until it comes on screen again.
 */
@Composable
fun Video(
  url: String,
  poster: String? = null,
  muted: Boolean = false,
  loops: Boolean = false,
  autoplay: Boolean = false,
  contentFit: ContentFit = ContentFit.cover,
  videoGravity: VideoGravity? = null,
  controls: VideoControls = VideoControls.hidden,
  modifier: Modifier = Modifier,
) {
  val player = remember(url) { VideoPlayer(url) }
  player.isMuted = muted
  player.loops = loops
  val view = LocalView.current
  val shown = remember(player) { booleanArrayOf(false) }
  val watch = if (!autoplay) {
    Modifier
  } else {
    Modifier.onGloballyPositioned { coordinates ->
      val bounds = coordinates.boundsInWindow()
      val area = coordinates.size.width.toFloat() * coordinates.size.height
      val visible = bounds.width * bounds.height
      val window = android.graphics.Rect().also { view.getWindowVisibleDisplayFrame(it) }
      val onScreen = area > 0f && visible / area >= 0.5f && bounds.bottom > window.top && bounds.top < window.bottom
      if (onScreen != shown[0]) {
        shown[0] = onScreen
        if (onScreen) player.play() else player.pause()
      }
    }
  }
  DisposableEffect(player) { onDispose { player.pause() } }
  Video(player, poster, contentFit, videoGravity, controls, modifier.then(watch))
}
