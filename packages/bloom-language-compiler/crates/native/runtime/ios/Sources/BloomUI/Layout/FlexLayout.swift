// Bloom's stacks on SwiftUI, laid out as React Native lays them out (Yoga), not as SwiftUI's
// stacks do: today's Bloom is flexbox, and pixel parity is with today.
//
// | Bloom (React Native) | SwiftUI's own stacks | here |
// |---|---|---|
// | children `alignItems: stretch` by default | centred, hugging | stretch by default |
// | `gap` 0 by default | a platform spacing (~8) | 0 by default |
// | `.grow()`: `flex: 1` (grow 1, shrink 1, basis 0) | `Spacer`/`frame(maxWidth:)` | grow from basis 0 |
// | `.shrink(.normal)`: `flexShrink: 1`; RN's default shrink is 0 | everything compresses | only a child that shrinks does |
// | `width: '100%'` (`.frame(width: .full)`) | `frame(maxWidth: .infinity)` | the parent's whole cross size |
// | `justifyContent: flex-start` | centred in a larger frame | start |
//
// A stack reports, on its cross axis, the size it is proposed when that is finite (a
// stretched child takes its parent's width), and its content's otherwise; on its main axis, its
// content's, or the proposal when a child grows into it. A parent that aligns its children
// anywhere but `stretch` first asks a child its ideal size and proposes `min(ideal, room)`:
// React Native's fit-content.
#if canImport(SwiftUI)
import SwiftUI

/// How a stack places its children across (`align`).
public enum BloomCrossAlign: Sendable { case start, center, end, stretch, baseline }

/// How a stack distributes free room along (`justify`).
public enum BloomJustify: Sendable { case start, center, end, spaceBetween, spaceAround, spaceEvenly }

/// A child's flex factors, set by `.bloomGrow()` / `.bloomShrink()` / `.bloomFrame(width: .full)`.
public struct BloomFlex: Sendable, Equatable {
  public var grow: Double = 0
  public var shrink: Double = 0
  /// `flex: 1` sets the basis to 0: the child's main size is only what it grows into.
  public var zeroBasis = false
  /// `width: 100%` (main axis of a row, cross of a column) / `height: 100%`.
  public var fullWidth = false
  public var fullHeight = false
  /// `alignSelf`, overriding the parent's `align`.
  public var alignSelf: BloomCrossAlign? = nil
  public init() {}
}

struct BloomFlexKey: LayoutValueKey {
  static let defaultValue = BloomFlex()
}

/// Yoga's row and column, the subset Bloom's stacks use.
public struct BloomFlexLayout: Layout {
  public var axis: Axis
  public var gap: CGFloat
  public var align: BloomCrossAlign
  public var justify: BloomJustify

  public init(axis: Axis, gap: CGFloat = 0, align: BloomCrossAlign = .stretch, justify: BloomJustify = .start) {
    self.axis = axis
    self.gap = gap
    self.align = align
    self.justify = justify
  }

  public struct Cache {
    var lines: [Line] = []
    var key: Key? = nil
  }

  struct Key: Equatable, Sendable {
    var main: CGFloat?
    var cross: CGFloat?
  }

  /// One child's resolved main and cross sizes.
  struct Line {
    var main: CGFloat
    var cross: CGFloat
  }

  public func makeCache(subviews: Subviews) -> Cache { Cache() }

  private func main(_ p: ProposedViewSize) -> CGFloat? { axis == .vertical ? p.height : p.width }
  private func cross(_ p: ProposedViewSize) -> CGFloat? { axis == .vertical ? p.width : p.height }
  private func propose(main: CGFloat?, cross: CGFloat?) -> ProposedViewSize {
    axis == .vertical ? ProposedViewSize(width: cross, height: main) : ProposedViewSize(width: main, height: cross)
  }
  private func size(main: CGFloat, cross: CGFloat) -> CGSize {
    axis == .vertical ? CGSize(width: cross, height: main) : CGSize(width: main, height: cross)
  }
  private func mainOf(_ s: CGSize) -> CGFloat { axis == .vertical ? s.height : s.width }
  private func crossOf(_ s: CGSize) -> CGFloat { axis == .vertical ? s.width : s.height }

  private func finite(_ v: CGFloat?) -> CGFloat? {
    guard let v, v.isFinite else { return nil }
    return v
  }

  private func alignment(of child: LayoutSubview) -> BloomCrossAlign {
    child[BloomFlexKey.self].alignSelf ?? align
  }

  private func isFullCross(_ flex: BloomFlex) -> Bool { axis == .vertical ? flex.fullWidth : flex.fullHeight }
  private func isFullMain(_ flex: BloomFlex) -> Bool { axis == .vertical ? flex.fullHeight : flex.fullWidth }

  /// The cross size a child is given: the whole room when it stretches (or is `100%`), its
  /// fit-content size otherwise.
  private func crossProposal(_ child: LayoutSubview, room: CGFloat?, main: CGFloat?) -> CGFloat? {
    guard let room else { return nil }
    let flex = child[BloomFlexKey.self]
    if alignment(of: child) == .stretch || isFullCross(flex) { return room }
    let ideal = crossOf(child.sizeThatFits(propose(main: main, cross: nil)))
    return min(ideal, room)
  }

  /// Resolves every child's main and cross size for the room proposed (Yoga's algorithm, one
  /// line, no wrap).
  func resolve(_ proposal: ProposedViewSize, _ children: Subviews) -> [Line] {
    let mainRoom = finite(main(proposal))
    let crossRoom = finite(cross(proposal))
    let gaps = gap * CGFloat(max(0, children.count - 1))
    // 1. Each child's basis: its content's main size at its cross size (0 under `flex: 1`).
    var basis: [CGFloat] = []
    var crosses: [CGFloat?] = []
    for child in children {
      let flex = child[BloomFlexKey.self]
      let c = crossProposal(child, room: crossRoom, main: nil)
      crosses.append(c)
      // `flex: 1` with no room to grow into (a scroll's content): the content's size, where Yoga
      // would collapse the child to 0 and let it overflow.
      if flex.zeroBasis && mainRoom != nil {
        basis.append(0)
      } else if isFullMain(flex), let mainRoom {
        basis.append(mainRoom)
      } else {
        basis.append(mainOf(child.sizeThatFits(propose(main: nil, cross: c))))
      }
    }
    // 2. The free room, grown into or shrunk out of.
    var mains = basis
    if let mainRoom {
      let free = mainRoom - gaps - basis.reduce(0, +)
      if free > 0 {
        let grows = children.map { $0[BloomFlexKey.self].grow }
        let total = grows.reduce(0, +)
        if total > 0 {
          for i in mains.indices where grows[i] > 0 { mains[i] += free * grows[i] / total }
        }
      } else if free < 0 {
        // Yoga scales each child's shrink by its basis.
        let weights = children.indices.map { children[$0][BloomFlexKey.self].shrink * basis[$0] }
        let total = weights.reduce(0, +)
        if total > 0 {
          for i in mains.indices where weights[i] > 0 { mains[i] = max(0, mains[i] + free * weights[i] / total) }
        }
      }
    }
    // 3. Each child's cross size at its resolved main size.
    var lines: [Line] = []
    for (i, child) in children.enumerated() {
      let flex = child[BloomFlexKey.self]
      let measured = child.sizeThatFits(propose(main: mains[i], cross: crosses[i]))
      var c = crossOf(measured)
      if let room = crossRoom, alignment(of: child) == .stretch || isFullCross(flex) { c = room }
      // A child that did not grow or shrink keeps the main size it measured at its cross.
      let m = mains[i] == basis[i] && !flex.zeroBasis && !isFullMain(flex) ? mainOf(measured) : mains[i]
      lines.append(Line(main: m, cross: c))
    }
    return lines
  }

  public func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache) -> CGSize {
    let lines = resolve(proposal, subviews)
    cache.lines = lines
    cache.key = Key(main: main(proposal), cross: cross(proposal))
    let gaps = gap * CGFloat(max(0, subviews.count - 1))
    let content = lines.map(\.main).reduce(0, +) + gaps
    let grows = subviews.contains { $0[BloomFlexKey.self].grow > 0 }
    let mainSize = (grows || justify != .start) ? (finite(main(proposal)) ?? content) : content
    let crossContent = lines.map(\.cross).max() ?? 0
    let crossSize = finite(cross(proposal)) ?? crossContent
    return size(main: mainSize, cross: crossSize)
  }

  public func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache) {
    let placed = ProposedViewSize(bounds.size)
    let lines = cache.key == Key(main: main(placed), cross: cross(placed)) && cache.lines.count == subviews.count
      ? cache.lines : resolve(placed, subviews)
    let mainExtent = mainOf(bounds.size)
    let crossExtent = crossOf(bounds.size)
    let content = lines.map(\.main).reduce(0, +) + gap * CGFloat(max(0, subviews.count - 1))
    let free = max(0, mainExtent - content)
    let n = CGFloat(subviews.count)
    var cursor: CGFloat
    var between = gap
    switch justify {
    case .start: cursor = 0
    case .center: cursor = free / 2
    case .end: cursor = free
    case .spaceBetween:
      cursor = 0
      if n > 1 { between += free / (n - 1) }
    case .spaceAround:
      cursor = n > 0 ? free / n / 2 : 0
      between += n > 0 ? free / n : 0
    case .spaceEvenly:
      cursor = free / (n + 1)
      between += free / (n + 1)
    }
    let origin = axis == .vertical ? (bounds.minY, bounds.minX) : (bounds.minX, bounds.minY)
    for (i, child) in subviews.enumerated() {
      let line = lines[i]
      let offset: CGFloat = switch alignment(of: child) {
      case .start, .stretch, .baseline: 0
      case .center: (crossExtent - line.cross) / 2
      case .end: crossExtent - line.cross
      }
      let point = axis == .vertical
        ? CGPoint(x: origin.1 + offset, y: origin.0 + cursor)
        : CGPoint(x: origin.0 + cursor, y: origin.1 + offset)
      child.place(at: point, anchor: .topLeading, proposal: propose(main: line.main, cross: line.cross))
      cursor += line.main + between
    }
  }
}

extension BloomCrossAlign {
  init(_ token: Tokens.Alignment) {
    switch token {
    case .start: self = .start
    case .center: self = .center
    case .end: self = .end
    case .stretch: self = .stretch
    case .baseline: self = .baseline
    }
  }
}
#endif
