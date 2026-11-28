---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A `VirtualList`'s row closure written in place (`VirtualList(people, { row in … })`) is typed `VirtualListRow<T>`, what FlashList hands it at draw time: `row.item` is the item and `row.index` its index. A row that read the item's fields off the row itself (`{ person in Text(person.name) }`) type-checked and crashed on the first draw; it is now B0205, with the help "a row is `{ item, index }`: the item's `name` is `.item.name`".
