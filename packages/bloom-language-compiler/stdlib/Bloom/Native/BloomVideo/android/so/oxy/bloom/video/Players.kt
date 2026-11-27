// Bloom's native video player (ADR 0002, section 7): the Android side of
// `extern native "BloomVideo"` (stdlib/Bloom/Video.bloom).
package so.oxy.bloom.video

import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.VideoSize
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.common.util.Util
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.ProgressiveMediaSource

/** What a player tells JS: the module's events (it emits them). */
internal interface PlayerEvents {
  fun status(id: Int, status: String, error: String?)
  fun playing(id: Int, playing: Boolean)
  fun time(id: Int, seconds: Double, buffered: Double)
  fun end(id: Int)
  fun source(id: Int, duration: Double, width: Int, height: Int)
}

/**
 * One player: an [ExoPlayer] on the main looper, and the state JS set on it. Every method
 * runs on the main thread.
 */
@OptIn(UnstableApi::class)
internal class BloomPlayer(context: Context, val id: Int, private val events: PlayerEvents) : Player.Listener {
  private val http = DefaultHttpDataSource.Factory().setAllowCrossProtocolRedirects(true)
  private val data = DefaultDataSource.Factory(context, http)
  /** A progressive source (an `.mp4`) asks every [Startup.CHECK_BYTES] whether to go on loading. */
  private val progressive =
    ProgressiveMediaSource.Factory(data).setContinueLoadingCheckIntervalBytes(Startup.CHECK_BYTES)
  val exo: ExoPlayer =
    ExoPlayer.Builder(context)
      .setMediaSourceFactory(DefaultMediaSourceFactory(data))
      .setLoadControl(StartupLoadControl(id))
      .build()
      .also { it.addListener(this) }
  private val handler = Handler(Looper.getMainLooper())
  private var interval = 0L
  private var volume = 1f
  private var muted = false
  private var sourceSent = false
  /** The view showing this player's picture, told of its first frame and size. */
  var view: BloomVideoView? = null

  private val tick =
    object : Runnable {
      override fun run() {
        if (interval <= 0) return
        events.time(id, exo.currentPosition / 1000.0, exo.bufferedPosition / 1000.0)
        handler.postDelayed(this, interval)
      }
    }

  fun replace(source: String?, headers: List<String>) {
    val map = HashMap<String, String>()
    var i = 0
    while (i + 1 < headers.size) {
      map[headers[i]] = headers[i + 1]
      i += 2
    }
    http.setDefaultRequestProperties(map)
    sourceSent = false
    if (source.isNullOrEmpty()) {
      Startup.end(id)
      exo.clearMediaItems()
      events.status(id, "idle", null)
      return
    }
    val uri = Uri.parse(source)
    val item = MediaItem.fromUri(uri)
    Startup.begin(id)
    if (Util.inferContentType(uri) == C.CONTENT_TYPE_OTHER) exo.setMediaSource(progressive.createMediaSource(item))
    else exo.setMediaItem(item)
    exo.prepare()
    events.status(id, "loading", null)
  }

  fun setMuted(value: Boolean) {
    muted = value
    exo.volume = if (value) 0f else volume
  }

  fun setVolume(value: Float) {
    volume = value
    if (!muted) exo.volume = value
  }

  fun setLoop(value: Boolean) {
    exo.repeatMode = if (value) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
  }

  fun setTimeInterval(seconds: Double) {
    handler.removeCallbacks(tick)
    interval = (seconds * 1000).toLong()
    if (interval > 0 && exo.isPlaying) handler.post(tick)
  }

  fun release() {
    Startup.end(id)
    handler.removeCallbacks(tick)
    view?.detach(this)
    view = null
    exo.removeListener(this)
    exo.release()
  }

  override fun onPlaybackStateChanged(state: Int) {
    when (state) {
      Player.STATE_IDLE -> events.status(id, "idle", null)
      Player.STATE_BUFFERING -> events.status(id, "loading", null)
      Player.STATE_READY -> {
        Startup.end(id)
        events.status(id, "readyToPlay", null)
        sendSource()
      }
      Player.STATE_ENDED -> events.end(id)
    }
  }

  override fun onPlayerError(error: PlaybackException) {
    Startup.end(id)
    events.status(id, "error", error.message ?: error.errorCodeName)
  }

  override fun onIsPlayingChanged(isPlaying: Boolean) {
    events.playing(id, isPlaying)
    handler.removeCallbacks(tick)
    if (isPlaying && interval > 0) handler.post(tick)
  }

  override fun onVideoSizeChanged(videoSize: VideoSize) {
    view?.videoSizeChanged(videoSize)
    if (videoSize.width > 0 && exo.playbackState == Player.STATE_READY) sendSource(force = true)
  }

  override fun onRenderedFirstFrame() {
    view?.firstFrame()
  }

  private fun sendSource(force: Boolean = false) {
    if (sourceSent && !force) return
    val duration = exo.duration.takeIf { it != C.TIME_UNSET }?.div(1000.0) ?: 0.0
    val size = exo.videoSize
    sourceSent = true
    events.source(id, duration, size.width, size.height)
  }
}

/** The players by id, shared by the module (which makes them) and the views (which show them). */
internal object Players {
  private val players = HashMap<Int, BloomPlayer>()
  private val waiting = HashMap<Int, MutableList<BloomVideoView>>()

  operator fun get(id: Int): BloomPlayer? = players[id]

  fun add(player: BloomPlayer) {
    players[player.id] = player
    waiting.remove(player.id)?.forEach { it.attach() }
  }

  fun remove(id: Int): BloomPlayer? = players.remove(id)

  /** A view of a player not made yet (the view's props can arrive before `create`). */
  fun await(id: Int, view: BloomVideoView) {
    waiting.getOrPut(id) { mutableListOf() }.let { if (view !in it) it.add(view) }
  }

  fun forget(view: BloomVideoView) {
    waiting.values.forEach { it.remove(view) }
  }

  fun releaseAll() {
    players.values.toList().forEach { it.release() }
    players.clear()
    waiting.clear()
  }
}
