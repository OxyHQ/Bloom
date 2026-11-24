package so.oxy.bloom.icons

import android.content.Context
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * A Bloom icon as ONE native view: its path data drawn with `Canvas.drawPath` on
 * the view's own (hardware) canvas.
 *
 * react-native-svg draws the same glyph as three views (`SvgView`, a group and
 * the path) and rasterises it in software into a bitmap on the UI thread during
 * `onDraw`. This view records one path op per subpath instead; the GPU
 * rasterises it on the render thread.
 *
 * The drawing is react-native-svg's, step for step, so the glyph is the same:
 * the path parsed at the screen density by its own parser ([IconPathParser]),
 * the `xMidYMid meet` viewBox transform, the even-odd fill rule, its paint
 * flags, its stroke miter (4 x density), and the one gradient Bloom icons draw
 * (`useCommonSVGProps`: x1 0, y1 0, x2 100%, y2 0 of each path's bounds,
 * `rotate(45)`). The JS contract is `src/icons/glyph.native.tsx`.
 */
class BloomIconManager : SimpleViewManager<BloomIcon>() {
  override fun getName() = "BloomIconV1"
  override fun createViewInstance(context: ThemedReactContext) = BloomIcon(context)

  @ReactProp(name = "paths")
  fun paths(view: BloomIcon, values: ReadableArray?) {
    view.sources = if (values == null) emptyList() else (0 until values.size()).map { values.getString(it) ?: "" }
  }

  /** The glyph's `viewBox` attribute, `minX minY width height`, split as react-native-svg's `extractViewBox`. */
  @ReactProp(name = "viewBox")
  fun viewBox(view: BloomIcon, value: String?) {
    val parts = value?.trim()?.split(VIEW_BOX_SEPARATOR)?.mapNotNull { it.toFloatOrNull() }
    view.viewBox = if (parts == null || parts.size != 4) DEFAULT_VIEW_BOX else parts.toFloatArray()
    view.invalidate()
  }

  /** The paint's colour; null draws nothing (`fill="none"`). */
  @ReactProp(name = "fill", customType = "Color")
  fun fill(view: BloomIcon, color: Int?) {
    view.color = color
    view.invalidate()
  }

  /** 0 fills the path; a width strokes it, in viewBox units. */
  @ReactProp(name = "strokeWidth", defaultDouble = 0.0)
  fun strokeWidth(view: BloomIcon, value: Double) {
    view.strokeWidth = value
    view.invalidate()
  }

  @ReactProp(name = "strokeLinecap")
  fun strokeLinecap(view: BloomIcon, value: String?) {
    view.cap = when (value) { "round" -> Paint.Cap.ROUND; "square" -> Paint.Cap.SQUARE; else -> Paint.Cap.BUTT }
    view.invalidate()
  }

  @ReactProp(name = "strokeLinejoin")
  fun strokeLinejoin(view: BloomIcon, value: String?) {
    view.join = when (value) { "round" -> Paint.Join.ROUND; "bevel" -> Paint.Join.BEVEL; else -> Paint.Join.MITER }
    view.invalidate()
  }

  /** `[offset, colour, offset, colour, …]`, react-native-svg's stop list; null paints [fill]. */
  @ReactProp(name = "gradient")
  fun gradient(view: BloomIcon, values: ReadableArray?) {
    if (values == null || values.size() < 2) {
      view.stops = null
      view.stopColors = null
    } else {
      val count = values.size() / 2
      var stops = FloatArray(count) { values.getDouble(it * 2).toFloat() }
      var colors = IntArray(count) { values.getDouble(it * 2 + 1).toLong().toInt() }
      // react-native-svg's Brush: a single stop paints as two at the same spot.
      if (count == 1) {
        stops = floatArrayOf(stops[0], stops[0])
        colors = intArrayOf(colors[0], colors[0])
      }
      view.stops = stops
      view.stopColors = colors
    }
    view.invalidate()
  }

  companion object {
    val DEFAULT_VIEW_BOX = floatArrayOf(0f, 0f, 24f, 24f)
    private val VIEW_BOX_SEPARATOR = Regex("\\s*,\\s*|\\s+")
  }
}

class BloomIcon(context: Context) : View(context) {
  private val scale = resources.displayMetrics.density
  private val paint = Paint()
  private val transform = Matrix()
  // react-native-svg's `rotate(45)`: cos and sin of 45 degrees in double, then float.
  private val gradientMatrix = Matrix().apply {
    val c = Math.cos(Math.PI / 180 * 45).toFloat()
    val s = Math.sin(Math.PI / 180 * 45).toFloat()
    setValues(floatArrayOf(c, -s, 0f, s, c, 0f, 0f, 0f, 1f))
  }
  private var glyph: Glyph? = null

  var sources: List<String> = emptyList()
    set(value) {
      if (field != value) {
        field = value
        glyph = null
        invalidate()
      }
    }
  var viewBox = BloomIconManager.DEFAULT_VIEW_BOX
  var color: Int? = null
  var strokeWidth = 0.0
  var cap = Paint.Cap.BUTT
  var join = Paint.Join.MITER
  var stops: FloatArray? = null
  var stopColors: IntArray? = null

  override fun onDraw(canvas: Canvas) {
    val width = width.toFloat()
    val height = height.toFloat()
    if (width < 1 || height < 1) return
    val stops = stops
    val stopColors = stopColors
    val color = color
    if (color == null && stops == null) return
    val glyph = glyph ?: Glyph.of(sources, scale)?.also { glyph = it } ?: return

    viewBoxTransform(width, height)
    val save = canvas.save()
    canvas.concat(transform)
    for (index in glyph.paths.indices) {
      paint.reset()
      paint.flags = Paint.ANTI_ALIAS_FLAG or Paint.DEV_KERN_TEXT_FLAG or Paint.SUBPIXEL_TEXT_FLAG
      if (strokeWidth > 0.0) {
        paint.style = Paint.Style.STROKE
        paint.strokeCap = cap
        paint.strokeJoin = join
        paint.strokeMiter = 4f * scale
        paint.strokeWidth = (strokeWidth * scale).toFloat()
      } else {
        paint.style = Paint.Style.FILL
      }
      if (stops != null && stopColors != null) {
        val box = glyph.bounds[index]
        val shader = LinearGradient(box.left, box.top, box.left + box.width(), box.top, stopColors, stops, Shader.TileMode.CLAMP)
        shader.setLocalMatrix(gradientMatrix)
        paint.shader = shader
      } else if (color != null) {
        paint.color = color
      }
      canvas.drawPath(glyph.paths[index], paint)
    }
    canvas.restoreToCount(save)
  }

  /** react-native-svg's `ViewBox.getTransform` for `xMidYMid meet`, in its order and precision. */
  private fun viewBoxTransform(width: Float, height: Float) {
    val vbX = (viewBox[0] * scale).toDouble()
    val vbY = (viewBox[1] * scale).toDouble()
    val vbWidth = ((viewBox[0] + viewBox[2]) * scale - viewBox[0] * scale).toDouble()
    val vbHeight = ((viewBox[1] + viewBox[3]) * scale - viewBox[1] * scale).toDouble()
    val s = minOf(width / vbWidth, height / vbHeight)
    val translateX = -(vbX * s) + (width - vbWidth * s) / 2.0
    val translateY = -(vbY * s) + (height - vbHeight * s) / 2.0
    transform.reset()
    transform.postTranslate(translateX.toFloat(), translateY.toFloat())
    transform.preScale(s.toFloat(), s.toFloat())
  }
}

/** A glyph's subpaths at one density, parsed once per process and shared by every view. */
internal class Glyph private constructor(val paths: Array<Path>, val bounds: Array<RectF>) {
  companion object {
    private val cache = HashMap<String, Glyph>()

    fun of(sources: List<String>, scale: Float): Glyph? {
      if (sources.isEmpty()) return null
      val key = scale.toString() + '|' + sources.joinToString("|")
      cache[key]?.let { return it }
      val paths = try {
        Array(sources.size) { IconPathParser.parse(sources[it], scale).apply { fillType = Path.FillType.EVEN_ODD } }
      } catch (error: IllegalArgumentException) {
        return null
      } catch (error: IndexOutOfBoundsException) {
        return null
      }
      val bounds = Array(paths.size) { RectF().also { box -> paths[it].computeBounds(box, true) } }
      return Glyph(paths, bounds).also { cache[key] = it }
    }
  }
}
