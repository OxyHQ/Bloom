---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **A runtime crash refused at compile time:** a Swift collection method JS arrays do not have (`enumerated`, `compactMap`, `firstIndex`, `lastIndex`, `allSatisfy`, `dropFirst`, `dropLast`, `reversed`, `sorted`, `removingDuplicates`, `chunked`, `joined`) called on a TS value Bloom could not type was emitted as a JS method call, "enumerated is not a function" at render. It is B0601: give the value its Bloom type first. A TS array type (`T[]`, `readonly T[]`, `ReadonlyArray<T>`) is already a Bloom list (mention13 foreign-enumerated; a zustand selector's result is not typed yet).
