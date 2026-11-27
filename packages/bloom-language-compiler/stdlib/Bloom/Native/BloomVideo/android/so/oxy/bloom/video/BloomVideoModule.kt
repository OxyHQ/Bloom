// Bloom's native video player (ADR 0002, section 7): the Android side of
// `extern native "BloomVideo"` (stdlib/Bloom/Video.bloom).
package so.oxy.bloom.video

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UiThreadUtil

/**
 * The players: made, driven and released by number, each on the main looper, with their
 * events sent to JS (codegen's event emitters, `emitOnStatus` and the rest).
 *
 * [NativeBloomVideoSpec] is React Native's codegen output for the spec `bloom build`
 * generates from the Bloom interface, so the Kotlin compiler checks this class against it.
 */
class BloomVideoModule(context: ReactApplicationContext) : NativeBloomVideoSpec(context), PlayerEvents {
  private fun on(id: Double, work: (BloomPlayer) -> Unit) {
    UiThreadUtil.runOnUiThread { Players[id.toInt()]?.let(work) }
  }

  private fun list(array: ReadableArray?): List<String> =
    if (array == null) emptyList() else (0 until array.size()).map { array.getString(it) ?: "" }

  override fun create(id: Double, source: String?, headers: ReadableArray) {
    val list = list(headers)
    UiThreadUtil.runOnUiThread {
      Players.remove(id.toInt())?.release()
      val player = BloomPlayer(reactApplicationContext, id.toInt(), this)
      Players.add(player)
      player.replace(source, list)
    }
  }

  override fun replace(id: Double, source: String?, headers: ReadableArray) {
    val list = list(headers)
    on(id) { it.replace(source, list) }
  }

  override fun play(id: Double) = on(id) { it.exo.play() }

  override fun pause(id: Double) = on(id) { it.exo.pause() }

  override fun seek(id: Double, seconds: Double) = on(id) { it.exo.seekTo((seconds * 1000).toLong()) }

  override fun setMuted(id: Double, muted: Boolean) = on(id) { it.setMuted(muted) }

  override fun setLoop(id: Double, loop: Boolean) = on(id) { it.setLoop(loop) }

  override fun setVolume(id: Double, volume: Double) = on(id) { it.setVolume(volume.toFloat()) }

  override fun setRate(id: Double, rate: Double) = on(id) { it.exo.setPlaybackSpeed(rate.toFloat()) }

  override fun setTimeInterval(id: Double, seconds: Double) = on(id) { it.setTimeInterval(seconds) }

  override fun release(id: Double) {
    UiThreadUtil.runOnUiThread { Players.remove(id.toInt())?.release() }
  }

  override fun invalidate() {
    UiThreadUtil.runOnUiThread { Players.releaseAll() }
    super.invalidate()
  }

  // ---- events ----

  override fun status(id: Int, status: String, error: String?) =
    emitOnStatus(
      Arguments.createMap().apply {
        putInt("player", id)
        putString("status", status)
        if (error != null) putString("error", error)
      }
    )

  override fun playing(id: Int, playing: Boolean) =
    emitOnPlaying(
      Arguments.createMap().apply {
        putInt("player", id)
        putBoolean("playing", playing)
      }
    )

  override fun time(id: Int, seconds: Double, buffered: Double) =
    emitOnTime(
      Arguments.createMap().apply {
        putInt("player", id)
        putDouble("currentTime", seconds)
        putDouble("buffered", buffered)
      }
    )

  override fun end(id: Int) = emitOnEnd(Arguments.createMap().apply { putInt("player", id) })

  override fun source(id: Int, duration: Double, width: Int, height: Int) =
    emitOnSource(
      Arguments.createMap().apply {
        putInt("player", id)
        putDouble("duration", duration)
        putDouble("width", width.toDouble())
        putDouble("height", height.toDouble())
      }
    )
}
