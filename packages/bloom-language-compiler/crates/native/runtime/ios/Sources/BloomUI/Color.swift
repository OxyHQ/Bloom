// A colour as `.bloom` writes one: a role (`.muted`), at an opacity (`.primary.opacity(0.1)`).
// The value is the theme's, resolved where it is drawn (Theme.swift); never a constant here.

public struct BloomColor: Sendable, Hashable {
  public var role: Tokens.Color
  public var opacity: Double?

  public init(_ role: Tokens.Color, opacity: Double? = nil) {
    self.role = role
    self.opacity = opacity
  }

  /// The role at `opacity` (0…1).
  public func opacity(_ opacity: Double) -> BloomColor { BloomColor(role, opacity: opacity) }
}
