// Bloom's native video player (ADR 0002, section 7): the Android side of
// `extern native "BloomVideo"` (stdlib/Bloom/Video.bloom).
package so.oxy.bloom.video

import android.os.SystemClock
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.LoadControl

/**
 * The players' first buffering, in the order they were made (a feed's top first).
 *
 * - **Turns.** Until a player first has enough to play, at most [HEADS] starting players
 *   load at once; the ones made after them wait.
 * - **Playing players** load only what keeps them playing ([LOW_US] ahead) while any
 *   player is starting.
 * - **No stall.** A player that has not started within [DEADLINE_MS] of its turn no longer
 *   holds the others back.
 *
 * Every player still reads its first bytes at once (its header, and media3's next check of
 * [CHECK_BYTES]), so all eight know their formats and make their decoders together. Measured
 * on the video bench (ADR 0002, section 7): 3 at once brought the first video's first frame
 * and the 8th's ~65 ms earlier, where 1 or 2 at once delayed the 8th by 170-670 ms.
 */
internal object Startup {
  const val HEADS = 3
  const val LOW_US = 2_000_000L
  const val DEADLINE_MS = 1_500L
  /** How often a progressive load asks whether to go on (media3's default is 1 MiB). */
  const val CHECK_BYTES = 64 * 1024

  /** Starting players, in the order they were made: id to when its turn came (0: not yet). */
  private val starting = LinkedHashMap<Int, Long>()

  @Synchronized fun begin(id: Int) {
    starting.remove(id)
    starting[id] = 0L
  }

  @Synchronized fun end(id: Int) {
    starting.remove(id)
  }

  /** Whether player `id`, with `bufferedUs` ahead of its position, may load now. */
  @Synchronized fun mayLoad(id: Int, bufferedUs: Long): Boolean {
    if (starting.isEmpty()) return true
    val now = SystemClock.elapsedRealtime()
    var turns = 0
    var anyTurn = false
    for (entry in starting.entries) {
      if (entry.value == 0L) entry.setValue(now)
      if (now - entry.value > DEADLINE_MS) {
        if (entry.key == id) return bufferedUs < LOW_US
        continue
      }
      anyTurn = true
      if (entry.key == id) return true
      if (++turns >= HEADS) break
    }
    if (id in starting) return false
    return !anyTurn || bufferedUs < LOW_US
  }
}

/** media3's default load control, which also asks [Startup] whether player [id] may load. */
@OptIn(UnstableApi::class)
internal class StartupLoadControl(private val id: Int) : DefaultLoadControl() {
  override fun shouldContinueLoading(parameters: LoadControl.Parameters): Boolean =
    super.shouldContinueLoading(parameters) && Startup.mayLoad(id, parameters.bufferedDurationUs)
}
