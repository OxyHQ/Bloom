// UNVERIFIED: written without a Mac; it has never been compiled or run. It is not linked
// (`react-native.config.js` keeps `ios: null`) and not packed (`package.json#files` omits `ios`),
// so iOS keeps drawing the avatar with react-native-svg until this is built and checked on a device.
//
// The iOS twin of android/src/main/java/so/oxy/bloom/AvatarSurface.kt: the same props, events and
// loop store, drawn with Core Animation shape layers and clocked by CADisplayLink.

import QuartzCore
import React
import UIKit

/// One outline as the avatar renderer writes it: absolute M, L, H, V and Z commands.
enum BloomAvatarPathData {
  static func parse(_ d: String) -> CGPath? {
    let path = CGMutablePath()
    let chars = Array(d.utf8)
    var i = 0
    var x: CGFloat = 0, y: CGFloat = 0
    func number() -> CGFloat? {
      while i < chars.count, chars[i] == 32 || chars[i] == 44 { i += 1 }
      let start = i
      if i < chars.count, chars[i] == 45 || chars[i] == 43 { i += 1 }
      while i < chars.count, (48...57).contains(chars[i]) || chars[i] == 46 || chars[i] == 101 || chars[i] == 69 { i += 1 }
      guard i > start, let value = Double(String(decoding: chars[start..<i], as: UTF8.self)) else { return nil }
      return CGFloat(value)
    }
    while i < chars.count {
      let command = chars[i]
      i += 1
      switch command {
      case 32, 44: continue
      case 77: // M
        guard let px = number(), let py = number() else { return nil }
        path.move(to: CGPoint(x: px, y: py)); x = px; y = py
      case 76: // L
        guard let px = number(), let py = number() else { return nil }
        path.addLine(to: CGPoint(x: px, y: py)); x = px; y = py
      case 72: // H
        guard let px = number() else { return nil }
        path.addLine(to: CGPoint(x: px, y: y)); x = px
      case 86: // V
        guard let py = number() else { return nil }
        path.addLine(to: CGPoint(x: x, y: py)); y = py
      case 90, 122: // Z
        path.closeSubpath()
        x = path.currentPoint.x; y = path.currentPoint.y
      default: return nil
      }
    }
    return path
  }
}

final class BloomAvatarTrack {
  let fill: UIColor, fillOpacity: CGFloat, stroke: UIColor?, strokeWidth: CGFloat
  let opacity: [CGFloat], d: [CGPath], clip: [CGPath]?
  init(fill: UIColor, fillOpacity: CGFloat, stroke: UIColor?, strokeWidth: CGFloat, opacity: [CGFloat], d: [CGPath], clip: [CGPath]?) {
    self.fill = fill; self.fillOpacity = fillOpacity; self.stroke = stroke; self.strokeWidth = strokeWidth
    self.opacity = opacity; self.d = d; self.clip = clip
  }
}

final class BloomAvatarLoop {
  let duration: Double, length: Int, viewBox: CGRect, tracks: [BloomAvatarTrack], cost: Int
  init(duration: Double, length: Int, viewBox: CGRect, tracks: [BloomAvatarTrack], cost: Int) {
    self.duration = duration; self.length = length; self.viewBox = viewBox; self.tracks = tracks; self.cost = cost
  }
  /// The frame a loop clock reads at `seconds` (`vectorLoopIndex` in vector-loop.ts).
  func index(_ seconds: Double) -> Int {
    guard duration > 0 else { return 0 }
    let elapsed = (seconds.truncatingRemainder(dividingBy: duration) + duration).truncatingRemainder(dividingBy: duration)
    return max(0, min(length - 1, Int((elapsed / duration * Double(length)).rounded(.down))))
  }
}

func bloomAvatarColor(_ value: Any?) -> UIColor? {
  guard let number = value as? NSNumber else { return nil }
  let argb = UInt32(truncatingIfNeeded: number.int64Value)
  return UIColor(red: CGFloat((argb >> 16) & 0xff) / 255, green: CGFloat((argb >> 8) & 0xff) / 255,
                 blue: CGFloat(argb & 0xff) / 255, alpha: CGFloat(argb >> 24) / 255)
}

/// The rest loops this process has: in memory while in use, and on disk (the caches directory) as
/// JS handed them over, keyed by `vectorLoopKey`. The on-disk form is the props JS sent, as JSON.
final class BloomAvatarLoops {
  static let shared = BloomAvatarLoops()
  private let queue = DispatchQueue(label: "so.oxy.bloom.avatar-loops")
  private let memory = NSCache<NSString, BloomAvatarLoop>()
  private var waiting: [String: [(BloomAvatarLoop?) -> Void]] = [:]
  private let directory: URL

  private init() {
    memory.totalCostLimit = 24 << 20
    directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("bloom-avatar-loops", isDirectory: true)
  }

  static func validKey(_ key: String) -> Bool {
    !key.isEmpty && key.count <= 64 && key.allSatisfy { $0.isASCII && ($0.isNumber || $0.isLowercase) }
  }

  func get(_ key: String, _ done: @escaping (BloomAvatarLoop?) -> Void) {
    if let loop = memory.object(forKey: key as NSString) { done(loop); return }
    guard enqueue(key, done) else { return }
    let file = directory.appendingPathComponent("\(key).json")
    queue.async {
      let loop = (try? Data(contentsOf: file))
        .flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        .flatMap(Self.build)
      DispatchQueue.main.async { self.finish(key, loop) }
    }
  }

  func put(_ key: String, _ tracks: [String: Any], _ done: @escaping (BloomAvatarLoop?) -> Void) {
    if let loop = memory.object(forKey: key as NSString) { done(loop); return }
    guard enqueue(key, done) else { return }
    let file = directory.appendingPathComponent("\(key).json")
    let directory = self.directory
    queue.async {
      let loop = Self.build(tracks)
      DispatchQueue.main.async { self.finish(key, loop) }
      guard loop != nil, let data = try? JSONSerialization.data(withJSONObject: tracks) else { return }
      try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
      try? data.write(to: file, options: .atomic)
    }
  }

  private func enqueue(_ key: String, _ done: @escaping (BloomAvatarLoop?) -> Void) -> Bool {
    if waiting[key] != nil { waiting[key]!.append(done); return false }
    waiting[key] = [done]
    return true
  }

  private func finish(_ key: String, _ loop: BloomAvatarLoop?) {
    if let loop { memory.setObject(loop, forKey: key as NSString, cost: loop.cost) }
    waiting.removeValue(forKey: key)?.forEach { $0(loop) }
  }

  static func build(_ map: [String: Any]) -> BloomAvatarLoop? {
    guard let duration = (map["duration"] as? NSNumber)?.doubleValue,
          let length = (map["length"] as? NSNumber)?.intValue,
          let box = map["viewBox"] as? [NSNumber], box.count == 4,
          let paths = map["paths"] as? [[String: Any]] else { return nil }
    var cost = 0
    var tracks: [BloomAvatarTrack] = []
    for path in paths {
      guard let fill = bloomAvatarColor(path["fill"]),
            let opacity = (path["opacity"] as? [NSNumber])?.map({ CGFloat($0.doubleValue) }),
            let d = (path["d"] as? [String]).map({ $0.compactMap(BloomAvatarPathData.parse) }),
            opacity.count == length, d.count == length else { return nil }
      let clip = (path["clip"] as? [String]).map { $0.compactMap(BloomAvatarPathData.parse) }
      if let clip, clip.count != length { return nil }
      cost += ((path["d"] as? [String]) ?? []).reduce(0) { $0 + $1.utf8.count }
      let stroke = bloomAvatarColor(path["stroke"])
      tracks.append(BloomAvatarTrack(
        fill: fill, fillOpacity: CGFloat((path["fillOpacity"] as? NSNumber)?.doubleValue ?? 1),
        stroke: stroke, strokeWidth: CGFloat((path["strokeWidth"] as? NSNumber)?.doubleValue ?? 0),
        opacity: opacity, d: d, clip: clip))
    }
    let viewBox = CGRect(x: box[0].doubleValue, y: box[1].doubleValue, width: box[2].doubleValue, height: box[3].doubleValue)
    return BloomAvatarLoop(duration: duration, length: length, viewBox: viewBox, tracks: tracks, cost: cost)
  }
}

@objc(BloomAvatarSurfaceView)
final class BloomAvatarSurfaceView: UIView {
  @objc var frameData: NSDictionary?
  @objc var loopKey: NSString?
  @objc var loopTracks: NSDictionary?
  @objc var loopClock: NSDictionary?
  @objc var capture: Double = 0
  @objc var onLoop: RCTDirectEventBlock?
  @objc var onCapture: RCTDirectEventBlock?

  private struct Drawn { let viewBox: CGRect; let opacity: Float
    let paths: [(d: CGPath, clip: CGPath?, fill: UIColor, fillAlpha: CGFloat, stroke: UIColor?, strokeAlpha: CGFloat, strokeWidth: CGFloat)] }

  private let content = CALayer()
  private var shownFrame: NSDictionary?
  private var key: String?
  private var loop: BloomAvatarLoop?
  private var request = 0
  private var clock: (epoch: Double, time: Double)?
  private var loopIndex = -1
  private var showLoop = false
  private var lastCapture: Double = 0
  private var link: CADisplayLink?

  override init(frame: CGRect) {
    super.init(frame: frame)
    isUserInteractionEnabled = false
    isAccessibilityElement = false
    layer.addSublayer(content)
  }
  required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }

  /// Called by React Native once a transaction's props are set.
  @objc func didSetProps(_ changedProps: [String]) {
    if frameData !== shownFrame {
      shownFrame = frameData
      if loopClock == nil { showLoop = false }
    }
    let requested = (loopKey as String?).flatMap { BloomAvatarLoops.validKey($0) ? $0 : nil }
    if requested != key {
      key = requested; loop = nil; request += 1
      if let requested { resolve(requested) }
    } else if let requested, loop == nil, loopTracks != nil {
      resolve(requested)
    }
    let wasPlaying = clock != nil
    if let map = loopClock, let epoch = (map["epoch"] as? NSNumber)?.doubleValue, let time = (map["time"] as? NSNumber)?.doubleValue {
      clock = (epoch, time)
      showLoop = true
      if !wasPlaying { loopIndex = -1 }
    } else { clock = nil }
    if capture != lastCapture {
      lastCapture = capture
      if capture != 0 { emitCapture(capture) }
    }
    schedule()
    redraw()
  }

  private func resolve(_ requested: String) {
    let generation = request
    let done: (BloomAvatarLoop?) -> Void = { [weak self] found in
      guard let self, generation == self.request else { return }
      self.loop = found
      self.onLoop?(["key": requested, "ready": found != nil])
      self.schedule()
      self.redraw()
    }
    if let tracks = loopTracks as? [String: Any] { BloomAvatarLoops.shared.put(requested, tracks, done) }
    else { BloomAvatarLoops.shared.get(requested, done) }
  }

  private func schedule() {
    let run = clock != nil && loop != nil && window != nil && !isHidden
    if run, link == nil {
      let link = CADisplayLink(target: self, selector: #selector(tick(_:)))
      link.add(to: .main, forMode: .common)
      self.link = link
    } else if !run {
      link?.invalidate()
      link = nil
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    schedule()
  }

  /// `epoch` is a `performance.now()` reading; on iOS that is the same mach clock as CACurrentMediaTime.
  @objc private func tick(_ link: CADisplayLink) {
    guard let loop, let clock else { schedule(); return }
    let index = loop.index(clock.time + (link.timestamp * 1000 - clock.epoch) / 1000)
    if index != loopIndex { loopIndex = index; redraw() }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    content.frame = bounds
    redraw()
  }

  private func drawn() -> Drawn? {
    if showLoop, let loop {
      if loopIndex < 0, let clock { loopIndex = loop.index(clock.time + (CACurrentMediaTime() * 1000 - clock.epoch) / 1000) }
      let index = max(0, min(loop.length - 1, loopIndex))
      return Drawn(viewBox: loop.viewBox, opacity: 1, paths: loop.tracks.map { track in
        (track.d[index], track.clip?[index], track.fill, track.opacity[index] * track.fillOpacity,
         track.stroke, track.opacity[index], track.strokeWidth)
      })
    }
    guard let map = shownFrame, let box = map["viewBox"] as? [NSNumber], box.count == 4,
          let paths = map["paths"] as? [[String: Any]] else { return nil }
    return Drawn(
      viewBox: CGRect(x: box[0].doubleValue, y: box[1].doubleValue, width: box[2].doubleValue, height: box[3].doubleValue),
      opacity: Float((map["opacity"] as? NSNumber)?.doubleValue ?? 1),
      paths: paths.compactMap { path in
        guard let d = (path["d"] as? String).flatMap(BloomAvatarPathData.parse), let fill = bloomAvatarColor(path["fill"]) else { return nil }
        let opacity = CGFloat((path["opacity"] as? NSNumber)?.doubleValue ?? 1)
        return (d, (path["clip"] as? String).flatMap(BloomAvatarPathData.parse), fill,
                opacity * CGFloat((path["fillOpacity"] as? NSNumber)?.doubleValue ?? 1),
                bloomAvatarColor(path["stroke"]), opacity, CGFloat((path["strokeWidth"] as? NSNumber)?.doubleValue ?? 0))
      })
  }

  private func redraw() {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    defer { CATransaction.commit() }
    guard let shown = drawn(), shown.viewBox.width > 0, shown.viewBox.height > 0 else {
      content.sublayers = nil
      return
    }
    // xMidYMid meet, as an <Svg viewBox> fills its box.
    let scale = min(bounds.width / shown.viewBox.width, bounds.height / shown.viewBox.height)
    content.sublayerTransform = CATransform3DMakeAffineTransform(
      CGAffineTransform(translationX: (bounds.width - shown.viewBox.width * scale) / 2 - shown.viewBox.minX * scale,
                        y: (bounds.height - shown.viewBox.height * scale) / 2 - shown.viewBox.minY * scale)
        .scaledBy(x: scale, y: scale))
    content.opacity = shown.opacity
    var layers = content.sublayers ?? []
    while layers.count < shown.paths.count {
      let holder = CALayer()
      holder.addSublayer(CAShapeLayer())
      content.addSublayer(holder)
      layers.append(holder)
    }
    for (index, holder) in layers.enumerated() {
      guard index < shown.paths.count else { holder.isHidden = true; continue }
      let path = shown.paths[index]
      holder.isHidden = false
      let shape = holder.sublayers![0] as! CAShapeLayer
      shape.path = path.d
      shape.fillRule = .nonZero
      shape.fillColor = path.fill.withAlphaComponent(path.fill.cgColor.alpha * path.fillAlpha).cgColor
      shape.strokeColor = path.stroke?.withAlphaComponent(path.strokeAlpha).cgColor
      shape.lineWidth = path.stroke == nil ? 0 : path.strokeWidth
      shape.lineCap = .butt
      shape.lineJoin = .miter
      shape.miterLimit = 4
      if let clip = path.clip {
        let mask = (holder.mask as? CAShapeLayer) ?? CAShapeLayer()
        mask.path = clip
        mask.fillRule = .nonZero
        holder.mask = mask
      } else { holder.mask = nil }
    }
  }

  private func emitCapture(_ id: Double) {
    let image = UIGraphicsImageRenderer(bounds: bounds).image { context in layer.render(in: context.cgContext) }
    onCapture?(["id": id, "data": image.pngData()?.base64EncodedString() ?? NSNull()])
  }
}
