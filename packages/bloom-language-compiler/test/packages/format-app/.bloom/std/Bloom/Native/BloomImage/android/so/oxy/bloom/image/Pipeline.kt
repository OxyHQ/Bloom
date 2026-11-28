// Bloom's native image view (ADR 0002, section 7): the Android side of
// `extern native "BloomImage"` (stdlib/Bloom/Image.bloom).
package so.oxy.bloom.image

import android.content.Context
import android.net.Uri
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.common.ResizeOptions
import com.facebook.imagepipeline.core.ImagePipeline
import com.facebook.imagepipeline.request.ImageRequest
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.fresco.FrescoModule
import com.facebook.react.modules.fresco.ReactNetworkImageRequest

/**
 * The image pipeline every Bloom image goes through: React Native's own (Fresco), which the
 * app already ships, with its decoded-picture memory cache and its disk cache of downloaded
 * bytes. So the view adds no decoder or cache of its own to the APK, and an image drawn by
 * React Native's `Image` and by Bloom's shares one cache.
 */
internal object Pipeline {
  /** The pipeline, initialised the way React Native's `FrescoModule` does when it has not been yet. */
  fun get(context: Context): ImagePipeline {
    if (!Fresco.hasBeenInitialized()) {
      val react = context as? ReactContext ?: (context.applicationContext as? ReactContext)
      if (react != null) runCatching { react.getNativeModule(FrescoModule::class.java) }
      if (!Fresco.hasBeenInitialized() && react != null) {
        Fresco.initialize(context.applicationContext, FrescoModule.getDefaultConfigBuilder(react).build())
      }
    }
    return Fresco.getImagePipeline()
  }

  /**
   * The URI of `source`: a URL as written, or a bundled image's resource name (what React
   * Native's asset resolver gives a release build) as an `res:` URI of its drawable.
   */
  fun uri(context: Context, source: String): Uri? {
    if (source.isEmpty()) return null
    val parsed = Uri.parse(source)
    if (parsed.scheme != null) return parsed
    val name = source.lowercase().replace('-', '_').substringBeforeLast('.')
    val res = context.resources
    @Suppress("DiscouragedApi")
    val id =
      res.getIdentifier(name, "drawable", context.packageName).takeIf { it != 0 }
        ?: res.getIdentifier(name, "raw", context.packageName)
    return if (id == 0) null else Uri.Builder().scheme("res").path(id.toString()).build()
  }

  /** The request for `uri`: decoded at `size` (when known), cached by `policy`, with `headers`. */
  fun request(
    uri: Uri,
    size: ResizeOptions?,
    policy: String,
    headers: List<String>,
  ): ImageRequest {
    val builder = ImageRequestBuilder.newBuilderWithSource(uri)
    if (size != null) builder.setResizeOptions(size)
    when (policy) {
      "memory" -> builder.disableDiskCache()
      "disk" -> builder.disableMemoryCache()
      "none" -> builder.disableDiskCache().disableMemoryCache()
    }
    if (headers.size < 2) return builder.build()
    val map = JavaOnlyMap()
    var i = 0
    while (i + 1 < headers.size) {
      map.putString(headers[i], headers[i + 1])
      i += 2
    }
    return ReactNetworkImageRequest.fromBuilderWithHeaders(builder, map)
  }
}
