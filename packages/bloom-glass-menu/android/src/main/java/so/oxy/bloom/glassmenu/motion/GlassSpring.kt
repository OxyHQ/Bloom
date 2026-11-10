package so.oxy.bloom.glassmenu.motion

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.sin
import kotlin.math.sqrt

internal class GlassSpringSpec(val dampingRatio: Float, val response: Float) {
  val omega = (2.0 * PI / response).toFloat()
  val alpha = dampingRatio * omega
  val frequency = if (dampingRatio >= 0.9999f) 0f else omega * sqrt(1f - dampingRatio * dampingRatio)
}
internal class GlassSpring(
  private val valueTolerance: Float = 0.2f,
  private val velocityTolerance: Float = 3f,
) {
  var value = 0f
    private set
  private var velocity = 0f
  private var destination = 0f
  private var spec = GlassSpringSpec(1f, 0.3f)
  val isSettled: Boolean
    get() = abs(value - destination) < valueTolerance && abs(velocity) < velocityTolerance

  fun reset(next: Float) {
    value = next
    destination = next
    velocity = 0f
  }

  fun target(next: Float, nextSpec: GlassSpringSpec) {
    destination = next
    spec = nextSpec
  }

  // Copies the whole state (value, velocity, target, spec) of another spring: used by the scrubbed morph.
  internal fun copyFrom(other: GlassSpring) {
    value = other.value
    velocity = other.velocity
    destination = other.destination
    spec = other.spec
  }

  fun finish() {
    value = destination
    velocity = 0f
  }

  fun advance(seconds: Float) {
    val omega = spec.omega
    val displacement = value - destination
    val alpha = spec.alpha
    val decay = exp(-alpha * seconds)
    if (spec.dampingRatio >= 0.9999f) {
      val coefficient = velocity + omega * displacement
      val nextDisplacement = decay * (displacement + coefficient * seconds)
      velocity = decay * (velocity - omega * coefficient * seconds)
      value = destination + nextDisplacement
    } else {
      val frequency = spec.frequency
      val cosine = cos(frequency * seconds)
      val sine = sin(frequency * seconds)
      val coefficient = (velocity + alpha * displacement) / frequency
      val nextDisplacement = decay * (displacement * cosine + coefficient * sine)
      velocity = decay * (
        -alpha * (displacement * cosine + coefficient * sine) +
          frequency * (-displacement * sine + coefficient * cosine)
        )
      value = destination + nextDisplacement
    }
    if (isSettled) {
      value = destination
      velocity = 0f
    }
  }
}
