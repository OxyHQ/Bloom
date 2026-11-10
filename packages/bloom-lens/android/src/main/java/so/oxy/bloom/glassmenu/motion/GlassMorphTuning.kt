package so.oxy.bloom.glassmenu.motion

import so.oxy.bloom.glassmenu.records.GlassAbsorbRecord
import so.oxy.bloom.glassmenu.records.GlassShrinkRecord
import kotlin.math.max

// absorbScale shortens the close (absorb) spring only: the submenu layer uses it so its collapse ends sooner.
internal class GlassMorphTuning(shrink: GlassShrinkRecord?, absorb: GlassAbsorbRecord?, absorbScale: Float = 1f) {
  private val shrinkDuration = max(shrink?.duration ?: DefaultShrinkDuration, MinimumDuration)
  private val shrinkDamping = shrink?.damping?.coerceIn(MinimumDamping, 1f)

  val shrinkScale = (shrink?.scale ?: DefaultShrinkScale).coerceIn(.05f, 1f)
  val collapse = GlassSpringSpec(shrinkDamping ?: 1f, shrinkDuration)
  val eject = GlassSpringSpec(shrinkDamping ?: DefaultEjectDamping, shrinkDuration * EjectRatio)
  val absorb = GlassSpringSpec(
    absorb?.damping?.coerceIn(MinimumDamping, 1f) ?: DefaultAbsorbDamping,
    max((absorb?.duration ?: DefaultAbsorbDuration) * absorbScale, MinimumDuration),
  )
  val neckHold = max(shrinkDuration / DefaultShrinkDuration, 1f)

  private companion object {
    const val DefaultShrinkDuration = .21f
    const val DefaultShrinkScale = .25f
    const val DefaultEjectDamping = .75f
    const val DefaultAbsorbDuration = .35f
    const val DefaultAbsorbDamping = .8f
    const val EjectRatio = .32f / .21f
    const val MinimumDuration = .02f
    const val MinimumDamping = .1f
  }
}
