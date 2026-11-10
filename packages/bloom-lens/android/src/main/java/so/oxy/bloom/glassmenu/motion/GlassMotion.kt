package so.oxy.bloom.glassmenu.motion

import android.graphics.RectF
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

internal class GlassMotion {
  val frame = GlassMorphFrame()
  var initialized = false
    private set
  var expanded = false
    private set

  private val source = RectF()
  private val through = RectF()
  private val destination = RectF()
  private var destinationRadius = 0f
  private var zoomReferenceHeight = 0f
  private var density = 1f
  private var followsPress = false
  private var tuning = GlassMorphTuning(null, null)
  private var elapsed = 0f
  private var correctionApplied = false
  private var smoothingReleased = false
  private var lensReleased = false
  private var closingKickReleased = false
  private var sourceKickReleased = false
  private var portalBlurReleased = false

  private val x = GlassSpring()
  private val y = GlassSpring()
  private val width = GlassSpring()
  private val height = GlassSpring()
  private val radiusX = GlassSpring()
  private val radiusY = GlassSpring()
  private val sourceX = GlassSpring()
  private val sourceY = GlassSpring()
  private val sourceWidth = GlassSpring()
  private val sourceHeight = GlassSpring()
  private val sourceScale = GlassSpring(0.0005f, 0.01f)
  private val incomingScale = GlassSpring(0.0005f, 0.01f)
  private val kick = GlassSpring()
  private val sourceKick = GlassSpring()
  private val content = GlassSpring(0.001f, 0.01f)
  private val rowsReveal = GlassSpring(0.001f, 0.01f)
  private val sourceContent = GlassSpring(0.001f, 0.01f)
  private val lens = GlassSpring(0.001f, 0.01f)
  private val portalBlur = GlassSpring(0.001f, 0.01f)
  private val smoothing = GlassSpring(0.05f, 1f)
  private val channels = listOf(
    x, y, width, height, radiusX, radiusY,
    sourceX, sourceY, sourceWidth, sourceHeight, sourceScale, incomingScale,
    kick, sourceKick, content, rowsReveal, sourceContent, lens, portalBlur, smoothing,
  )

  fun initialize(
    sourceRect: RectF,
    target: RectF,
    targetRadius: Float,
    pixelDensity: Float,
    throughRect: RectF,
    fromPress: Boolean,
    morphTuning: GlassMorphTuning,
  ) {
    followsPress = fromPress
    tuning = morphTuning
    source.set(sourceRect)
    through.set(throughRect)
    destination.set(target)
    destinationRadius = min(targetRadius, min(target.width(), target.height()) / 2f)
    zoomReferenceHeight = target.height()
    density = pixelDensity
    val diameter = initialIncomingDiameter()
    x.reset(pressedCenterX())
    y.reset(pressedCenterY())
    width.reset(target.width())
    height.reset(target.width())
    radiusX.reset(target.width() / 2f)
    radiusY.reset(target.width() / 2f)
    incomingScale.reset(diameter / target.width())
    sourceX.reset(source.centerX())
    sourceY.reset(source.centerY())
    sourceWidth.reset(source.width())
    sourceHeight.reset(source.height())
    sourceScale.reset(1f)
    kick.reset(0f)
    sourceKick.reset(0f)
    content.reset(0f)
    rowsReveal.reset(0f)
    sourceContent.reset(1f)
    lens.reset(1f)
    portalBlur.reset(0f)
    smoothing.reset(0f)
    expanded = false
    elapsed = 0f
    correctionApplied = false
    smoothingReleased = false
    lensReleased = false
    closingKickReleased = false
    sourceKickReleased = false
    portalBlurReleased = false
    initialized = true
    publish()
  }

  fun updateSource(sourceRect: RectF, throughRect: RectF) {
    if (!initialized) return
    source.set(sourceRect)
    through.set(throughRect)
    if (!expanded) configureCollapse()
  }

  fun updateTarget(target: RectF, targetRadius: Float) {
    if (!initialized) return
    destination.set(target)
    destinationRadius = min(targetRadius, min(target.width(), target.height()) / 2f)
    if (expanded) configureExpansionGeometry() else configureCollapse()
    publish()
  }

  // Scrubbed morph (predictive back). beginScrub saves the state after retarget(false): the close timeline, not yet
  // advanced. scrubTo(progress) restores that state and advances the same timeline to the time at which the shape has
  // collapsed by `progress` of its total collapse, so the frame at a progress is the frame the close shows then. endScrub(commit) keeps the timeline where it
  // is (commit: the normal close runs on from there) or reopens it with the normal open timeline (cancel).
  var scrubbing = false
    private set
  // The close timeline sampled at gesture start: time, and the shape's area at that time. scrubTo maps the finger's
  // progress to the time at which the shape has covered that fraction of its own collapse, so the shape moves in
  // proportion to the finger, from the first frame (no new constants: the samples come from the same timeline).
  private val scrubTimes = ArrayList<Float>()
  private val scrubAreas = ArrayList<Float>()
  private val savedChannels = List(20) { GlassSpring() }
  private var savedFlags = BooleanArray(6)
  private var savedElapsed = 0f
  private var savedExpanded = false

  fun beginScrub() {
    if (!initialized || expanded) return
    saveState()
    sampleCollapse()
    restoreState()
    scrubbing = true
    publish()
  }

  fun scrubTo(progress: Float) {
    if (!scrubbing) return
    restoreState()
    advanceBy(scrubTimeFor(progress.coerceIn(0f, 1f)))
  }

  // The time whose shape has collapsed by `fraction` of the total collapse (linear between samples).
  private fun scrubTimeFor(fraction: Float): Float {
    val count = scrubTimes.size
    if (count < 2) return 0f
    val start = scrubAreas[0]
    val end = scrubAreas[count - 1]
    val total = start - end
    if (total <= 0f) return fraction * scrubTimes[count - 1]
    val target = start - fraction * total
    for (i in 1 until count) {
      if (scrubAreas[i] <= target) {
        val a = scrubAreas[i - 1]
        val b = scrubAreas[i]
        val t = if (a == b) 0f else (a - target) / (a - b)
        return scrubTimes[i - 1] + t * (scrubTimes[i] - scrubTimes[i - 1])
      }
    }
    return scrubTimes[count - 1]
  }

  fun endScrub(commit: Boolean) {
    if (!scrubbing) return
    scrubbing = false
    if (!commit) retarget(true)
  }

  private fun saveState() {
    channels.forEachIndexed { i, spring -> savedChannels[i].copyFrom(spring) }
    savedFlags = booleanArrayOf(correctionApplied, smoothingReleased, lensReleased, closingKickReleased, sourceKickReleased, portalBlurReleased)
    savedElapsed = elapsed
    savedExpanded = expanded
  }

  private fun restoreState() {
    channels.forEachIndexed { i, spring -> spring.copyFrom(savedChannels[i]) }
    correctionApplied = savedFlags[0]
    smoothingReleased = savedFlags[1]
    lensReleased = savedFlags[2]
    closingKickReleased = savedFlags[3]
    sourceKickReleased = savedFlags[4]
    portalBlurReleased = savedFlags[5]
    elapsed = savedElapsed
    expanded = savedExpanded
  }

  // Samples the close timeline (until it is visually collapsed) on the saved state: the time and the shape's area.
  // Fixed step, so the same close always gives the same samples.
  private fun sampleCollapse() {
    scrubTimes.clear()
    scrubAreas.clear()
    scrubTimes.add(0f)
    scrubAreas.add(frame.bounds.width() * frame.bounds.height())
    var time = 0f
    while (time < MaxScrubSeconds) {
      val done = advanceBy(ScrubStepSeconds)
      time += ScrubStepSeconds
      scrubTimes.add(time)
      scrubAreas.add(frame.bounds.width() * frame.bounds.height())
      if (done) break
    }
    restoreState()
  }

  fun retarget(nextExpanded: Boolean) {
    if (!initialized) return
    expanded = nextExpanded
    zoomReferenceHeight = destination.height()
    elapsed = 0f
    correctionApplied = false
    smoothingReleased = false
    lensReleased = false
    closingKickReleased = false
    sourceKickReleased = nextExpanded
    portalBlurReleased = false
    portalBlur.target(1f, BlurInSpring)
    lens.target(1f, LensOnSpring)
    if (nextExpanded) {
      configureExpansionGeometry()
      incomingScale.target(1f, EjectSpring)
      sourceKick.target(0f, KickSpring)
      sourceContent.target(0f, tuning.eject)
      content.target(1f, EjectSpring)
      rowsReveal.target(1f, RowsRevealSpring)
      smoothing.target(20f * density, CollapseSpring)
    } else {
      configureCollapse()
    }
    publish()
  }

  private fun configureExpansionGeometry() {
    val side = min(source.width(), source.height())
    val inset = side / 8f
    sourceX.target(alignedCenter(boundedCenter(through.centerX() * .75f + destination.centerX() * .25f, destination.left, destination.right, inset), side), tuning.eject)
    sourceY.target(alignedCenter(boundedCenter(through.centerY() * .75f + destination.centerY() * .25f, destination.top, destination.bottom, inset), side), tuning.eject)
    sourceWidth.target(side, tuning.collapse)
    sourceHeight.target(side, tuning.collapse)
    sourceScale.target(tuning.shrinkScale, tuning.eject)
    x.target(destination.centerX(), EjectSpring)
    y.target(destination.centerY(), EjectSpring)
    width.target(destination.width(), EjectSpring)
    height.target(destination.height(), EjectSpring)
    radiusX.target(if (correctionApplied) destinationRadius else destination.width(), EjectSpring)
    radiusY.target(if (correctionApplied) destinationRadius else destination.width(), EjectSpring)
    kick.target(if (correctionApplied) 0f else kickAmount(-80f), KickSpring)
  }

  fun advanceBy(seconds: Float): Boolean {
    if (!initialized) return true
    var remaining = if (seconds.isFinite()) max(seconds, 0f) else 0f
    while (remaining > 0f) {
      applyTimelineActions()
      var next = Float.POSITIVE_INFINITY
      if (expanded && !correctionApplied) next = min(next, CorrectionDelay)
      if (!lensReleased || !portalBlurReleased) next = min(next, opticalReleaseDelay())
      if (!smoothingReleased) next = min(next, if (expanded) SmoothingReleaseDelay * tuning.neckHold else AbsorbSmoothingReleaseDelay)
      if (!expanded && !closingKickReleased) next = min(next, AbsorbEjecteeUnkickDelay)
      if (!expanded && !sourceKickReleased) next = min(next, AbsorbSourceUnkickDelay)
      val step = min(remaining, max(next - elapsed, 0f))
      if (step <= 0f) {
        applyTimelineActions()
        continue
      }
      channels.forEach { it.advance(step) }
      elapsed += step
      remaining -= step
    }
    applyTimelineActions()
    publish()
    if (!expanded && visuallyCollapsed()) {
      channels.forEach { it.finish() }
      publish()
      return true
    }
    return (!expanded || smoothingReleased) && channels.all { it.isSettled }
  }

  private fun applyTimelineActions() {
    val now = elapsed + 0.000001f
    if (!portalBlurReleased && now >= opticalReleaseDelay()) {
      portalBlurReleased = true
      portalBlur.target(0f, BlurOutSpring)
    }
    if (!lensReleased && now >= opticalReleaseDelay()) {
      lensReleased = true
      lens.target(0f, if (expanded) EjectLensOffSpring else AbsorbLensOffSpring)
    }
    if (!expanded) {
      if (!closingKickReleased && now >= AbsorbEjecteeUnkickDelay) {
        closingKickReleased = true
        kick.target(0f, KickSpring)
      }
      if (!sourceKickReleased && now >= AbsorbSourceUnkickDelay) {
        sourceKickReleased = true
        sourceKick.target(0f, KickSpring)
      }
      if (!smoothingReleased && now >= AbsorbSmoothingReleaseDelay) {
        smoothingReleased = true
        smoothing.target(0f, SmoothingReleaseSpring)
      }
      return
    }
    if (!correctionApplied && now >= CorrectionDelay) {
      correctionApplied = true
      radiusX.target(destinationRadius, CorrectionSpring)
      radiusY.target(destinationRadius, CorrectionSpring)
      kick.target(0f, KickSpring)
    }
    if (!smoothingReleased && now >= SmoothingReleaseDelay * tuning.neckHold) {
      smoothingReleased = true
      smoothing.target(0f, SmoothingReleaseSpring)
    }
  }

  private fun configureCollapse() {
    val diameter = initialIncomingDiameter()
    x.target(if (followsPress) pressedCenterX() else source.centerX(), tuning.absorb)
    y.target(if (followsPress) pressedCenterY() else source.centerY(), tuning.absorb)
    width.target(destination.width() * ClosePinch, tuning.absorb)
    height.target(destination.width(), tuning.absorb)
    incomingScale.target(diameter / destination.width(), tuning.absorb)
    radiusX.target(destination.width() / 2f, tuning.absorb)
    radiusY.target(destination.width() / 2f, tuning.absorb)
    sourceX.target(source.centerX(), tuning.absorb)
    sourceY.target(source.centerY(), tuning.absorb)
    sourceWidth.target(source.width(), tuning.absorb)
    sourceHeight.target(source.height(), tuning.absorb)
    sourceScale.target(1f, tuning.absorb)
    kick.target(if (closingKickReleased) 0f else kickAmount(-80f), KickSpring)
    sourceKick.target(if (sourceKickReleased) 0f else kickAmount(40f), KickSpring)
    content.target(0f, AbsorbContentSpring)
    rowsReveal.target(0f, AbsorbContentSpring)
    sourceContent.target(1f, tuning.absorb)
    smoothing.target(
      if (smoothingReleased) 0f else 20f * density,
      if (smoothingReleased) SmoothingReleaseSpring else AbsorbSmoothingSpring,
    )
  }

  private fun visuallyCollapsed(): Boolean {
    val shell = frame.sourceLobe
    val epsilon = density * 0.5f
    if (abs(shell.left - source.left) > epsilon || abs(shell.top - source.top) > epsilon ||
      abs(shell.right - source.right) > epsilon || abs(shell.bottom - source.bottom) > epsilon
    ) return false
    val incoming = frame.bounds
    return incoming.left >= source.left - epsilon && incoming.top >= source.top - epsilon &&
      incoming.right <= source.right + epsilon && incoming.bottom <= source.bottom + epsilon &&
      frame.contentProgress < 0.02f && frame.sourceOpacity > 0.98f &&
      abs(kick.value) < epsilon && abs(sourceKick.value) < epsilon &&
      frame.smoothing < epsilon && lens.value < 0.02f
  }

  private fun pressedCenterX(): Float =
    alignedCenter(boundedCenter(through.centerX(), source.left, source.right, through.width() / 2f), destination.width())

  private fun pressedCenterY(): Float =
    alignedCenter(boundedCenter(through.centerY(), source.top, source.bottom, through.height() / 2f), destination.width())

  private fun initialIncomingDiameter(): Float =
    max(destination.width() * 0.5f * through.height() / max(destination.width(), destination.height()), 1f)

  private fun boundedCenter(value: Float, start: Float, end: Float, inset: Float): Float {
    val minimum = start + inset
    val maximum = end - inset
    return if (minimum <= maximum) value.coerceIn(minimum, maximum) else start + (end - start) / 2f
  }

  private fun alignedCenter(center: Float, side: Float): Float {
    val points = (center - side / 2f) / density
    val aligned = (if (points < 0f) ceil(points - 0.5f) else floor(points + 0.5f)) * density
    return aligned + side / 2f
  }

  private fun kickAmount(points: Float): Float {
    val heightPoints = destination.height() / density
    val heightFactor = ((heightPoints - 60f) / 140f).coerceIn(0.5f, 1f)
    val anchorY = ((through.centerY() - destination.top) / destination.height()).coerceIn(0f, 1f)
    return points * density * heightFactor * (2f * anchorY - 1f)
  }

  private fun publish() {
    val scaleIn = max(incomingScale.value, 0.001f)
    val w = max(width.value * scaleIn, 1f)
    val h = max(height.value * scaleIn, 1f)
    val restingScale = initialIncomingDiameter() / max(destination.width(), 1f)
    val growth = if (followsPress) {
      ((scaleIn - restingScale) / max(1f - restingScale, 0.001f)).coerceIn(0f, MaxGrowth)
    } else 1f
    val originX = pressedCenterX()
    val originY = pressedCenterY()
    val cx = originX + (x.value - originX) * growth
    val cy = originY + (y.value + kick.value * scaleIn - originY) * growth
    frame.bounds.set(cx - w / 2f, cy - h / 2f, cx + w / 2f, cy + h / 2f)
    val scale = max(sourceScale.value, 0.01f)
    val sw = max(sourceWidth.value * scale, 1f)
    val sh = max(sourceHeight.value * scale, 1f)
    val scy = sourceY.value + sourceKick.value * scale
    frame.sourceLobe.set(sourceX.value - sw / 2f, scy - sh / 2f, sourceX.value + sw / 2f, scy + sh / 2f)
    val contentValue = content.value.coerceIn(0f, 1f)
    val sourceValue = sourceContent.value.coerceIn(0f, 1f)
    val lensValue = lens.value.coerceIn(0f, 1f)
    val lensDimension = min(w, h)
    val lensHeight = 75f * density * lensValue * min(lensDimension / (250f * density), 1f)
    val zoom = 1f + (portalZoomScale() - 1f) * portalBlur.value
    frame.radiusX = max(radiusX.value * scaleIn, 0f)
    frame.radiusY = max(radiusY.value * scaleIn, 0f)
    frame.contentProgress = contentValue
    frame.sourceRadius = min(sw, sh) / 2f
    frame.smoothing = max(smoothing.value, 0f)
    frame.sourceOpacity = sourceValue
    frame.sourceBlur = 4f * density * (1f - sourceValue)
    frame.sourceZoom = zoom
    val reveal = rowsReveal.value.coerceIn(0f, 1f)
    frame.rowsOpacity = reveal
    frame.contentBlur = RowsBlur * density * (1f - reveal)
    frame.contentZoom = zoom
    frame.portalBlur = PortalBlur * density * max(portalBlur.value, 0f)
    frame.lensHeight = lensHeight
    frame.lensAmount = min(-lensHeight, -0.001f * density)
  }

  private fun opticalReleaseDelay(): Float = if (expanded) EjectOpticalReleaseDelay else AbsorbOpticalReleaseDelay

  private fun portalZoomScale(): Float {
    val heightFactor = ((zoomReferenceHeight / density - 215f) / 305f).coerceIn(0f, 1f)
    return 1.65f + (1.2f - 1.65f) * heightFactor
  }

  // internal: the submenu navigation (GlassMenuSession) reuses RowsRevealSpring.
  internal companion object {
    // Measurement only (the length of the close timeline for a scrub): not tuning values.
    const val ScrubStepSeconds = 1f / 240f
    const val MaxScrubSeconds = 3f
    const val GeometrySpeed = 0.7f
    const val MaxGrowth = 1.2f
    const val ClosePinch = .84f
    const val RowsBlur = 18f
    const val PortalBlur = 6f
    const val CorrectionDelay = 0.1f * GeometrySpeed
    const val SmoothingReleaseDelay = 0.3f * GeometrySpeed
    const val EjectOpticalReleaseDelay = 0.12f * GeometrySpeed
    const val AbsorbOpticalReleaseDelay = 0.1f * GeometrySpeed
    const val AbsorbEjecteeUnkickDelay = 0.1f * GeometrySpeed
    const val AbsorbSourceUnkickDelay = 0.15f * GeometrySpeed
    const val AbsorbSmoothingReleaseDelay = 0.1f * GeometrySpeed
    val CollapseSpring = GlassSpringSpec(1f, 0.3f * GeometrySpeed)
    val EjectSpring = GlassSpringSpec(0.75f, 0.32f)
    val CorrectionSpring = EjectSpring
    val KickSpring = GlassSpringSpec(1f, 0.2f * GeometrySpeed)
    val BlurInSpring = GlassSpringSpec(1f, 0.3f * GeometrySpeed)
    val BlurOutSpring = GlassSpringSpec(0.8f, 0.45f * GeometrySpeed)
    val LensOnSpring = GlassSpringSpec(1f, 0.2f * GeometrySpeed)
    val EjectLensOffSpring = GlassSpringSpec(1f, 0.6f * GeometrySpeed)
    val AbsorbLensOffSpring = GlassSpringSpec(1f, 0.4f * GeometrySpeed)
    val AbsorbContentSpring = GlassSpringSpec(1f, 0.15f)
    val RowsRevealSpring = GlassSpringSpec(1f, 0.3f)
    val AbsorbSmoothingSpring = GlassSpringSpec(1f, 0.1f * GeometrySpeed)
    val SmoothingReleaseSpring = GlassSpringSpec(1f, 0.6f * GeometrySpeed)
  }
}
