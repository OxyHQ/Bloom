// Bloom's native image view (ADR 0002, section 7): the Android side of
// `extern native "BloomImage"` (stdlib/Bloom/Image.bloom).
package so.oxy.bloom.image

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.RenderEffect
import android.graphics.Shader
import android.os.Build
import android.os.SystemClock
import android.view.View
import com.facebook.common.executors.UiThreadImmediateExecutorService
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.BaseDataSubscriber
import com.facebook.datasource.DataSource
import com.facebook.imagepipeline.common.ResizeOptions
import com.facebook.imagepipeline.image.CloseableBitmap
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import kotlin.math.max
import kotlin.math.min

/**
 * The view behind Bloom's `Image` on Android.
 *
 * - **Pipeline.** React Native's image pipeline ([Pipeline]) downloads, caches and decodes,
 *   at the view's size for the fits that scale (`cover`, `contain`, `fill`), so a 4000 px
 *   photo in a 40 dp avatar decodes as a 40 dp bitmap.
 * - **Cache hits paint at once.** A picture already in memory arrives during the prop update
 *   that asked for it, so it is drawn in that frame, with no cross-fade.
 * - **Cross-fade.** A picture that arrives later fades in over what was drawn (the
 *   placeholder, or the previous source) for `transition` ms.
 * - **Recycling.** A changed `recyclingKey` clears the picture at once, so a reused list row
 *   never shows the previous row's image while its own loads.
 * - **Borders.** Corners, borders and the background are React Native's
 *   ([BackgroundStyleApplicator]); the picture is clipped to the padding box.
 *
 * Each drawn picture holds a reference to the pipeline's bitmap, closed when it is no longer
 * drawn, so the pipeline never reuses a bitmap this view draws.
 */
class BloomImageView(context: ThemedReactContext) : View(context) {
  // ---- props (set by the view manager, applied in [commit]) ----
  var source: String? = null
  var headers: List<String> = emptyList()
  var placeholder: String? = null
  var contentFit: String = "cover"
    set(value) {
      if (field != value) {
        field = value
        invalidate()
      }
    }
  var transition: Int = 0
  var cachePolicy: String = "memory-disk"
  var recyclingKey: String? = null
  var tint: Int = 0
    set(value) {
      if (field != value) {
        field = value
        paint.colorFilter = if (value == 0) null else PorterDuffColorFilter(value, PorterDuff.Mode.SRC_IN)
        invalidate()
      }
    }
  var blurRadius: Double = 0.0
    set(value) {
      if (field != value) {
        field = value
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          val px = (value * resources.displayMetrics.density).toFloat()
          setRenderEffect(if (px > 0f) RenderEffect.createBlurEffect(px, px, Shader.TileMode.CLAMP) else null)
        }
      }
    }

  /** A picture this view draws, and the reference that keeps its bitmap alive. */
  private class Picture(val ref: CloseableReference<CloseableImage>, val bitmap: Bitmap) {
    fun close() = CloseableReference.closeSafely(ref)
  }

  /** What a load was asked for: when it changes, the view loads again. */
  private data class Wanted(
    val source: String?,
    val headers: List<String>,
    val policy: String,
    val width: Int,
    val height: Int,
  )

  private val paint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
  private val matrix = Matrix()
  private var shown: Picture? = null
  /** Whether [shown] is the placeholder (the source has not arrived). */
  private var shownIsPlaceholder = false
  /** The picture under [shown] while it fades in. */
  private var under: Picture? = null
  private var fadeStart = 0L
  private var wanted: Wanted? = null
  private var lastRecyclingKey: String? = null
  private var loading: DataSource<CloseableReference<CloseableImage>>? = null
  private var loadingPlaceholder: DataSource<CloseableReference<CloseableImage>>? = null
  /** Increases with every load, so a late result of an earlier one is dropped. */
  private var generation = 0
  /** Inside [commit]: a result that arrives now is a cache hit, drawn without a fade. */
  private var committing = false

  /** After a prop update (the view manager's `onAfterUpdateTransaction`). */
  fun commit() {
    if (recyclingKey != lastRecyclingKey) {
      lastRecyclingKey = recyclingKey
      clearPictures()
      wanted = null
    }
    load()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    load()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    load()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    cancel()
  }

  /** Releases every picture: the view manager's `onDropViewInstance`. */
  fun drop() {
    cancel()
    clearPictures()
    wanted = null
  }

  /** The size to decode at: the view's, for the fits that scale the picture to the box. */
  private fun decodeSize(): ResizeOptions? =
    if (width <= 0 || height <= 0 || contentFit == "none" || contentFit == "scale-down") null
    else ResizeOptions(width, height)

  private fun load() {
    // The size is known after layout; a fit that draws at the picture's size needs none.
    val sized = contentFit == "none" || contentFit == "scale-down"
    if (!sized && (width <= 0 || height <= 0)) return
    val next = Wanted(source, headers, cachePolicy, if (sized) 0 else width, if (sized) 0 else height)
    if (next == wanted) return
    val sourceChanged = wanted?.source != next.source || wanted?.headers != next.headers
    cancel()
    wanted = next
    val gen = ++generation
    val uri = source?.let { Pipeline.uri(context, it) }
    if (uri == null) {
      clearPictures()
      if (source != null) dispatch("topError", Arguments.createMap().apply { putString("error", "no image at `$source`") })
      return
    }
    val pipeline = Pipeline.get(context)
    if (sourceChanged && shown == null) loadPlaceholder(gen)
    committing = true
    try {
      val dataSource = pipeline.fetchDecodedImage(Pipeline.request(uri, decodeSize(), cachePolicy, headers), CALLER)
      loading = dataSource
      dataSource.subscribe(
        object : BaseDataSubscriber<CloseableReference<CloseableImage>>() {
          override fun onNewResultImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            if (!dataSource.isFinished || gen != generation) return
            val ref = dataSource.result ?: return
            arrived(ref, placeholder = false, instant = committing)
          }

          override fun onFailureImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            if (gen != generation) return
            val message = dataSource.failureCause?.message ?: "the image did not load"
            dispatch("topError", Arguments.createMap().apply { putString("error", message) })
          }
        },
        UiThreadImmediateExecutorService.getInstance(),
      )
    } finally {
      committing = false
    }
  }

  private fun loadPlaceholder(gen: Int) {
    val uri = placeholder?.let { Pipeline.uri(context, it) } ?: return
    val dataSource = Pipeline.get(context).fetchDecodedImage(Pipeline.request(uri, null, "memory-disk", emptyList()), CALLER)
    loadingPlaceholder = dataSource
    dataSource.subscribe(
      object : BaseDataSubscriber<CloseableReference<CloseableImage>>() {
        override fun onNewResultImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
          if (!dataSource.isFinished || gen != generation || (shown != null && !shownIsPlaceholder)) return
          val ref = dataSource.result ?: return
          arrived(ref, placeholder = true, instant = true)
        }

        override fun onFailureImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {}
      },
      UiThreadImmediateExecutorService.getInstance(),
    )
  }

  /** A picture arrived: draw it (fading it in unless [instant]) and tell JS its size. */
  private fun arrived(ref: CloseableReference<CloseableImage>, placeholder: Boolean, instant: Boolean) {
    val image = ref.get()
    val bitmap = (image as? CloseableBitmap)?.underlyingBitmap
    if (bitmap == null) {
      // An animated image the pipeline decodes without its first frame as a bitmap.
      CloseableReference.closeSafely(ref)
      if (!placeholder) dispatch("topError", Arguments.createMap().apply { putString("error", "this image format is not drawn") })
      return
    }
    val picture = Picture(ref, bitmap)
    under?.close()
    under = null
    if (!instant && transition > 0 && !placeholder) {
      under = shown
      fadeStart = SystemClock.uptimeMillis()
    } else {
      shown?.close()
    }
    shown = picture
    shownIsPlaceholder = placeholder
    invalidate()
    if (!placeholder) {
      // The source's own size, before it was decoded at the view's.
      val extras = image.extras
      val w = (extras["encoded_width"] as? Number)?.toInt()?.takeIf { it > 0 } ?: image.width
      val h = (extras["encoded_height"] as? Number)?.toInt()?.takeIf { it > 0 } ?: image.height
      dispatch(
        "topLoad",
        Arguments.createMap().apply {
          putDouble("width", w.toDouble())
          putDouble("height", h.toDouble())
        },
      )
    }
  }

  /**
   * Stops the load in flight. One that had not arrived is asked for again when the view
   * is next attached or laid out (a screen's transition detaches and reattaches its views).
   */
  private fun cancel() {
    if (loading?.isFinished == false) wanted = null
    loading?.close()
    loading = null
    loadingPlaceholder?.close()
    loadingPlaceholder = null
    generation++
  }

  private fun clearPictures() {
    under?.close()
    under = null
    shown?.close()
    shown = null
    shownIsPlaceholder = false
    invalidate()
  }

  override fun hasOverlappingRendering(): Boolean = false

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val picture = shown ?: return
    BackgroundStyleApplicator.clipToPaddingBoxWithAntiAliasing(this, canvas) {
      val elapsed = SystemClock.uptimeMillis() - fadeStart
      val fading = under != null && elapsed < transition
      if (fading) {
        under?.let { draw(canvas, it.bitmap, 255) }
        draw(canvas, picture.bitmap, (255 * elapsed / transition).toInt().coerceIn(0, 255))
      } else {
        if (under != null) {
          under?.close()
          under = null
        }
        draw(canvas, picture.bitmap, 255)
      }
      if (fading) postInvalidateOnAnimation()
    }
  }

  private fun draw(canvas: Canvas, bitmap: Bitmap, alpha: Int) {
    if (bitmap.isRecycled) return
    val vw = (width - paddingLeft - paddingRight).toFloat()
    val vh = (height - paddingTop - paddingBottom).toFloat()
    val bw = bitmap.width.toFloat()
    val bh = bitmap.height.toFloat()
    if (vw <= 0f || vh <= 0f || bw <= 0f || bh <= 0f) return
    matrix.reset()
    // `none` and `scale-down` draw the picture's pixels as points, as the web draws an
    // `<img>`'s pixels as CSS pixels.
    val natural = resources.displayMetrics.density
    val (sx, sy) =
      when (contentFit) {
        "fill" -> Pair(vw / bw, vh / bh)
        "contain" -> min(vw / bw, vh / bh).let { Pair(it, it) }
        "none" -> Pair(natural, natural)
        "scale-down" -> min(natural, min(vw / bw, vh / bh)).let { Pair(it, it) }
        else -> max(vw / bw, vh / bh).let { Pair(it, it) }
      }
    matrix.setScale(sx, sy)
    matrix.postTranslate(paddingLeft + (vw - bw * sx) / 2f, paddingTop + (vh - bh * sy) / 2f)
    paint.alpha = alpha
    canvas.drawBitmap(bitmap, matrix, paint)
  }

  private fun dispatch(name: String, data: WritableMap) {
    val react = context as? ReactContext ?: return
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(react, id) ?: return
    dispatcher.dispatchEvent(ImageEvent(UIManagerHelper.getSurfaceId(this), id, name, data))
  }

  private class ImageEvent(surfaceId: Int, viewId: Int, private val name: String, private val data: WritableMap) :
    Event<ImageEvent>(surfaceId, viewId) {
    override fun getEventName(): String = name

    override fun getEventData(): WritableMap = data
  }

  private companion object {
    const val CALLER = "BloomImageView"
  }
}
