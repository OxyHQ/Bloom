package so.oxy.bloom

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.util.Base64
import android.view.Choreographer
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.Event
import java.io.ByteArrayOutputStream

/**
 * Draws an agent avatar (`VectorCharacterAvatar` on Android). JS hands it either one frame to show
 * (`frame`) or, at rest, a loop to play by itself (`loopKey`, `loopTracks`, `loopClock`); the
 * prop and event contract is versioned by the name. See `VectorNativeSurface.tsx`.
 */
class AvatarSurfaceManager : SimpleViewManager<AvatarSurface>() {
  override fun getName() = "BloomAvatarSurfaceV1"
  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> = mutableMapOf(
    "topLoop" to mapOf("registrationName" to "onLoop"),
    "topCapture" to mapOf("registrationName" to "onCapture"),
  )
  override fun createViewInstance(context: ThemedReactContext) = AvatarSurface(context)
  @ReactProp(name = "frame") fun frame(view: AvatarSurface, value: ReadableMap?) { view.nextFrame = value }
  @ReactProp(name = "loopKey") fun loopKey(view: AvatarSurface, value: String?) { view.nextKey = value }
  @ReactProp(name = "loopTracks") fun loopTracks(view: AvatarSurface, value: ReadableMap?) { view.nextTracks = value }
  @ReactProp(name = "loopClock") fun loopClock(view: AvatarSurface, value: ReadableMap?) {
    view.nextClock = value?.let { AvatarSurface.Clock(it.getDouble("epoch"), it.getDouble("time")) }
  }
  @ReactProp(name = "capture") fun capture(view: AvatarSurface, value: Double) { view.nextCapture = value }
  override fun onAfterUpdateTransaction(view: AvatarSurface) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }
  override fun onDropViewInstance(view: AvatarSurface) {
    view.stop()
    super.onDropViewInstance(view)
  }
}

class AvatarSurface(context: Context) : View(context) {
  /** `epoch` is a `performance.now()` reading (ms, CLOCK_MONOTONIC on Android) at loop time `time` s. */
  data class Clock(val epoch: Double, val time: Double)

  private class FramePath(val d: Path, val clip: Path?, val fill: Int, val fillAlpha: Int, val stroke: Int?, val strokeAlpha: Int, val strokeWidth: Float)
  private class Frame(val viewBox: FloatArray, val alpha: Int, val paths: List<FramePath>)

  var nextFrame: ReadableMap? = null
  var nextKey: String? = null
  var nextTracks: ReadableMap? = null
  var nextClock: Clock? = null
  var nextCapture = 0.0

  private var frameProp: ReadableMap? = null
  private var frame: Frame? = null
  private var key: String? = null
  private var loop: AvatarLoop? = null
  private var request = 0
  private var clock: Clock? = null
  /** The loop frame on screen. Kept after the clock stops, until JS sends a frame of its own. */
  private var loopIndex = -1
  private var showLoop = false
  private var capture = 0.0
  private var ticking = false
  private var visible = true

  private val density = resources.displayMetrics.density
  private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
  // As react-native-svg draws a stroke: butt caps, miter joins, its miter limit scaled by density.
  private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeCap = Paint.Cap.BUTT
    strokeJoin = Paint.Join.MITER
    strokeMiter = 4f * density
  }
  private val tick = Choreographer.FrameCallback { frameTimeNanos -> onTick(frameTimeNanos) }

  init {
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    isClickable = false
    isFocusable = false
  }

  fun commit() {
    if (nextFrame !== frameProp) {
      frameProp = nextFrame
      frame = nextFrame?.let(::parseFrame)
      // A frame of JS's own replaces the loop frame left on screen when the loop stopped.
      if (nextClock == null) showLoop = false
      invalidate()
    }
    val requestedKey = nextKey?.takeIf(AvatarLoops::validKey)
    if (requestedKey != key) {
      key = requestedKey
      loop = null
      request++
      if (requestedKey != null) resolve(requestedKey, nextTracks)
    } else if (requestedKey != null && loop == null && nextTracks != null) {
      resolve(requestedKey, nextTracks)
    }
    val wasPlaying = clock != null
    clock = nextClock
    if (clock != null) showLoop = true
    if (wasPlaying != (clock != null)) {
      // A new clock reads its frame afresh; a stopped one leaves its last frame on screen.
      if (clock != null) loopIndex = -1
      invalidate()
    }
    if (nextCapture != capture) {
      capture = nextCapture
      if (capture != 0.0) emitCapture(capture)
    }
    schedule()
  }

  private fun resolve(requested: String, tracks: ReadableMap?) {
    val generation = request
    val done = { found: AvatarLoop? ->
      if (generation == request) {
        loop = found
        emitLoop(requested, found != null)
        schedule()
        invalidate()
      }
    }
    // The props are read here; the paths are parsed off the main thread.
    val copy = tracks?.let { try { tracksOf(it) } catch (_: Exception) { null } }
    if (copy != null) AvatarLoops.put(context, requested, copy, done)
    else AvatarLoops.get(context, requested, done)
  }

  fun stop() {
    ticking = false
    Choreographer.getInstance().removeFrameCallback(tick)
  }

  private fun schedule() {
    val run = clock != null && loop != null && visible && isAttachedToWindow
    if (run == ticking) return
    if (run) {
      ticking = true
      Choreographer.getInstance().postFrameCallback(tick)
    } else stop()
  }

  private fun onTick(frameTimeNanos: Long) {
    if (!ticking) return
    val playing = loop
    val at = clock
    if (playing == null || at == null) { stop(); return }
    val seconds = at.time + (frameTimeNanos / 1e6 - at.epoch) / 1000.0
    val index = playing.index(seconds)
    if (index != loopIndex) {
      loopIndex = index
      invalidate()
    }
    // Wake on the vsync the next loop frame is due, not on every one.
    val frameSeconds = playing.duration / playing.length
    val wrapped = ((seconds % playing.duration) + playing.duration) % playing.duration
    val untilNext = ((index + 1) * frameSeconds - wrapped) * 1000.0
    Choreographer.getInstance().postFrameCallbackDelayed(tick, maxOf(0L, untilNext.toLong() - 4L))
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    schedule()
  }

  override fun onDetachedFromWindow() {
    stop()
    super.onDetachedFromWindow()
  }

  override fun onVisibilityAggregated(isVisible: Boolean) {
    super.onVisibilityAggregated(isVisible)
    visible = isVisible
    schedule()
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val playing = loop
    if (showLoop && playing != null) {
      if (loopIndex < 0 || loopIndex >= playing.length) {
        val at = clock ?: return
        loopIndex = playing.index(at.time + (System.nanoTime() / 1e6 - at.epoch) / 1000.0)
      }
      drawLoopFrame(canvas, playing, loopIndex)
    } else frame?.let { drawFrame(canvas, it) }
  }

  private fun fit(canvas: Canvas, viewBox: FloatArray) {
    if (viewBox[2] <= 0f || viewBox[3] <= 0f) return
    // xMidYMid meet, as an <Svg viewBox> fills its box.
    val scale = minOf(width / viewBox[2], height / viewBox[3])
    canvas.translate((width - viewBox[2] * scale) / 2f - viewBox[0] * scale, (height - viewBox[3] * scale) / 2f - viewBox[1] * scale)
    canvas.scale(scale, scale)
  }

  private fun drawPath(canvas: Canvas, d: Path, clip: Path?, fill: Int, fillAlpha: Int, stroke: Int?, strokeAlpha: Int, strokeWidth: Float) {
    val saved = canvas.save()
    if (clip != null) canvas.clipPath(clip)
    if (fillAlpha > 0) {
      fillPaint.color = fill
      fillPaint.alpha = fillAlpha
      canvas.drawPath(d, fillPaint)
    }
    if (stroke != null && strokeAlpha > 0 && strokeWidth > 0f) {
      strokePaint.color = stroke
      strokePaint.alpha = strokeAlpha
      strokePaint.strokeWidth = strokeWidth
      canvas.drawPath(d, strokePaint)
    }
    canvas.restoreToCount(saved)
  }

  private fun drawLoopFrame(canvas: Canvas, playing: AvatarLoop, index: Int) {
    val saved = canvas.save()
    fit(canvas, playing.viewBox)
    for (track in playing.tracks) {
      val opacity = track.opacity[index]
      drawPath(
        canvas, track.d[index], track.clip?.get(index), track.fill, alpha(opacity * track.fillOpacity),
        track.stroke, alpha(opacity), track.strokeWidth,
      )
    }
    canvas.restoreToCount(saved)
  }

  private fun drawFrame(canvas: Canvas, shown: Frame) {
    val saved = canvas.save()
    // A group's opacity is one layer, as react-native-svg draws `<G opacity>`.
    if (shown.alpha < 255) canvas.saveLayerAlpha(0f, 0f, width.toFloat(), height.toFloat(), shown.alpha)
    fit(canvas, shown.viewBox)
    for (path in shown.paths) drawPath(canvas, path.d, path.clip, path.fill, path.fillAlpha, path.stroke, path.strokeAlpha, path.strokeWidth)
    canvas.restoreToCount(saved)
  }

  private fun parseFrame(map: ReadableMap): Frame? = try {
    val paths = map.getArray("paths")!!
    Frame(
      floats(map.getArray("viewBox")!!),
      (map.getDouble("opacity") * 255).toInt().coerceIn(0, 255),
      List(paths.size()) { i ->
        val path = paths.getMap(i)!!
        val opacity = path.getDouble("opacity").toFloat()
        val stroke = if (path.hasKey("stroke") && !path.isNull("stroke")) path.getDouble("stroke").toLong().toInt() else null
        FramePath(
          AvatarPathData.parse(path.getString("d")!!).toPath(),
          if (path.hasKey("clip") && !path.isNull("clip")) AvatarPathData.parse(path.getString("clip")!!).toPath() else null,
          path.getDouble("fill").toLong().toInt(),
          alpha(opacity * path.getDouble("fillOpacity").toFloat()),
          stroke,
          alpha(opacity),
          if (stroke != null) path.getDouble("strokeWidth").toFloat() else 0f,
        )
      },
    )
  } catch (_: Exception) {
    null
  }

  private fun emitLoop(loopKey: String, ready: Boolean) = emit("topLoop") {
    putString("key", loopKey)
    putBoolean("ready", ready)
  }

  private fun emitCapture(id: Double) {
    val data = try {
      val bitmap = Bitmap.createBitmap(maxOf(1, width), maxOf(1, height), Bitmap.Config.ARGB_8888)
      draw(Canvas(bitmap))
      val bytes = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes)
      bitmap.recycle()
      Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)
    } catch (_: Exception) {
      null
    }
    emit("topCapture") {
      putDouble("id", id)
      if (data != null) putString("data", data) else putNull("data")
    }
  }

  private fun emit(name: String, fill: WritableMap.() -> Unit) {
    val context = context as? ThemedReactContext ?: return
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, id) ?: return
    dispatcher.dispatchEvent(SurfaceEvent(UIManagerHelper.getSurfaceId(this), id, name, Arguments.createMap().apply(fill)))
  }

  companion object {
    /** react-native-svg's rounding of an opacity to a paint alpha. */
    fun alpha(opacity: Float) = Math.round(255f * opacity).coerceIn(0, 255)

    private fun floats(array: ReadableArray) = FloatArray(array.size()) { array.getDouble(it).toFloat() }
    private fun strings(array: ReadableArray) = List(array.size()) { array.getString(it)!! }

    /** Copies a loop's props; the returned function parses them (`AvatarLoops.put` runs it off the main thread). */
    fun tracksOf(map: ReadableMap): () -> AvatarLoopData {
      val duration = map.getDouble("duration")
      val length = map.getInt("length")
      val viewBox = floats(map.getArray("viewBox")!!)
      val paths = map.getArray("paths")!!
      val raw = List(paths.size()) { i ->
        val path = paths.getMap(i)!!
        val stroke = if (path.hasKey("stroke") && !path.isNull("stroke")) path.getDouble("stroke").toLong().toInt() else null
        val clip = if (path.hasKey("clip") && !path.isNull("clip")) strings(path.getArray("clip")!!) else null
        val opacity = floats(path.getArray("opacity")!!)
        val d = strings(path.getArray("d")!!)
        require(opacity.size == length && d.size == length && (clip == null || clip.size == length)) { "Avatar loop: tracks of unequal length" }
        RawTrack(
          path.getDouble("fill").toLong().toInt(), path.getDouble("fillOpacity").toFloat(), stroke,
          if (stroke != null) path.getDouble("strokeWidth").toFloat() else 0f, opacity, d, clip,
        )
      }
      return {
        AvatarLoopData(duration, length, viewBox, raw.map { track ->
          AvatarLoopData.Track(
            track.fill, track.fillOpacity, track.stroke, track.strokeWidth, track.opacity,
            track.d.map(AvatarPathData::parse), track.clip?.map(AvatarPathData::parse),
          )
        })
      }
    }

    private class RawTrack(val fill: Int, val fillOpacity: Float, val stroke: Int?, val strokeWidth: Float, val opacity: FloatArray, val d: List<String>, val clip: List<String>?)
  }
}

private class SurfaceEvent(surfaceId: Int, viewId: Int, private val name: String, private val data: WritableMap) :
  Event<SurfaceEvent>(surfaceId, viewId) {
  override fun getEventName() = name
  override fun canCoalesce() = false
  override fun getEventData() = data
}
