// A type-checking stand-in for SwiftUI on Linux, where SwiftUI does not exist.
//
// It declares, with Apple's signatures, the part of SwiftUI that BloomUI and the Swift
// backend's output use, so `scripts/typecheck-swift.sh` can type-check both on a machine
// without Xcode. It draws nothing and is never linked into an app: on Apple platforms the
// real SwiftUI is imported. When BloomUI starts using an API not declared here, declare it
// here with the SDK's signature (from the Xcode SDK's SwiftUI.swiftinterface), never a
// looser one: a looser stub lets through code the real SDK rejects. Availability
// annotations are kept so the iOS 26 paths read as they do in the SDK. SwiftUI re-exports
// CoreGraphics (`CGFloat`, `CGRect`); on Linux those are Foundation's, so it re-exports that.
//
// What this does NOT prove: layout, drawing, the real overload resolution of SwiftUI's
// thousands of members, or the Apple SDK's concurrency annotations in full. The Mac lane
// (ADR 0003, "iOS") builds against the real SDK.

@_exported import Foundation

// ---- geometry ------------------------------------------------------------------------

public struct Angle: Sendable, Equatable {
  public var radians: Double
  public init(radians: Double) { self.radians = radians }
  public init(degrees: Double) { self.radians = degrees * .pi / 180 }
  public static func degrees(_ d: Double) -> Angle { Angle(degrees: d) }
  public static func radians(_ r: Double) -> Angle { Angle(radians: r) }
  public static let zero = Angle(radians: 0)
}

public struct UnitPoint: Sendable, Hashable {
  public var x: CGFloat
  public var y: CGFloat
  public init(x: CGFloat, y: CGFloat) { self.x = x; self.y = y }
  public static let zero = UnitPoint(x: 0, y: 0)
  public static let center = UnitPoint(x: 0.5, y: 0.5)
  public static let leading = UnitPoint(x: 0, y: 0.5)
  public static let trailing = UnitPoint(x: 1, y: 0.5)
  public static let top = UnitPoint(x: 0.5, y: 0)
  public static let bottom = UnitPoint(x: 0.5, y: 1)
  public static let topLeading = UnitPoint(x: 0, y: 0)
  public static let topTrailing = UnitPoint(x: 1, y: 0)
  public static let bottomLeading = UnitPoint(x: 0, y: 1)
  public static let bottomTrailing = UnitPoint(x: 1, y: 1)
}

public enum Edge: Int8, Sendable, CaseIterable {
  case top, leading, bottom, trailing
  public struct Set: OptionSet, Sendable {
    public let rawValue: Int8
    public init(rawValue: Int8) { self.rawValue = rawValue }
    public init(_ e: Edge) { self.rawValue = 1 << e.rawValue }
    public static let top = Set(.top)
    public static let leading = Set(.leading)
    public static let bottom = Set(.bottom)
    public static let trailing = Set(.trailing)
    public static let all: Set = [.top, .leading, .bottom, .trailing]
    public static let horizontal: Set = [.leading, .trailing]
    public static let vertical: Set = [.top, .bottom]
  }
}

public struct EdgeInsets: Sendable, Equatable {
  public var top: CGFloat, leading: CGFloat, bottom: CGFloat, trailing: CGFloat
  public init(top: CGFloat, leading: CGFloat, bottom: CGFloat, trailing: CGFloat) {
    self.top = top; self.leading = leading; self.bottom = bottom; self.trailing = trailing
  }
  public init() { self.init(top: 0, leading: 0, bottom: 0, trailing: 0) }
}

public struct HorizontalAlignment: Sendable, Equatable {
  let id: Int
  public static let leading = HorizontalAlignment(id: 0)
  public static let center = HorizontalAlignment(id: 1)
  public static let trailing = HorizontalAlignment(id: 2)
}

public struct VerticalAlignment: Sendable, Equatable {
  let id: Int
  public static let top = VerticalAlignment(id: 0)
  public static let center = VerticalAlignment(id: 1)
  public static let bottom = VerticalAlignment(id: 2)
  public static let firstTextBaseline = VerticalAlignment(id: 3)
  public static let lastTextBaseline = VerticalAlignment(id: 4)
}

public struct Alignment: Sendable, Equatable {
  public var horizontal: HorizontalAlignment
  public var vertical: VerticalAlignment
  public init(horizontal: HorizontalAlignment, vertical: VerticalAlignment) {
    self.horizontal = horizontal; self.vertical = vertical
  }
  public static let center = Alignment(horizontal: .center, vertical: .center)
  public static let leading = Alignment(horizontal: .leading, vertical: .center)
  public static let trailing = Alignment(horizontal: .trailing, vertical: .center)
  public static let top = Alignment(horizontal: .center, vertical: .top)
  public static let bottom = Alignment(horizontal: .center, vertical: .bottom)
  public static let topLeading = Alignment(horizontal: .leading, vertical: .top)
  public static let topTrailing = Alignment(horizontal: .trailing, vertical: .top)
  public static let bottomLeading = Alignment(horizontal: .leading, vertical: .bottom)
  public static let bottomTrailing = Alignment(horizontal: .trailing, vertical: .bottom)
}

public enum Axis: Int8, Sendable {
  case horizontal, vertical
  public struct Set: OptionSet, Sendable {
    public let rawValue: Int8
    public init(rawValue: Int8) { self.rawValue = rawValue }
    public static let horizontal = Set(rawValue: 1)
    public static let vertical = Set(rawValue: 2)
  }
}

public enum ContentMode: Sendable { case fit, fill }
public enum TextAlignment: Sendable { case leading, center, trailing }
public enum LayoutDirection: Sendable { case leftToRight, rightToLeft }
public enum ColorScheme: Sendable, Hashable { case light, dark }
public enum ColorSchemeContrast: Sendable { case standard, increased }
public enum Visibility: Sendable { case automatic, visible, hidden }
public struct ToolbarPlacement: Sendable {
  public static let navigationBar = ToolbarPlacement()
  public static let tabBar = ToolbarPlacement()
  public static let bottomBar = ToolbarPlacement()
}
public enum RoundedCornerStyle: Sendable { case circular, continuous }
public enum DynamicTypeSize: Sendable, Comparable { case xSmall, small, medium, large, xLarge, xxLarge, xxxLarge, accessibility1, accessibility2, accessibility3, accessibility4, accessibility5 }

// ---- the view protocol and its builder -------------------------------------------------

@MainActor @preconcurrency
public protocol View {
  associatedtype Body: View
  @ViewBuilder @MainActor @preconcurrency var body: Self.Body { get }
}

extension Never: View {
  public typealias Body = Never
  public var body: Never { fatalError() }
}

/// A view SwiftUI draws itself (its `body` is never called).
@MainActor @preconcurrency
public protocol _PrimitiveView: View where Body == Never {}
extension _PrimitiveView {
  public var body: Never { fatalError("primitive") }
}

@resultBuilder
public struct ViewBuilder {
  public static func buildExpression<Content: View>(_ content: Content) -> Content { content }
  public static func buildBlock() -> EmptyView { EmptyView() }
  public static func buildBlock<Content: View>(_ content: Content) -> Content { content }
  public static func buildBlock<each Content: View>(_ content: repeat each Content) -> TupleView<(repeat each Content)> {
    TupleView((repeat each content))
  }
  public static func buildIf<Content: View>(_ content: Content?) -> Content? { content }
  public static func buildEither<T: View, F: View>(first: T) -> _ConditionalContent<T, F> { _ConditionalContent(first: first) }
  public static func buildEither<T: View, F: View>(second: F) -> _ConditionalContent<T, F> { _ConditionalContent(second: second) }
  public static func buildLimitedAvailability<Content: View>(_ content: Content) -> AnyView { AnyView(content) }
}

public struct EmptyView: _PrimitiveView { public init() {} }
public struct TupleView<T>: _PrimitiveView { public var value: T; public init(_ value: T) { self.value = value } }
public struct _ConditionalContent<TrueContent: View, FalseContent: View>: _PrimitiveView {
  init(first: TrueContent) {}
  init(second: FalseContent) {}
}
extension Optional: View where Wrapped: View {
  public typealias Body = Never
  public var body: Never { fatalError() }
}
public struct AnyView: _PrimitiveView {
  public init<V: View>(_ view: V) {}
  public init<V: View>(erasing view: V) {}
}

@MainActor @preconcurrency
public protocol ViewModifier {
  associatedtype Body: View
  typealias Content = _ViewModifier_Content<Self>
  @ViewBuilder @MainActor @preconcurrency func body(content: Self.Content) -> Self.Body
}
public struct _ViewModifier_Content<Modifier: ViewModifier>: _PrimitiveView {}
public struct ModifiedContent<Content, Modifier>: _PrimitiveView {
  public var content: Content
  public var modifier: Modifier
  public init(content: Content, modifier: Modifier) { self.content = content; self.modifier = modifier }
}
extension View {
  public func modifier<T>(_ modifier: T) -> ModifiedContent<Self, T> { ModifiedContent(content: self, modifier: modifier) }
}

// ---- state --------------------------------------------------------------------------

@propertyWrapper
public struct State<Value>: DynamicProperty {
  public init(wrappedValue value: Value) { box = value }
  public init(initialValue value: Value) { box = value }
  private var box: Value
  public var wrappedValue: Value {
    get { box }
    nonmutating set {}
  }
  public var projectedValue: Binding<Value> { Binding(get: { box }, set: { _ in }) }
}

@propertyWrapper @dynamicMemberLookup
public struct Binding<Value> {
  private let getter: () -> Value
  private let setter: (Value) -> Void
  public init(get: @escaping () -> Value, set: @escaping (Value) -> Void) { getter = get; setter = set }
  public init(projectedValue: Binding<Value>) { self = projectedValue }
  public static func constant(_ value: Value) -> Binding<Value> { Binding(get: { value }, set: { _ in }) }
  public var wrappedValue: Value {
    get { getter() }
    nonmutating set { setter(newValue) }
  }
  public var projectedValue: Binding<Value> { self }
  public subscript<Subject>(dynamicMember keyPath: WritableKeyPath<Value, Subject>) -> Binding<Subject> {
    Binding<Subject>(get: { getter()[keyPath: keyPath] }, set: { _ in })
  }
}
extension Binding: @unchecked Sendable {}

@propertyWrapper @dynamicMemberLookup
public struct Bindable<Value: AnyObject> {
  public var wrappedValue: Value
  public init(wrappedValue: Value) { self.wrappedValue = wrappedValue }
  public init(_ wrappedValue: Value) { self.wrappedValue = wrappedValue }
  public var projectedValue: Bindable<Value> { self }
  public subscript<Subject>(dynamicMember keyPath: ReferenceWritableKeyPath<Value, Subject>) -> Binding<Subject> {
    Binding(get: { wrappedValue[keyPath: keyPath] }, set: { _ in })
  }
}

public protocol DynamicProperty {}

public protocol EnvironmentKey {
  associatedtype Value
  static var defaultValue: Self.Value { get }
}

public struct EnvironmentValues {
  public init() {}
  public subscript<K: EnvironmentKey>(key: K.Type) -> K.Value {
    get { K.defaultValue }
    set {}
  }
  public var colorScheme: ColorScheme { get { .light } set {} }
  public var colorSchemeContrast: ColorSchemeContrast { .standard }
  public var accessibilityReduceTransparency: Bool { false }
  public var accessibilityReduceMotion: Bool { false }
  public var dynamicTypeSize: DynamicTypeSize { get { .large } set {} }
  public var displayScale: CGFloat { get { 3 } set {} }
  public var layoutDirection: LayoutDirection { get { .leftToRight } set {} }
  public var locale: Locale { get { Locale(identifier: "en_US") } set {} }
  public var isEnabled: Bool { get { true } set {} }
  public var openURL: OpenURLAction { OpenURLAction() }
  public var dismiss: DismissAction { DismissAction() }
}

public struct OpenURLAction { @MainActor public func callAsFunction(_ url: URL) {} }
public struct DismissAction { @MainActor public func callAsFunction() {} }

@propertyWrapper
public struct Environment<Value>: DynamicProperty {
  public init(_ keyPath: KeyPath<EnvironmentValues, Value>) {}
  public var wrappedValue: Value { fatalError() }
}

// ---- colour, style, font --------------------------------------------------------------

public protocol ShapeStyle: Sendable {}

public struct Color: ShapeStyle, Hashable, _PrimitiveView {
  public init(red: Double, green: Double, blue: Double, opacity: Double = 1) {}
  public init(white: Double, opacity: Double = 1) {}
  public init(_ name: String) {}
  public func opacity(_ opacity: Double) -> Color { self }
  public static let clear = Color(white: 0, opacity: 0)
  public static let black = Color(white: 0)
  public static let white = Color(white: 1)
  public static let primary = Color(white: 0)
  public static let secondary = Color(white: 0.5)
  public static let accentColor = Color(white: 0.5)
}

public struct Material: ShapeStyle {
  public static let ultraThinMaterial = Material()
  public static let thinMaterial = Material()
  public static let regularMaterial = Material()
  public static let thickMaterial = Material()
  public static let bar = Material()
}
extension ShapeStyle where Self == Material {
  public static var ultraThinMaterial: Material { Material() }
  public static var thinMaterial: Material { Material() }
  public static var regularMaterial: Material { Material() }
}
extension ShapeStyle where Self == Color {
  public static var clear: Color { Color.clear }
  public static var black: Color { Color.black }
  public static var white: Color { Color.white }
}
public struct AnyShapeStyle: ShapeStyle { public init<S: ShapeStyle>(_ style: S) {} }
public struct HierarchicalShapeStyle: ShapeStyle {
  public static let primary = HierarchicalShapeStyle()
  public static let secondary = HierarchicalShapeStyle()
}
public struct LinearGradient: ShapeStyle, _PrimitiveView {
  public init(colors: [Color], startPoint: UnitPoint, endPoint: UnitPoint) {}
  public init(stops: [Gradient.Stop], startPoint: UnitPoint, endPoint: UnitPoint) {}
}
public struct Gradient: Sendable {
  public struct Stop: Sendable { public init(color: Color, location: CGFloat) {} }
}

public struct Font: Hashable, Sendable {
  public enum Weight: Sendable, Hashable { case ultraLight, thin, light, regular, medium, semibold, bold, heavy, black }
  public enum Design: Sendable, Hashable { case `default`, serif, rounded, monospaced }
  public enum TextStyle: Sendable, Hashable { case largeTitle, title, title2, title3, headline, subheadline, body, callout, footnote, caption, caption2 }
  public static func system(size: CGFloat, weight: Weight? = nil, design: Design? = nil) -> Font { Font() }
  public static func system(_ style: TextStyle, design: Design? = nil, weight: Weight? = nil) -> Font { Font() }
  public static func custom(_ name: String, size: CGFloat) -> Font { Font() }
  public static func custom(_ name: String, fixedSize: CGFloat) -> Font { Font() }
  public static func custom(_ name: String, size: CGFloat, relativeTo textStyle: TextStyle) -> Font { Font() }
  public func weight(_ weight: Weight) -> Font { self }
  public func monospacedDigit() -> Font { self }
  public func italic() -> Font { self }
  public static let body = Font()
  public static let headline = Font()
  public static let caption = Font()
}

// ---- views ----------------------------------------------------------------------------

public struct Text: _PrimitiveView, Equatable {
  public init<S: StringProtocol>(_ content: S) {}
  public init(verbatim content: String) {}
  public init(_ key: LocalizedStringKey) {}
  public func font(_ font: Font?) -> Text { self }
  public func fontWeight(_ weight: Font.Weight?) -> Text { self }
  public func foregroundColor(_ color: Color?) -> Text { self }
  public func foregroundStyle<S: ShapeStyle>(_ style: S) -> Text { self }
  public func bold(_ isActive: Bool = true) -> Text { self }
  public func italic(_ isActive: Bool = true) -> Text { self }
  public func underline(_ isActive: Bool = true, color: Color? = nil) -> Text { self }
  public func strikethrough(_ isActive: Bool = true, color: Color? = nil) -> Text { self }
  public func kerning(_ kerning: CGFloat) -> Text { self }
  public func tracking(_ tracking: CGFloat) -> Text { self }
  public func monospacedDigit() -> Text { self }
  public static func + (lhs: Text, rhs: Text) -> Text { lhs }
  public enum TruncationMode: Sendable { case head, tail, middle }
  public enum Case: Sendable { case uppercase, lowercase }
}
public struct LocalizedStringKey: ExpressibleByStringLiteral, Sendable {
  public init(stringLiteral value: String) {}
  public init(_ value: String) {}
}

public struct Image: _PrimitiveView, Equatable {
  public init(_ name: String) {}
  public init(systemName: String) {}
  public init(decorative name: String) {}
  public func resizable() -> Image { self }
  public func renderingMode(_ mode: TemplateRenderingMode?) -> Image { self }
  public func interpolation(_ i: Interpolation) -> Image { self }
  public enum TemplateRenderingMode: Sendable { case template, original }
  public enum Interpolation: Sendable { case none, low, medium, high }
}

public struct VStack<Content: View>: _PrimitiveView {
  public init(alignment: HorizontalAlignment = .center, spacing: CGFloat? = nil, @ViewBuilder content: () -> Content) {}
}
public struct HStack<Content: View>: _PrimitiveView {
  public init(alignment: VerticalAlignment = .center, spacing: CGFloat? = nil, @ViewBuilder content: () -> Content) {}
}
public struct ZStack<Content: View>: _PrimitiveView {
  public init(alignment: Alignment = .center, @ViewBuilder content: () -> Content) {}
}
public struct LazyVStack<Content: View>: _PrimitiveView {
  public init(alignment: HorizontalAlignment = .center, spacing: CGFloat? = nil, pinnedViews: PinnedScrollableViews = .init(), @ViewBuilder content: () -> Content) {}
}
public struct LazyHStack<Content: View>: _PrimitiveView {
  public init(alignment: VerticalAlignment = .center, spacing: CGFloat? = nil, pinnedViews: PinnedScrollableViews = .init(), @ViewBuilder content: () -> Content) {}
}
public struct PinnedScrollableViews: OptionSet, Sendable {
  public let rawValue: UInt32
  public init(rawValue: UInt32) { self.rawValue = rawValue }
  public init() { rawValue = 0 }
}
public struct Group<Content> {
  public init(@ViewBuilder content: () -> Content) where Content: View {}
}
extension Group: View, _PrimitiveView where Content: View {}
public struct Spacer: _PrimitiveView { public init(minLength: CGFloat? = nil) {} }
public struct Divider: _PrimitiveView { public init() {} }
public struct ScrollView<Content: View>: _PrimitiveView {
  public init(_ axes: Axis.Set = .vertical, showsIndicators: Bool = true, @ViewBuilder content: () -> Content) {}
}
public struct GeometryReader<Content: View>: _PrimitiveView {
  public init(@ViewBuilder content: @escaping (GeometryProxy) -> Content) {}
}
public struct GeometryProxy {
  public var size: CGSize { .zero }
  public var safeAreaInsets: EdgeInsets { EdgeInsets() }
}
public struct ViewThatFits<Content: View>: _PrimitiveView {
  public init(in axes: Axis.Set = [.horizontal, .vertical], @ViewBuilder content: () -> Content) {}
}

public struct ForEach<Data: RandomAccessCollection, ID: Hashable, Content> {
  public var data: Data
}
extension ForEach: View, _PrimitiveView where Content: View {
  public init(_ data: Data, @ViewBuilder content: @escaping (Data.Element) -> Content) where ID == Data.Element.ID, Data.Element: Identifiable { self.data = data }
  public init(_ data: Data, id: KeyPath<Data.Element, ID>, @ViewBuilder content: @escaping (Data.Element) -> Content) { self.data = data }
  public init(_ data: Range<Int>, @ViewBuilder content: @escaping (Int) -> Content) where Data == Range<Int>, ID == Int { self.data = data }
}

public struct List<SelectionValue: Hashable, Content: View>: _PrimitiveView {
  public init(@ViewBuilder content: () -> Content) where SelectionValue == Never {}
  public init<Data: RandomAccessCollection, ID: Hashable, RowContent: View>(_ data: Data, id: KeyPath<Data.Element, ID>, @ViewBuilder rowContent: @escaping (Data.Element) -> RowContent) where Content == ForEach<Data, ID, RowContent>, SelectionValue == Never {}
  public init<Data: RandomAccessCollection, RowContent: View>(_ data: Data, @ViewBuilder rowContent: @escaping (Data.Element) -> RowContent) where Content == ForEach<Data, Data.Element.ID, RowContent>, Data.Element: Identifiable, SelectionValue == Never {}
}
public protocol ListStyle {}
public struct PlainListStyle: ListStyle { public init() {} }
extension ListStyle where Self == PlainListStyle { public static var plain: PlainListStyle { PlainListStyle() } }

public struct Section<Parent, Content, Footer> {}
extension Section: View, _PrimitiveView where Parent: View, Content: View, Footer: View {
  public init(@ViewBuilder content: () -> Content) where Parent == EmptyView, Footer == EmptyView {}
}

public struct Button<Label: View>: _PrimitiveView {
  public init(action: @escaping @MainActor () -> Void, @ViewBuilder label: () -> Label) {}
  public init(role: ButtonRole?, action: @escaping @MainActor () -> Void, @ViewBuilder label: () -> Label) {}
}
extension Button where Label == Text {
  public init<S: StringProtocol>(_ title: S, action: @escaping @MainActor () -> Void) {}
}
public struct ButtonRole: Sendable, Equatable {
  public static let destructive = ButtonRole()
  public static let cancel = ButtonRole()
}

public struct Toggle<Label: View>: _PrimitiveView {
  public init(isOn: Binding<Bool>, @ViewBuilder label: () -> Label) {}
}
extension Toggle where Label == Text {
  public init<S: StringProtocol>(_ title: S, isOn: Binding<Bool>) {}
}

public struct ProgressView<Label: View, CurrentValueLabel: View>: _PrimitiveView {}
extension ProgressView where Label == EmptyView, CurrentValueLabel == EmptyView {
  public init() {}
  public init<V: BinaryFloatingPoint>(value: V?, total: V = 1.0) {}
}

public struct Label<Title: View, Icon: View>: _PrimitiveView {
  public init(@ViewBuilder title: () -> Title, @ViewBuilder icon: () -> Icon) {}
}

public struct Menu<Label: View, Content: View>: _PrimitiveView {
  public init(@ViewBuilder content: () -> Content, @ViewBuilder label: () -> Label) {}
}

public struct NavigationPath: Equatable {
  public init() {}
  public var count: Int { 0 }
  public var isEmpty: Bool { true }
  public mutating func append<V: Hashable>(_ value: V) {}
  public mutating func removeLast(_ k: Int = 1) {}
}
public struct NavigationStack<Data, Root: View>: _PrimitiveView {
  public init(@ViewBuilder root: () -> Root) where Data == NavigationPath {}
  public init(path: Binding<NavigationPath>, @ViewBuilder root: () -> Root) where Data == NavigationPath {}
  public init(path: Binding<Data>, @ViewBuilder root: () -> Root) where Data: MutableCollection, Data: RandomAccessCollection, Data: RangeReplaceableCollection, Data.Element: Hashable {}
}

public struct TabView<SelectionValue: Hashable, Content: View>: _PrimitiveView {
  public init(selection: Binding<SelectionValue>, @ViewBuilder content: () -> Content) {}
}
@available(iOS 18.0, macOS 15.0, *)
public struct Tab<Value: Hashable, Content: View, Label: View>: _PrimitiveView {}
@available(iOS 18.0, macOS 15.0, *)
extension Tab where Label == DefaultTabLabel {
  public init(_ title: String, systemImage: String, value: Value, @ViewBuilder content: () -> Content) {}
}
@available(iOS 18.0, macOS 15.0, *)
extension Tab {
  public init(value: Value, @ViewBuilder content: () -> Content, @ViewBuilder label: () -> Label) {}
}
public struct DefaultTabLabel: _PrimitiveView {}

// ---- shapes ---------------------------------------------------------------------------

public struct Path: Sendable {
  public init() {}
  public init(_ rect: CGRect) {}
  public init(_ build: (inout Path) -> Void) {}
  public mutating func move(to p: CGPoint) {}
  public mutating func addLine(to p: CGPoint) {}
  public mutating func addCurve(to p: CGPoint, control1: CGPoint, control2: CGPoint) {}
  public mutating func addQuadCurve(to p: CGPoint, control: CGPoint) {}
  public mutating func addArc(center: CGPoint, radius: CGFloat, startAngle: Angle, endAngle: Angle, clockwise: Bool) {}
  public mutating func addRect(_ rect: CGRect) {}
  public mutating func addRoundedRect(in rect: CGRect, cornerSize: CGSize, style: RoundedCornerStyle = .continuous) {}
  public mutating func closeSubpath() {}
  public func applying(_ transform: CGAffineTransform) -> Path { self }
  public var boundingRect: CGRect { .zero }
}
public struct CGAffineTransform: Sendable {
  public init(scaleX: CGFloat, y: CGFloat) {}
  public init(translationX: CGFloat, y: CGFloat) {}
  public func scaledBy(x: CGFloat, y: CGFloat) -> CGAffineTransform { self }
  public func translatedBy(x: CGFloat, y: CGFloat) -> CGAffineTransform { self }
}

public protocol Shape: Sendable, View {
  nonisolated func path(in rect: CGRect) -> Path
}
extension Shape {
  public var body: _ShapeView<Self, Color> { _ShapeView() }
  public func fill<S: ShapeStyle>(_ content: S = Color.primary, style: FillStyle = FillStyle()) -> some View { self }
  public func stroke<S: ShapeStyle>(_ content: S, lineWidth: CGFloat = 1) -> some View { self }
  public func stroke<S: ShapeStyle>(_ content: S, style: StrokeStyle) -> some View { self }
  public func inset(by amount: CGFloat) -> some Shape { self }
}
public struct _ShapeView<Content: Shape, Style: ShapeStyle>: _PrimitiveView { init() {} }
public struct FillStyle: Sendable { public init(eoFill: Bool = false, antialiased: Bool = true) {} }
public struct StrokeStyle: Sendable {
  public init(lineWidth: CGFloat = 1, lineCap: CGLineCap = .butt, lineJoin: CGLineJoin = .miter, dash: [CGFloat] = []) {}
}
public enum CGLineCap: Sendable { case butt, round, square }
public enum CGLineJoin: Sendable { case miter, round, bevel }

public struct Rectangle: Shape { public init() {}; nonisolated public func path(in rect: CGRect) -> Path { Path() } }
public struct Circle: Shape { public init() {}; nonisolated public func path(in rect: CGRect) -> Path { Path() } }
public struct Capsule: Shape {
  public init(style: RoundedCornerStyle = .continuous) {}
  nonisolated public func path(in rect: CGRect) -> Path { Path() }
}
public struct RoundedRectangle: Shape {
  public init(cornerRadius: CGFloat, style: RoundedCornerStyle = .continuous) {}
  public init(cornerSize: CGSize, style: RoundedCornerStyle = .continuous) {}
  nonisolated public func path(in rect: CGRect) -> Path { Path() }
}
public struct UnevenRoundedRectangle: Shape {
  public init(topLeadingRadius: CGFloat = 0, bottomLeadingRadius: CGFloat = 0, bottomTrailingRadius: CGFloat = 0, topTrailingRadius: CGFloat = 0, style: RoundedCornerStyle = .continuous) {}
  nonisolated public func path(in rect: CGRect) -> Path { Path() }
}
public struct AnyShape: Shape {
  public init<S: Shape>(_ shape: S) {}
  nonisolated public func path(in rect: CGRect) -> Path { Path() }
}
extension Shape where Self == Rectangle { public static var rect: Rectangle { Rectangle() } }
extension Shape where Self == Capsule { public static var capsule: Capsule { Capsule() } }
extension Shape where Self == Circle { public static var circle: Circle { Circle() } }
extension Shape where Self == RoundedRectangle {
  public static func rect(cornerRadius: CGFloat, style: RoundedCornerStyle = .continuous) -> RoundedRectangle {
    RoundedRectangle(cornerRadius: cornerRadius, style: style)
  }
}

// ---- motion, gestures, feedback --------------------------------------------------------

public struct Animation: Sendable, Equatable {
  public static let `default` = Animation()
  public static func easeInOut(duration: Double) -> Animation { Animation() }
  public static func easeOut(duration: Double) -> Animation { Animation() }
  public static func linear(duration: Double) -> Animation { Animation() }
  public static func timingCurve(_ p1x: Double, _ p1y: Double, _ p2x: Double, _ p2y: Double, duration: TimeInterval = 0.35) -> Animation { Animation() }
  public static func spring(response: Double = 0.5, dampingFraction: Double = 0.825, blendDuration: Double = 0) -> Animation { Animation() }
  public static func spring(duration: TimeInterval = 0.5, bounce: Double = 0, blendDuration: Double = 0) -> Animation { Animation() }
  public static func interpolatingSpring(mass: Double = 1, stiffness: Double, damping: Double, initialVelocity: Double = 0) -> Animation { Animation() }
  public func repeatForever(autoreverses: Bool = true) -> Animation { self }
  public func delay(_ delay: Double) -> Animation { self }
}
@MainActor public func withAnimation<Result>(_ animation: Animation? = .default, _ body: () throws -> Result) rethrows -> Result { try body() }

public struct AnyTransition: Sendable {
  public static let opacity = AnyTransition()
  public static func scale(scale: CGFloat, anchor: UnitPoint = .center) -> AnyTransition { AnyTransition() }
  public func combined(with other: AnyTransition) -> AnyTransition { self }
}

public protocol Gesture {
  associatedtype Value
}
public struct DragGesture: Gesture {
  public struct Value: Equatable, Sendable {
    public var translation: CGSize
    public var location: CGPoint
    public var startLocation: CGPoint
    public var velocity: CGSize
  }
  public init(minimumDistance: CGFloat = 10) {}
  public func onChanged(_ action: @escaping (Value) -> Void) -> _ChangedGesture<DragGesture> { _ChangedGesture() }
  public func onEnded(_ action: @escaping (Value) -> Void) -> _EndedGesture<DragGesture> { _EndedGesture() }
}
public struct LongPressGesture: Gesture {
  public typealias Value = Bool
  public init(minimumDuration: Double = 0.5, maximumDistance: CGFloat = 10) {}
  public func onEnded(_ action: @escaping (Value) -> Void) -> _EndedGesture<LongPressGesture> { _EndedGesture() }
}
public struct _ChangedGesture<G: Gesture>: Gesture {
  public typealias Value = G.Value
  public func onEnded(_ action: @escaping (Value) -> Void) -> _EndedGesture<_ChangedGesture<G>> { _EndedGesture() }
}
public struct _EndedGesture<G: Gesture>: Gesture { public typealias Value = G.Value }

public struct SensoryFeedback: Sendable, Equatable {
  public struct Weight: Sendable, Equatable {
    public static let light = Weight()
    public static let medium = Weight()
    public static let heavy = Weight()
  }
  public static let selection = SensoryFeedback()
  public static let success = SensoryFeedback()
  public static let warning = SensoryFeedback()
  public static let error = SensoryFeedback()
  public static let increase = SensoryFeedback()
  public static let decrease = SensoryFeedback()
  public static func impact(weight: Weight = .light, intensity: Double = 1) -> SensoryFeedback { SensoryFeedback() }
}

// ---- styles ---------------------------------------------------------------------------

public struct ButtonStyleConfiguration {
  public struct Label: _PrimitiveView {}
  public let label: Label
  public let isPressed: Bool
  public let role: ButtonRole?
}
public protocol ButtonStyle {
  associatedtype Body: View
  @ViewBuilder @MainActor func makeBody(configuration: Configuration) -> Body
  typealias Configuration = ButtonStyleConfiguration
}
public struct PlainButtonStyle: PrimitiveButtonStyle { public init() {} }
public protocol PrimitiveButtonStyle {}
extension PrimitiveButtonStyle where Self == PlainButtonStyle { public static var plain: PlainButtonStyle { PlainButtonStyle() } }
@available(iOS 26.0, macOS 26.0, *)
public struct GlassButtonStyle: PrimitiveButtonStyle { public init() {} }
@available(iOS 26.0, macOS 26.0, *)
public struct GlassProminentButtonStyle: PrimitiveButtonStyle { public init() {} }
@available(iOS 26.0, macOS 26.0, *)
extension PrimitiveButtonStyle where Self == GlassButtonStyle { public static var glass: GlassButtonStyle { GlassButtonStyle() } }
@available(iOS 26.0, macOS 26.0, *)
extension PrimitiveButtonStyle where Self == GlassProminentButtonStyle { public static var glassProminent: GlassProminentButtonStyle { GlassProminentButtonStyle() } }

public struct ToggleStyleConfiguration {
  public struct Label: _PrimitiveView {}
  public let label: Label
  @Binding public var isOn: Bool
}
public protocol ToggleStyle {
  associatedtype Body: View
  @ViewBuilder @MainActor func makeBody(configuration: Configuration) -> Body
  typealias Configuration = ToggleStyleConfiguration
}

public enum ControlSize: Sendable { case mini, small, regular, large, extraLarge }

// ---- Liquid Glass (iOS 26) -------------------------------------------------------------

@available(iOS 26.0, macOS 26.0, *)
public struct Glass: Sendable, Equatable {
  public static let regular = Glass()
  public static let clear = Glass()
  public static let identity = Glass()
  public func tint(_ color: Color?) -> Glass { self }
  public func interactive(_ isEnabled: Bool = true) -> Glass { self }
}
@available(iOS 26.0, macOS 26.0, *)
public struct GlassEffectContainer<Content: View>: _PrimitiveView {
  public init(spacing: CGFloat? = nil, @ViewBuilder content: () -> Content) {}
}

// ---- modifiers ------------------------------------------------------------------------

public struct ScrollIndicatorVisibility: Sendable { public static let hidden = ScrollIndicatorVisibility(); public static let automatic = ScrollIndicatorVisibility() }
public struct SafeAreaRegions: OptionSet, Sendable {
  public let rawValue: UInt
  public init(rawValue: UInt) { self.rawValue = rawValue }
  public static let all = SafeAreaRegions(rawValue: 3)
  public static let container = SafeAreaRegions(rawValue: 1)
}
public enum TaskPriority_ {}

extension View {
  public func padding(_ insets: EdgeInsets) -> some View { self }
  public func padding(_ edges: Edge.Set = .all, _ length: CGFloat? = nil) -> some View { self }
  public func padding(_ length: CGFloat) -> some View { self }
  public func frame(width: CGFloat? = nil, height: CGFloat? = nil, alignment: Alignment = .center) -> some View { self }
  public func frame(minWidth: CGFloat? = nil, idealWidth: CGFloat? = nil, maxWidth: CGFloat? = nil, minHeight: CGFloat? = nil, idealHeight: CGFloat? = nil, maxHeight: CGFloat? = nil, alignment: Alignment = .center) -> some View { self }
  public func fixedSize() -> some View { self }
  public func fixedSize(horizontal: Bool, vertical: Bool) -> some View { self }
  public func layoutPriority(_ value: Double) -> some View { self }
  public func aspectRatio(_ aspectRatio: CGFloat? = nil, contentMode: ContentMode) -> some View { self }
  public func offset(x: CGFloat = 0, y: CGFloat = 0) -> some View { self }
  public func position(x: CGFloat = 0, y: CGFloat = 0) -> some View { self }
  public func zIndex(_ value: Double) -> some View { self }
  public func background<S: ShapeStyle>(_ style: S, ignoresSafeAreaEdges edges: Edge.Set = .all) -> some View { self }
  public func background<S: ShapeStyle, T: Shape>(_ style: S, in shape: T, fillStyle: FillStyle = FillStyle()) -> some View { self }
  public func background<V: View>(alignment: Alignment = .center, @ViewBuilder content: () -> V) -> some View { self }
  public func overlay<V: View>(alignment: Alignment = .center, @ViewBuilder content: () -> V) -> some View { self }
  public func overlay<S: ShapeStyle, T: Shape>(_ style: S, in shape: T, fillStyle: FillStyle = FillStyle()) -> some View { self }
  public func foregroundStyle<S: ShapeStyle>(_ style: S) -> some View { self }
  public func foregroundColor(_ color: Color?) -> some View { self }
  public func tint(_ tint: Color?) -> some View { self }
  public func font(_ font: Font?) -> some View { self }
  public func fontWeight(_ weight: Font.Weight?) -> some View { self }
  public func lineLimit(_ number: Int?) -> some View { self }
  public func lineSpacing(_ lineSpacing: CGFloat) -> some View { self }
  public func multilineTextAlignment(_ alignment: TextAlignment) -> some View { self }
  public func truncationMode(_ mode: Text.TruncationMode) -> some View { self }
  public func textCase(_ textCase: Text.Case?) -> some View { self }
  public func kerning(_ kerning: CGFloat) -> some View { self }
  public func tracking(_ tracking: CGFloat) -> some View { self }
  public func minimumScaleFactor(_ factor: CGFloat) -> some View { self }
  public func opacity(_ opacity: Double) -> some View { self }
  public func clipShape<S: Shape>(_ shape: S, style: FillStyle = FillStyle()) -> some View { self }
  public func clipped(antialiased: Bool = false) -> some View { self }
  public func contentShape<S: Shape>(_ shape: S, eoFill: Bool = false) -> some View { self }
  public func shadow(color: Color = .black, radius: CGFloat, x: CGFloat = 0, y: CGFloat = 0) -> some View { self }
  public func blur(radius: CGFloat, opaque: Bool = false) -> some View { self }
  public func scaleEffect(_ s: CGFloat, anchor: UnitPoint = .center) -> some View { self }
  public func scaleEffect(x: CGFloat = 1, y: CGFloat = 1, anchor: UnitPoint = .center) -> some View { self }
  public func rotationEffect(_ angle: Angle, anchor: UnitPoint = .center) -> some View { self }
  public func hidden() -> some View { self }
  public func disabled(_ disabled: Bool) -> some View { self }
  public func allowsHitTesting(_ enabled: Bool) -> some View { self }
  public func id<ID: Hashable>(_ id: ID) -> some View { self }
  public func equatable() -> some View where Self: Equatable { self }
  public func compositingGroup() -> some View { self }
  public func drawingGroup() -> some View { self }
  public func ignoresSafeArea(_ regions: SafeAreaRegions = .all, edges: Edge.Set = .all) -> some View { self }
  public func safeAreaInset<V: View>(edge: VerticalEdge, alignment: HorizontalAlignment = .center, spacing: CGFloat? = nil, @ViewBuilder content: () -> V) -> some View { self }
  public func environment<V>(_ keyPath: WritableKeyPath<EnvironmentValues, V>, _ value: V) -> some View { self }
  public func transformEnvironment<V>(_ keyPath: WritableKeyPath<EnvironmentValues, V>, transform: @escaping (inout V) -> Void) -> some View { self }
  public func onAppear(perform action: (() -> Void)? = nil) -> some View { self }
  public func onDisappear(perform action: (() -> Void)? = nil) -> some View { self }
  public func task(priority: TaskPriority = .userInitiated, _ action: @escaping @Sendable @isolated(any) () async -> Void) -> some View { self }
  public func task<T: Equatable>(id value: T, priority: TaskPriority = .userInitiated, _ action: @escaping @Sendable @isolated(any) () async -> Void) -> some View { self }
  public func onChange<V: Equatable>(of value: V, initial: Bool = false, _ action: @escaping (_ oldValue: V, _ newValue: V) -> Void) -> some View { self }
  public func onChange<V: Equatable>(of value: V, initial: Bool = false, _ action: @escaping () -> Void) -> some View { self }
  public func onTapGesture(count: Int = 1, perform action: @escaping () -> Void) -> some View { self }
  public func onLongPressGesture(minimumDuration: Double = 0.5, maximumDistance: CGFloat = 10, perform action: @escaping () -> Void, onPressingChanged: ((Bool) -> Void)? = nil) -> some View { self }
  public func gesture<T: Gesture>(_ gesture: T) -> some View { self }
  public func simultaneousGesture<T: Gesture>(_ gesture: T) -> some View { self }
  public func animation<V: Equatable>(_ animation: Animation?, value: V) -> some View { self }
  public func transition(_ t: AnyTransition) -> some View { self }
  public func sensoryFeedback<T: Equatable>(_ feedback: SensoryFeedback, trigger: T) -> some View { self }
  public func buttonStyle<S: ButtonStyle>(_ style: S) -> some View { self }
  public func buttonStyle<S: PrimitiveButtonStyle>(_ style: S) -> some View { self }
  public func toggleStyle<S: ToggleStyle>(_ style: S) -> some View { self }
  public func controlSize(_ controlSize: ControlSize) -> some View { self }
  public func listStyle<S: ListStyle>(_ style: S) -> some View { self }
  public func listRowInsets(_ insets: EdgeInsets?) -> some View { self }
  public func listRowSeparator(_ visibility: Visibility, edges: VerticalEdge.Set = .all) -> some View { self }
  public func listRowBackground<V: View>(_ view: V?) -> some View { self }
  public func listRowSpacing(_ spacing: CGFloat?) -> some View { self }
  public func scrollContentBackground(_ visibility: Visibility) -> some View { self }
  public func scrollIndicators(_ visibility: ScrollIndicatorVisibility, axes: Axis.Set = [.vertical, .horizontal]) -> some View { self }
  public func contentMargins(_ edges: Edge.Set = .all, _ length: CGFloat?, for placement: ContentMarginPlacement = .automatic) -> some View { self }
  public func navigationTitle(_ title: String) -> some View { self }
  public func toolbar(_ visibility: Visibility, for bars: ToolbarPlacement...) -> some View { self }
  public func accessibilityIdentifier(_ identifier: String) -> some View { self }
  public func navigationDestination<D: Hashable, C: View>(for data: D.Type, @ViewBuilder destination: @escaping (D) -> C) -> some View { self }
  public func toolbar<Content: View>(@ViewBuilder content: () -> Content) -> some View { self }
  public func tabItem<V: View>(@ViewBuilder _ label: () -> V) -> some View { self }
  public func tag<V: Hashable>(_ tag: V) -> some View { self }
  public func sheet<Content: View>(isPresented: Binding<Bool>, onDismiss: (() -> Void)? = nil, @ViewBuilder content: @escaping () -> Content) -> some View { self }
  public func contextMenu<MenuItems: View>(@ViewBuilder menuItems: () -> MenuItems) -> some View { self }
  public func accessibilityLabel(_ label: String) -> some View { self }
  public func accessibilityHint(_ hint: String) -> some View { self }
  public func accessibilityValue(_ value: String) -> some View { self }
  public func accessibilityHidden(_ hidden: Bool) -> some View { self }
  public func accessibilityAddTraits(_ traits: AccessibilityTraits) -> some View { self }
  public func accessibilityElement(children: AccessibilityChildBehavior = .ignore) -> some View { self }
  public func onOpenURL(perform action: @escaping (URL) -> Void) -> some View { self }
  public func preferredColorScheme(_ colorScheme: ColorScheme?) -> some View { self }
  @available(iOS 26.0, macOS 26.0, *)
  public func glassEffect<S: Shape>(_ glass: Glass = .regular, in shape: S) -> some View { self }
  @available(iOS 26.0, macOS 26.0, *)
  public func glassEffect(_ glass: Glass = .regular) -> some View { self }
  @available(iOS 26.0, macOS 26.0, *)
  public func glassEffectID<ID: Hashable & Sendable>(_ id: ID?, in namespace: Namespace.ID) -> some View { self }
  @available(iOS 26.0, macOS 26.0, *)
  public func tabBarMinimizeBehavior(_ behavior: TabBarMinimizeBehavior) -> some View { self }
}
@available(iOS 26.0, macOS 26.0, *)
public struct TabBarMinimizeBehavior: Sendable { public static let onScrollDown = TabBarMinimizeBehavior(); public static let never = TabBarMinimizeBehavior(); public static let automatic = TabBarMinimizeBehavior() }
public struct ContentMarginPlacement: Sendable { public static let automatic = ContentMarginPlacement(); public static let scrollContent = ContentMarginPlacement() }
public enum VerticalEdge: Int8, Sendable {
  case top, bottom
  public struct Set: OptionSet, Sendable {
    public let rawValue: Int8
    public init(rawValue: Int8) { self.rawValue = rawValue }
    public static let all = Set(rawValue: 3)
    public static let top = Set(rawValue: 1)
    public static let bottom = Set(rawValue: 2)
  }
}
public struct AccessibilityTraits: OptionSet, Sendable {
  public let rawValue: UInt64
  public init(rawValue: UInt64) { self.rawValue = rawValue }
  public static let isButton = AccessibilityTraits(rawValue: 1)
  public static let isSelected = AccessibilityTraits(rawValue: 2)
  public static let isHeader = AccessibilityTraits(rawValue: 4)
  public static let isImage = AccessibilityTraits(rawValue: 8)
}
public struct AccessibilityChildBehavior: Sendable { public static let ignore = AccessibilityChildBehavior(); public static let combine = AccessibilityChildBehavior(); public static let contain = AccessibilityChildBehavior() }

@propertyWrapper
public struct Namespace: DynamicProperty {
  public struct ID: Hashable, Sendable {}
  public init() {}
  public var wrappedValue: ID { ID() }
}

// ---- the app --------------------------------------------------------------------------

@MainActor @preconcurrency
public protocol App {
  associatedtype Body: Scene
  @SceneBuilder @MainActor var body: Self.Body { get }
  init()
}
extension App {
  @MainActor public static func main() {}
}
@MainActor @preconcurrency
public protocol Scene {}
@resultBuilder public struct SceneBuilder {
  public static func buildBlock<S: Scene>(_ s: S) -> S { s }
}
public struct WindowGroup<Content: View>: Scene {
  public init(@ViewBuilder content: () -> Content) {}
}

public struct TextField<Label: View>: _PrimitiveView {}
extension TextField where Label == Text {
  public init<S: StringProtocol>(_ title: S, text: Binding<String>) {}
}
