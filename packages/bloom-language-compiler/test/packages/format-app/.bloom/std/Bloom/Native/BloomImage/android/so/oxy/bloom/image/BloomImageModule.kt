// Bloom's native image view (ADR 0002, section 7): the Android side of
// `extern native "BloomImage"` (stdlib/Bloom/Image.bloom).
package so.oxy.bloom.image

import com.facebook.common.executors.CallerThreadExecutor
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.BaseDataSubscriber
import com.facebook.datasource.DataSource
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import java.util.concurrent.atomic.AtomicInteger

/**
 * `ImageCache` (`prefetch`, `size`, `clear`): the cache `BloomImageView` draws from.
 *
 * [NativeBloomImageSpec] is React Native's codegen output for the spec `bloom build`
 * generates from the Bloom interface, so the Kotlin compiler checks this class against it.
 */
class BloomImageModule(context: ReactApplicationContext) : NativeBloomImageSpec(context) {
  private val pipeline by lazy { Pipeline.get(context) }

  override fun prefetch(urls: ReadableArray, memory: Boolean, promise: Promise) {
    val uris = (0 until urls.size()).mapNotNull { urls.getString(it)?.let { url -> Pipeline.uri(reactApplicationContext, url) } }
    if (uris.isEmpty()) {
      promise.resolve(false)
      return
    }
    val left = AtomicInteger(uris.size)
    val failed = AtomicInteger(0)
    for (uri in uris) {
      val request = Pipeline.request(uri, null, "memory-disk", emptyList())
      val source =
        if (memory) pipeline.prefetchToBitmapCache(request, CALLER)
        else pipeline.prefetchToDiskCache(request, CALLER)
      source.subscribe(
        object : BaseDataSubscriber<Void?>() {
          override fun onNewResultImpl(dataSource: DataSource<Void?>) {
            if (dataSource.isFinished && left.decrementAndGet() == 0) promise.resolve(failed.get() == 0)
          }

          override fun onFailureImpl(dataSource: DataSource<Void?>) {
            failed.incrementAndGet()
            if (left.decrementAndGet() == 0) promise.resolve(false)
          }
        },
        CallerThreadExecutor.getInstance(),
      )
    }
  }

  override fun size(url: String, promise: Promise) {
    val uri = Pipeline.uri(reactApplicationContext, url)
    if (uri == null) {
      promise.reject("BloomImage", "no image at `$url`")
      return
    }
    pipeline
      .fetchDecodedImage(Pipeline.request(uri, null, "memory-disk", emptyList()), CALLER)
      .subscribe(
        object : BaseDataSubscriber<CloseableReference<CloseableImage>>() {
          override fun onNewResultImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            if (!dataSource.isFinished) return
            val ref = dataSource.result
            if (ref == null) {
              promise.reject("BloomImage", "no image at `$url`")
              return
            }
            try {
              val image = ref.get()
              val out = Arguments.createArray()
              out.pushDouble(image.width.toDouble())
              out.pushDouble(image.height.toDouble())
              promise.resolve(out)
            } finally {
              CloseableReference.closeSafely(ref)
            }
          }

          override fun onFailureImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            promise.reject("BloomImage", dataSource.failureCause?.message ?: "the image at `$url` did not load")
          }
        },
        CallerThreadExecutor.getInstance(),
      )
  }

  override fun clear(memory: Boolean, disk: Boolean, promise: Promise) {
    if (memory) pipeline.clearMemoryCaches()
    if (disk) pipeline.clearDiskCaches()
    promise.resolve(true)
  }

  private companion object {
    const val CALLER = "BloomImage"
  }
}
