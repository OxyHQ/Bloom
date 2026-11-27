---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- A `private` top-level declaration is its file's only, as TS's file scope is: it may share a sibling file's `internal` or `public` name, which it shadows inside its own file, where it was B0807. Two `internal` or `public` declarations of one name in a module stay B0807.
