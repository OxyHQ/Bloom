// `Image` and `Avatar`: pictures from a URL (or a `data:` URL), as today's Bloom draws them on
// iOS (expo-image: memory and disk caches, `cover` by default, no transition unless
// `.crossFade`, no placeholder colour; an avatar's disc is `backgroundTertiary` while it loads).
//
// The pipeline is BloomUI's own (~150 lines, no dependency): bytes from URLSession through a
// disk cache, decoded by ImageIO straight to the drawn pixel size (a 480 px photo drawn at
// 120 pt is decoded at 360 px on a 3x screen, never at full size), kept in a memory cache by
// URL and size. Work is shared per key, so a row that leaves before its picture arrives
// cancels its wait, never another row's decode. A failure is retried after 2 s and 8 s; a
// 404 is not (Avatar.tsx).
#if canImport(SwiftUI)
import SwiftUI
#if canImport(UIKit)
import UIKit
import ImageIO
#endif

/// How a picture fills its frame (`contentFit`).
extension Tokens.ContentFit {
  var mode: SwiftUI.ContentMode {
    switch self {
    case .contain, .scaleDown, .none: .fit
    case .cover, .fill: .fill
    }
  }
}

#if canImport(UIKit)
/// Decoded pictures by URL and pixel size, and the bytes on disk.
actor ImagePipeline {
  static let shared = ImagePipeline()

  private let memory = NSCache<NSString, UIImage>()
  private var inflight: [String: Task<UIImage?, Never>] = [:]
  private let disk: URL = {
    let base = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    let dir = base.appendingPathComponent("BloomImages", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }()
  private let session: URLSession = {
    let config = URLSessionConfiguration.default
    config.httpMaximumConnectionsPerHost = 5
    config.requestCachePolicy = .returnCacheDataElseLoad
    return URLSession(configuration: config)
  }()

  init() {
    memory.totalCostLimit = 64 * 1024 * 1024
  }

  /// The picture at `source`, decoded for `pixels` on its longest side (0: as stored).
  func image(_ source: String, pixels: Int) async -> UIImage? {
    let key = "\(pixels)@\(source)"
    if let hit = memory.object(forKey: key as NSString) { return hit }
    if let running = inflight[key] { return await running.value }
    let work = Task<UIImage?, Never> { [session, disk] in
      guard let data = await Self.bytes(source, session: session, disk: disk) else { return nil }
      return Self.decode(data, pixels: pixels)
    }
    inflight[key] = work
    let image = await work.value
    inflight[key] = nil
    if let image {
      let cost = Int(image.size.width * image.size.height * image.scale * image.scale * 4)
      memory.setObject(image, forKey: key as NSString, cost: cost)
    }
    return image
  }

  static func bytes(_ source: String, session: URLSession, disk: URL) async -> Data? {
    if source.hasPrefix("data:"), let comma = source.firstIndex(of: ",") {
      let header = source[..<comma]
      let payload = String(source[source.index(after: comma)...])
      return header.hasSuffix(";base64") ? Data(base64Encoded: payload) : payload.removingPercentEncoding.map { Data($0.utf8) }
    }
    guard let url = URL(string: source) else { return nil }
    let file = disk.appendingPathComponent(stableKey(source))
    if let cached = try? Data(contentsOf: file) { return cached }
    for delay in [0.0, 2.0, 8.0] {
      if delay > 0 { try? await Task.sleep(for: .seconds(delay)) }
      guard let (data, response) = try? await session.data(from: url) else { continue }
      let status = (response as? HTTPURLResponse)?.statusCode ?? 200
      if status == 404 { return nil }
      if (200..<300).contains(status) {
        try? data.write(to: file, options: .atomic)
        return data
      }
    }
    return nil
  }

  /// Decoded at `pixels` on the longest side, through ImageIO's thumbnailer (never the full
  /// bitmap first).
  static func decode(_ data: Data, pixels: Int) -> UIImage? {
    guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
    var options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceShouldCacheImmediately: true,
    ]
    if pixels > 0 { options[kCGImageSourceThumbnailMaxPixelSize] = pixels }
    guard let cg = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { return nil }
    return UIImage(cgImage: cg)
  }
}
#endif

/// A file name for `source` that is the same in every launch (Swift's `hashValue` is seeded
/// per process): FNV-1a, 64 bits.
func stableKey(_ source: String) -> String {
  var hash: UInt64 = 0xcbf2_9ce4_8422_2325
  for byte in source.utf8 {
    hash ^= UInt64(byte)
    hash = hash &* 0x100_0000_01b3
  }
  return String(hash, radix: 36)
}

/// The loaded picture, drawn in whatever frame its parent gives it (an unsized `Image` is
/// 0 × 0, as in React Native: `.frame` and `.aspectRatio` size it).
struct RemotePicture: View {
  let source: String
  let fit: Tokens.ContentFit
  let placeholder: Tokens.Color?
  @Environment(\.displayScale) private var scale
  @Environment(\.bloomPalette) private var palette
  #if canImport(UIKit)
  @State private var image: UIImage? = nil
  #endif

  var body: some View {
    GeometryReader { geo in
      ZStackFill {
        if let placeholder { Rectangle().fill(palette.color(BloomColor(placeholder))) }
        #if canImport(UIKit)
        if let image {
          SwiftUI.Image(uiImage: image).resizable().aspectRatio(contentMode: fit.mode)
            .frame(width: geo.size.width, height: geo.size.height).clipped()
        }
        #endif
      }
      #if canImport(UIKit)
      .task(id: "\(source)#\(Int(max(geo.size.width, geo.size.height) * scale))") {
        let pixels = Int(max(geo.size.width, geo.size.height) * scale)
        guard pixels > 0 else { return }
        image = await ImagePipeline.shared.image(source, pixels: pixels)
      }
      #endif
    }
  }
}

/// A ZStack that fills its frame (the picture's layers).
struct ZStackFill<Content: View>: View {
  let content: Content
  init(@ViewBuilder content: () -> Content) { self.content = content() }
  var body: some View {
    SwiftUI.ZStack(alignment: .topLeading) { content }
  }
}

public struct Image: View {
  let source: String
  let alt: String?
  var fit: Tokens.ContentFit = .cover
  var ratio: Double? = nil

  public init(_ source: String, _ alt: String? = nil) {
    self.source = source
    self.alt = alt
  }

  public var body: some View {
    Group {
      if let ratio {
        BloomAspectRatioLayout(ratio: ratio) { RemotePicture(source: source, fit: fit, placeholder: nil) }
      } else {
        BloomZeroSizeLayout { RemotePicture(source: source, fit: fit, placeholder: nil) }
      }
    }
    .accessibilityLabel(alt ?? "")
    .accessibilityAddTraits(.isImage)
    .accessibilityHidden(alt == nil)
  }

  public func contentFit(_ fit: Tokens.ContentFit) -> Image { var i = self; i.fit = fit; return i }
  /// `.aspectRatio(4.0 / 3.0)`: the picture's height is its width over the ratio.
  public func bloomAspectRatio(_ ratio: Double) -> Image { var i = self; i.ratio = ratio; return i }
}

/// Takes the size it is proposed, and 0 where it is not (React Native's unsized view).
public struct BloomZeroSizeLayout: Layout {
  public init() {}
  public func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let w = proposal.width.flatMap { $0.isFinite ? $0 : nil } ?? 0
    let h = proposal.height.flatMap { $0.isFinite ? $0 : nil } ?? 0
    return CGSize(width: w, height: h)
  }
  public func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    for child in subviews {
      child.place(at: CGPoint(x: bounds.minX, y: bounds.minY), anchor: .topLeading, proposal: ProposedViewSize(bounds.size))
    }
  }
}

/// A person's picture in a disc: sizes xs 20 … xl 40 (40 by default), `backgroundTertiary`
/// behind while it loads.
public struct Avatar: View {
  let source: String?
  let name: String?
  var side: Tokens.AvatarSize = .xl

  public init(_ source: String?, _ name: String? = nil) {
    self.source = source
    self.name = name
  }

  public var body: some View {
    let d = CGFloat(side.value)
    Group {
      if let source, !source.isEmpty {
        RemotePicture(source: source, fit: .cover, placeholder: .popover)
      } else {
        Initials(name: name ?? "", diameter: d)
      }
    }
    .frame(width: d, height: d)
    .clipShape(Circle())
    .accessibilityLabel(name ?? "")
  }

  public func size(_ size: Tokens.AvatarSize) -> Avatar { var a = self; a.side = size; return a }
}

/// The first character of the name on the neutral disc (the hashed tints are a follow-up).
struct Initials: View {
  let name: String
  let diameter: CGFloat
  @Environment(\.bloomPalette) private var palette

  var body: some View {
    SwiftUI.ZStack {
      Circle().fill(palette.color(.popover))
      SwiftUI.Text(verbatim: name.first.map { String($0).uppercased() } ?? "")
        .font(.custom("Inter", fixedSize: diameter <= 24 ? 10 : diameter <= 32 ? 16 : 18).weight(.semibold))
        .foregroundStyle(palette.color(.muted))
    }
  }
}
#endif
