// `ScrollView` and `VirtualList`: a scroll of content, and a list of rows drawn as they come
// into view (UICollectionView-backed `List`: rows are reused, so 500 rows cost what a screen of
// them does). No separators, no insets, no cell background: a row draws itself, as with
// FlashList today. The row closure takes `VirtualListRow<T>` (`item`, `index`) on every backend.
#if canImport(SwiftUI)
import SwiftUI

public struct ScrollView<Content: View>: View {
  let content: Content
  var indicators = true

  public init(@ViewBuilder content: () -> Content) { self.content = content() }

  public var body: some View {
    SwiftUI.ScrollView(.vertical, showsIndicators: indicators) {
      BloomFlexLayout(axis: .vertical) { content }
        // The offset for the chrome over it (the header's scrim), on every iOS: the content's
        // top in the scroll view's own space.
        .background {
          GeometryReader { proxy in
            SwiftUI.Color.clear.preference(
              key: BloomScrollOffsetKey.self, value: -Double(proxy.frame(in: .named(ScrollSpace.name)).minY))
          }
        }
    }
    .coordinateSpace(.named(ScrollSpace.name))
  }
}

/// `ScrollArea { … }.axis(.horizontal)`: content that scrolls along its axis (a media strip).
public struct ScrollArea<Content: View>: View {
  let content: Content
  var direction: Tokens.Axis = .vertical
  var indicators = true

  public init(@ViewBuilder content: () -> Content) { self.content = content() }

  public func axis(_ axis: Tokens.Axis) -> Self { var s = self; s.direction = axis; return s }

  public func scrollbar(_ visible: Bool) -> Self { var s = self; s.indicators = visible; return s }

  public var body: some View {
    if direction == .horizontal {
      SwiftUI.ScrollView(.horizontal, showsIndicators: indicators) {
        BloomFlexLayout(axis: .horizontal) { content }
      }
    } else {
      ScrollView { content }
    }
  }
}

enum ScrollSpace {
  static let name = "bloom.scroll"
}

/// A row of a `VirtualList`: the item and its position; `row.name` reads `row.item.name`.
@dynamicMemberLookup
public struct VirtualListRow<Item> {
  public let item: Item
  public let index: Int

  public subscript<Value>(dynamicMember path: KeyPath<Item, Value>) -> Value { item[keyPath: path] }
}

public struct VirtualList<Item, Row: View>: View {
  let items: [Item]
  let row: (VirtualListRow<Item>) -> Row
  let id: (Int, Item) -> AnyHashable

  /// Rows keyed by position.
  public init(_ items: [Item], _ row: @escaping (VirtualListRow<Item>) -> Row) {
    self.items = items
    self.row = row
    self.id = { i, _ in AnyHashable(i) }
  }

  /// Rows keyed by `id`, so an insertion or a move keeps each row's state.
  public init(_ items: [Item], _ row: @escaping (VirtualListRow<Item>) -> Row) where Item: Identifiable {
    self.items = items
    self.row = row
    self.id = { _, item in AnyHashable(item.id) }
  }

  /// `VirtualList(people.enumerated()) { i, person in … }`: each row handed its index and item.
  public init<T>(_ pairs: [(Int, T)], _ row: @escaping (Int, T) -> Row) where Item == (Int, T) {
    self.items = pairs
    self.row = { r in row(r.item.0, r.item.1) }
    self.id = { i, _ in AnyHashable(i) }
  }

  /// The same, keyed by each item's `id`.
  public init<T: Identifiable>(_ pairs: [(Int, T)], _ row: @escaping (Int, T) -> Row) where Item == (Int, T) {
    self.items = pairs
    self.row = { r in row(r.item.0, r.item.1) }
    self.id = { _, pair in AnyHashable(pair.1.id) }
  }

  @State private var offset = 0.0

  struct Entry: Identifiable {
    let id: AnyHashable
    let index: Int
  }

  public var body: some View {
    let entries = items.indices.map { Entry(id: id($0, items[$0]), index: $0) }
    List(entries) { entry in
      row(VirtualListRow(item: items[entry.index], index: entry.index))
        .listRowInsets(EdgeInsets())
        .listRowSeparator(.hidden)
        .listRowBackground(SwiftUI.Color.clear)
    }
    .listStyle(.plain)
    .scrollContentBackground(.hidden)
    .bloomReportsScrollOffset($offset)
  }
}
#endif
