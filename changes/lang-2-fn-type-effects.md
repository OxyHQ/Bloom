---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Changed
---

- A function type keeps `throws` (beside `async`), as Swift's does: `(String) throws -> Int` is a type of its own in the checker and the IR (`FnTy.throws` read from a written type; AST `TypeKind::Fn.throws`). A value of a throwing type is called with `try`; a function that does not throw fits a throwing type, and a throwing one where a non-throwing one is expected is B0201 (TS callbacks excepted). A closure whose `try` nothing in it catches throws where a throwing type, or none, is expected. The standard library's list methods rethrow (`try xs.map(parse)`). `Codec.decode` is `(JSONValue, String) throws -> T` and `JSON.decode(_:from:)` throws (it already needed `try` in practice). The formatter writes Swift's spelling, `(A) async throws -> R`.
