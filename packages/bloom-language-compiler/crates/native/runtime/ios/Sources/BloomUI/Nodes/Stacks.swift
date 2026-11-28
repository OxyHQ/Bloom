// `VStack`, `HStack`, `ZStack`: Bloom's stacks (React Native's flex column and row, gap 0 and
// children stretched by default), on BloomFlexLayout.
#if canImport(SwiftUI)
import SwiftUI

public struct VStack<Content: View>: View {
  var align: Tokens.Alignment
  var gap: Double
  var justification: Tokens.Justify = .start
  let content: Content

  public init(alignment: Tokens.Alignment = .stretch, spacing: Tokens.Space = .none, @ViewBuilder content: () -> Content) {
    self.align = alignment
    self.gap = spacing.value
    self.content = content()
  }

  /// `spacing: "3"`: points.
  public init(alignment: Tokens.Alignment = .stretch, spacing points: Double, @ViewBuilder content: () -> Content) {
    self.align = alignment
    self.gap = points
    self.content = content()
  }

  public var body: some View {
    BloomFlexLayout(axis: .vertical, gap: CGFloat(gap), align: BloomCrossAlign(align), justify: BloomJustify(justification)) {
      content
    }
  }

  public func spacing(_ space: Tokens.Space) -> Self { var c = self; c.gap = space.value; return c }
  public func spacing(_ points: Double) -> Self { var c = self; c.gap = points; return c }
  public func align(_ alignment: Tokens.Alignment) -> Self { var c = self; c.align = alignment; return c }
  public func justify(_ j: Tokens.Justify) -> Self { var c = self; c.justification = j; return c }
}

public struct HStack<Content: View>: View {
  var align: Tokens.Alignment
  var gap: Double
  var justification: Tokens.Justify = .start
  let content: Content

  public init(alignment: Tokens.Alignment = .stretch, spacing: Tokens.Space = .none, @ViewBuilder content: () -> Content) {
    self.align = alignment
    self.gap = spacing.value
    self.content = content()
  }

  /// `spacing: "3"`: points.
  public init(alignment: Tokens.Alignment = .stretch, spacing points: Double, @ViewBuilder content: () -> Content) {
    self.align = alignment
    self.gap = points
    self.content = content()
  }

  public var body: some View {
    BloomFlexLayout(axis: .horizontal, gap: CGFloat(gap), align: BloomCrossAlign(align), justify: BloomJustify(justification)) {
      content
    }
  }

  public func spacing(_ space: Tokens.Space) -> Self { var c = self; c.gap = space.value; return c }
  public func spacing(_ points: Double) -> Self { var c = self; c.gap = points; return c }
  public func align(_ alignment: Tokens.Alignment) -> Self { var c = self; c.align = alignment; return c }
  public func justify(_ j: Tokens.Justify) -> Self { var c = self; c.justification = j; return c }
}

/// Children drawn over one another, aligned in the stack.
public struct ZStack<Content: View>: View {
  var alignment: SwiftUI.Alignment
  let content: Content

  public init(alignment: Tokens.Anchor = .center, @ViewBuilder content: () -> Content) {
    self.alignment = alignment.swift
    self.content = content()
  }

  public var body: some View {
    SwiftUI.ZStack(alignment: alignment) { content }
  }
}

extension BloomJustify {
  init(_ token: Tokens.Justify) {
    switch token {
    case .start: self = .start
    case .center: self = .center
    case .end: self = .end
    case .between: self = .spaceBetween
    case .around: self = .spaceAround
    case .evenly: self = .spaceEvenly
    }
  }
}

extension Tokens.Anchor {
  var swift: SwiftUI.Alignment {
    switch self {
    case .center: .center
    case .top: .top
    case .bottom: .bottom
    case .leading: .leading
    case .trailing: .trailing
    case .topLeading: .topLeading
    case .topTrailing: .topTrailing
    case .bottomLeading: .bottomLeading
    case .bottomTrailing: .bottomTrailing
    }
  }
}

/// A line between views: 1 pt of `input` (`borderLight`), full width; vertical in a row.
public struct Divider: View {
  @Environment(\.bloomPalette) private var palette
  public init() {}
  public var body: some View {
    Rectangle().fill(palette.color(.input)).frame(height: 1).frame(maxWidth: .infinity)
  }
}
#endif
