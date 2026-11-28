---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A view a TS callback prop gives crosses as an element:** a closure given to a TS component's function prop Bloom cannot type (`FlatList`'s `renderItem: ListRenderItem<ItemT>`) that gives a Bloom view returned the node raw, and React threw "Objects are not valid as a React child". It is `toElement(Row(…))`, as a view given to such a prop already was (mention14 closure-view-to-reactelement).
