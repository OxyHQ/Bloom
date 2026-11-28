package so.oxy.bloom.ui

import android.content.Context
import android.graphics.Matrix
import android.view.TextureView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.VideoSize
import androidx.media3.exoplayer.ExoPlayer

/**
 * `VideoPlayer(url:)` (the stdlib's `@Observable` player): what plays, muted or not, looping or
 * not, and whether it is asked to play. The picture and the decoders are the [Video] that shows
 * it: a player holds no decoder of its own, so a feed's players cost nothing until one plays.
 */
@Stable
class VideoPlayer(val url: String) {
  var isMuted by mutableStateOf(false)
  var loops by mutableStateOf(false)

  /** Whether it is asked to play (`play()`), not whether a frame is moving yet. */
  var isPlaying by mutableStateOf(false)
    private set

  fun play() {
    isPlaying = true
  }

  fun pause() {
    isPlaying = false
  }
}

/**
 * The decoders every [Video] borrows while it plays: at most [MAX] ExoPlayers for the app (a
 * feed plays one or two at a time). A view lends its player back when it stops playing or
 * leaves; the oldest lender gives way when all are out.
 */
internal object VideoPool {
  private const val MAX = 3
  private val free = ArrayDeque<ExoPlayer>()
  private val lent = LinkedHashMap<Any, ExoPlayer>()

  fun acquire(context: Context, owner: Any, evict: (Any) -> Unit): ExoPlayer {
    lent[owner]?.let { return it }
    val player = free.removeFirstOrNull() ?: if (lent.size + free.size < MAX) {
      ExoPlayer.Builder(context.applicationContext).build()
    } else {
      // All lent: the longest-held one is taken back.
      val (oldest, taken) = lent.entries.first()
      lent.remove(oldest)
      evict(oldest)
      taken.stop()
      taken.clearMediaItems()
      taken
    }
    lent[owner] = player
    return player
  }

  fun release(owner: Any) {
    val player = lent.remove(owner) ?: return
    player.stop()
    player.clearMediaItems()
    player.clearVideoSurface()
    player.clearMediaItems()
    free.addLast(player)
  }
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
 * page), with its `.poster(url)` until the first frame is on screen. It borrows decoders from
 * the app's pool only while its player is asked to play.
 */
@Composable
fun Video(player: VideoPlayer, poster: String? = null, contentFit: ContentFit = ContentFit.cover, modifier: Modifier = Modifier) {
  val context = LocalContext.current
  val slot = remember(player) { VideoSlot() }
  slot.fit = contentFit
  val playing = player.isPlaying
  val muted = player.isMuted
  val loops = player.loops
  DisposableEffect(player, playing) {
    if (playing) {
      val exo = VideoPool.acquire(context, slot) { player.pause() }
      slot.player = exo
      exo.addListener(slot.listener)
      slot.texture?.let { exo.setVideoTextureView(it) }
      exo.setMediaItem(mediaItem(player.url))
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
      BloomImage(poster, contentFit, Modifier.fillMaxSize(), benchMark = false)
    }
  }
}

/**
 * `Video(url:, poster:)` with `.muted()`, `.loops()` and `.autoplay()`: a player of its own;
 * autoplaying, it plays while at least half of it is on screen (in its window) and pauses as it
 * leaves, as a feed's video does.
 */
@Composable
fun Video(
  url: String,
  poster: String? = null,
  muted: Boolean = false,
  loops: Boolean = false,
  autoplay: Boolean = false,
  contentFit: ContentFit = ContentFit.cover,
  modifier: Modifier = Modifier,
) {
  val player = remember(url) { VideoPlayer(url) }
  player.isMuted = muted
  player.loops = loops
  val view = LocalView.current
  val watch = if (!autoplay) {
    Modifier
  } else {
    Modifier.onGloballyPositioned { coordinates ->
      val bounds = coordinates.boundsInWindow()
      val area = coordinates.size.width.toFloat() * coordinates.size.height
      val shown = bounds.width * bounds.height
      val window = android.graphics.Rect().also { view.getWindowVisibleDisplayFrame(it) }
      val onScreen = area > 0f && shown / area >= 0.5f && bounds.bottom > window.top && bounds.top < window.bottom
      if (onScreen && !player.isPlaying) player.play() else if (!onScreen && player.isPlaying) player.pause()
    }
  }
  DisposableEffect(player) { onDispose { player.pause() } }
  Video(player, poster, contentFit, modifier.then(watch))
}
