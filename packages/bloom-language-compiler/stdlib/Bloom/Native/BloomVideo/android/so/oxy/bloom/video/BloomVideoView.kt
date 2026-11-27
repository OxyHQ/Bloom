// Bloom's native video player (ADR 0002, section 7): the Android side of
// `extern native "BloomVideo"` (stdlib/Bloom/Video.bloom).
package so.oxy.bloom.video

import android.graphics.Matrix
import android.view.TextureView
import androidx.media3.common.VideoSize
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import kotlin.math.max
import kotlin.math.min

/**
 * The view behind `VideoView` on Android: a [TextureView] its player draws into, so it
 * scrolls, clips and fades with the views around it (expo-video's `textureView` surface).
 *
 * - **Fit.** The picture is fitted to the box by a transform of the texture: `contain`
 *   letterboxes, `cover` crops, `fill` stretches.
 * - **One view per player.** The player draws into the view that showed it last, as
 *   ExoPlayer has one video output.
 * - **First frame.** `onFirstFrame` runs when the first frame of a source is on screen in
 *   this view.
 */
class BloomVideoView(context: ThemedReactContext) : TextureView(context) {
  var playerId: Int = -1
    set(value) {
      if (field != value) {
        Players[field]?.let { detach(it) }
        Players.forget(this)
        field = value
        attach()
      }
    }
  var contentFit: String = "contain"
    set(value) {
      if (field != value) {
        field = value
        fit()
      }
    }

  private var videoWidth = 0
  private var videoHeight = 0
  private val transform = Matrix()

  /** Shows its player's picture (or waits for the player to be made). */
  fun attach() {
    if (playerId < 0) return
    val player = Players[playerId]
    if (player == null) {
      Players.await(playerId, this)
      return
    }
    player.view?.takeIf { it !== this }?.let { player.view = null }
    player.view = this
    player.exo.setVideoTextureView(this)
    videoSizeChanged(player.exo.videoSize)
  }

  /** Stops showing `player`. */
  fun detach(player: BloomPlayer) {
    if (player.view === this) {
      player.exo.clearVideoTextureView(this)
      player.view = null
    }
  }

  fun drop() {
    Players[playerId]?.let { detach(it) }
    Players.forget(this)
  }

  fun videoSizeChanged(size: VideoSize) {
    // The size the picture is shown at (a pixel aspect ratio other than 1 widens it).
    val w = (size.width * size.pixelWidthHeightRatio).toInt()
    if (w == videoWidth && size.height == videoHeight) return
    videoWidth = w
    videoHeight = size.height
    fit()
  }

  fun firstFrame() {
    dispatch("topFirstFrame", Arguments.createMap().apply { putInt("player", playerId) })
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    fit()
  }

  /** The texture fills the box; this scales it back to the picture's aspect, then fits it. */
  private fun fit() {
    val vw = width.toFloat()
    val vh = height.toFloat()
    if (vw <= 0f || vh <= 0f || videoWidth <= 0 || videoHeight <= 0 || contentFit == "fill") {
      setTransform(null)
      return
    }
    val pw = videoWidth.toFloat()
    val ph = videoHeight.toFloat()
    val scale = if (contentFit == "cover") max(vw / pw, vh / ph) else min(vw / pw, vh / ph)
    transform.reset()
    transform.setScale(pw * scale / vw, ph * scale / vh, vw / 2f, vh / 2f)
    setTransform(transform)
  }

  private fun dispatch(name: String, data: WritableMap) {
    val react = context as? ReactContext ?: return
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(react, id) ?: return
    dispatcher.dispatchEvent(VideoEvent(UIManagerHelper.getSurfaceId(this), id, name, data))
  }

  private class VideoEvent(surfaceId: Int, viewId: Int, private val name: String, private val data: WritableMap) :
    Event<VideoEvent>(surfaceId, viewId) {
    override fun getEventName(): String = name

    override fun getEventData(): WritableMap = data
  }
}
