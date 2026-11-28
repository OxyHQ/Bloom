// Port of src/theme/color-engine/generate-role-colors.ts: any seed to the full role set.
import Foundation

/// A small bounded memo, safe to share across threads. Every cached function here is pure, so a
/// cache changes cost, never results (the TypeScript caches the same functions the same way).
final class BoundedCache<Key: Hashable & Sendable, Value: Sendable>: @unchecked Sendable {
  private let lock = NSLock()
  private var values: [Key: Value] = [:]
  private var order: [Key] = []
  private let limit: Int

  init(limit: Int) { self.limit = limit }

  func value(_ key: Key, solve: () -> Value) -> Value {
    lock.lock()
    if let hit = values[key] {
      lock.unlock()
      return hit
    }
    lock.unlock()
    let solved = solve()
    lock.lock()
    defer { lock.unlock() }
    if values[key] == nil {
      values[key] = solved
      order.append(key)
      if order.count > limit { values[order.removeFirst()] = nil }
    }
    return solved
  }
}

/// `RoleColors`: every role as an `rgb(r g b)` string.
public struct RoleColors: Sendable, Hashable {
  private let values: [RoleName: String]

  init(_ values: [RoleName: String]) { self.values = values }

  public subscript(role: RoleName) -> String { values[role]! }

  /// In `RoleName` order, as the TypeScript record iterates.
  public var ordered: [(RoleName, String)] { RoleName.allCases.map { ($0, values[$0]!) } }
}

/// `GenerateOptions`.
public struct GenerateOptions: Sendable, Hashable {
  /// The seed, `#rrggbb`.
  public var seed: String
  public var variant: SchemeVariant?
  public var isDark: Bool
  /// −1 (low) … 0 (normal) … 1 (high).
  public var contrastLevel: Double?
  public var secondarySeed: String?
  public var tertiarySeed: String?

  public init(
    seed: String, variant: SchemeVariant? = nil, isDark: Bool = false, contrastLevel: Double? = nil,
    secondarySeed: String? = nil, tertiarySeed: String? = nil
  ) {
    self.seed = seed
    self.variant = variant
    self.isDark = isDark
    self.contrastLevel = contrastLevel
    self.secondarySeed = secondarySeed
    self.tertiarySeed = tertiarySeed
  }
}

private let roleCache = BoundedCache<String, RoleColors>(limit: 128)

/// `generateRoleColors`: the dynamic-theming entry point.
public func generateRoleColors(_ opts: GenerateOptions) -> RoleColors {
  let key = [
    opts.seed.lowercased(), (opts.variant ?? .vibrant).rawValue, opts.isDark ? "1" : "0",
    jsNumberString(opts.contrastLevel ?? 0), opts.secondarySeed?.lowercased() ?? "",
    opts.tertiarySeed?.lowercased() ?? "",
  ].joined(separator: "|")
  return roleCache.value(key) { solveRoleColors(opts) }
}

/// `rgb(r g b)`, the form every engine colour is written in.
func rgbString(_ argb: ARGB) -> String {
  "rgb(\(redFromArgb(argb)) \(greenFromArgb(argb)) \(blueFromArgb(argb)))"
}

private func solveRoleColors(_ opts: GenerateOptions) -> RoleColors {
  let scheme = buildScheme(
    opts.variant ?? .vibrant, .fromInt(argbFromHex(opts.seed)), opts.isDark,
    opts.contrastLevel ?? 0,
    AccentSources(
      secondarySource: opts.secondarySeed.map { .fromInt(argbFromHex($0)) },
      tertiarySource: opts.tertiarySeed.map { .fromInt(argbFromHex($0)) }))
  var out: [RoleName: String] = [:]
  for name in RoleName.allCases { out[name] = rgbString(name.argb(in: scheme)) }
  return RoleColors(out)
}
