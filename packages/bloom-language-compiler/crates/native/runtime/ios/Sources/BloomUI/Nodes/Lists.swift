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
    }
  }
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
  }
}
#endif
