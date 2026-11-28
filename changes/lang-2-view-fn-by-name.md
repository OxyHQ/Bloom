---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A function value that gives a view, handed by name to a TS component's callback prop Bloom cannot type (React Native's `FlatList` `renderItem: renderRow`, a member `func` or a `let` closure), crosses with each view it gives as an element, as a closure literal's does. React drew the Bloom node and failed with "Objects are not valid as a React child".
