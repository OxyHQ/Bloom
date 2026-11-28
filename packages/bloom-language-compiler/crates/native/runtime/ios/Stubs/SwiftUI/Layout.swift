// The Layout protocol (iOS 16), with the SDK's signatures.
import Foundation

public struct ProposedViewSize: Equatable, Sendable {
  public var width: CGFloat?
  public var height: CGFloat?
  public init(width: CGFloat?, height: CGFloat?) { self.width = width; self.height = height }
  public init(_ size: CGSize) { self.width = size.width; self.height = size.height }
  public static let zero = ProposedViewSize(width: 0, height: 0)
  public static let unspecified = ProposedViewSize(width: nil, height: nil)
  public static let infinity = ProposedViewSize(width: .infinity, height: .infinity)
  public func replacingUnspecifiedDimensions(by size: CGSize = CGSize(width: 10, height: 10)) -> CGSize {
    CGSize(width: width ?? size.width, height: height ?? size.height)
  }
}

public struct ViewDimensions {
  public var width: CGFloat { 0 }
  public var height: CGFloat { 0 }
  public subscript(guide: HorizontalAlignment) -> CGFloat { 0 }
  public subscript(guide: VerticalAlignment) -> CGFloat { 0 }
  public subscript(explicit guide: VerticalAlignment) -> CGFloat? { nil }
}

public protocol LayoutValueKey {
  associatedtype Value
  static var defaultValue: Self.Value { get }
}

public struct LayoutSubview: Equatable {
  public static func == (a: LayoutSubview, b: LayoutSubview) -> Bool { true }
  public func sizeThatFits(_ proposal: ProposedViewSize) -> CGSize { .zero }
  public func dimensions(in proposal: ProposedViewSize) -> ViewDimensions { ViewDimensions() }
  public subscript<K: LayoutValueKey>(key: K.Type) -> K.Value { K.defaultValue }
  public var priority: Double { 0 }
  public func place(at position: CGPoint, anchor: UnitPoint = .topLeading, proposal: ProposedViewSize) {}
}

public struct LayoutSubviews: RandomAccessCollection, Equatable {
  public typealias Element = LayoutSubview
  public typealias Index = Int
  public var startIndex: Int { 0 }
  public var endIndex: Int { 0 }
  public subscript(index: Int) -> LayoutSubview { LayoutSubview() }
}

public protocol Animatable {}

public protocol Layout: Animatable {
  associatedtype Cache = Void
  typealias Subviews = LayoutSubviews
  func sizeThatFits(proposal: ProposedViewSize, subviews: Self.Subviews, cache: inout Self.Cache) -> CGSize
  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Self.Subviews, cache: inout Self.Cache)
  func makeCache(subviews: Self.Subviews) -> Self.Cache
}
extension Layout where Cache == Void {
  public func makeCache(subviews: Self.Subviews) -> Void { () }
}
public struct _LayoutRoot<L: Layout, Content: View>: _PrimitiveView {}
extension Layout {
  public func callAsFunction<V: View>(@ViewBuilder _ content: () -> V) -> some View { _LayoutRoot<Self, V>() }
}
extension View {
  public func layoutValue<K: LayoutValueKey>(key: K.Type, value: K.Value) -> some View { self }
}
