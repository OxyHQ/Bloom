// Bloom (UI models): `ImageCache`, the cache `Image` draws from. BloomUI's image pipeline
// installs itself as `ImageCache.pipeline`; without one, images are prefetched into
// `URLCache.shared` and measured with ImageIO (Apple platforms). Video.bloom has no public API
// beyond its native module: the player is BloomUI's (AVPlayer).
import Foundation

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
#if canImport(ImageIO)
import ImageIO
#endif

/// What draws and caches images (BloomUI's pipeline).
public protocol ImagePipeline: Sendable {
  func prefetch(_ urls: [String], memory: Bool) async throws -> Bool
  func size(of url: String) async throws -> [Double]
  func clear(memory: Bool, disk: Bool) async
}

/// The cache `Image` draws from: decoded pictures in memory, downloaded bytes on disk.
public enum ImageCache {
  private static let installed = Locked<(any ImagePipeline)?>(nil)

  /// The pipeline BloomUI installs (`nil`: `URLCache.shared`).
  public static var pipeline: (any ImagePipeline)? {
    get { installed.withLock { $0 } }
    set { installed.withLock { $0 = newValue } }
  }

  /// Downloads `urls` into the cache, so an `Image` of one paints at once. `false` when one
  /// failed (or `urls` is empty).
  public static func prefetch(_ urls: [String], memory: Bool = false) async -> Bool {
    if urls.isEmpty { return false }
    if let pipeline { return (try? await pipeline.prefetch(urls, memory: memory)) ?? false }
    var ok = true
    for text in urls {
      guard let url = Foundation.URL(string: text) else {
        ok = false
        continue
      }
      do {
        let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad)
        let (data, response) = try await URLSession.shared.data(for: request)
        if (response as? HTTPURLResponse).map({ !(200..<300).contains($0.statusCode) }) ?? false { ok = false }
        URLCache.shared.storeCachedResponse(CachedURLResponse(response: response, data: data), for: request)
      } catch {
        ok = false
      }
    }
    return ok
  }

  /// The pixel size of the image at `url` (`[width, height]`), read through the cache.
  public static func size(of url: String) async throws -> [Double] {
    if let pipeline { return try await pipeline.size(of: url) }
    guard let u = Foundation.URL(string: url) else { throw URLError(.badURL) }
    let (data, _) = try await URLSession.shared.data(for: URLRequest(url: u, cachePolicy: .returnCacheDataElseLoad))
    #if canImport(ImageIO)
    guard let source = CGImageSourceCreateWithData(data as CFData, nil),
      let props = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
      let w = props[kCGImagePropertyPixelWidth] as? Double, let h = props[kCGImagePropertyPixelHeight] as? Double
    else { throw URLError(.cannotDecodeContentData) }
    return [w, h]
    #else
    _ = data
    throw URLError(.cannotDecodeContentData)
    #endif
  }

  /// Empties the memory cache, the disk cache or both.
  public static func clear(memory: Bool = true, disk: Bool = true) async {
    if let pipeline {
      await pipeline.clear(memory: memory, disk: disk)
      return
    }
    if memory || disk { URLCache.shared.removeAllCachedResponses() }
  }
}
