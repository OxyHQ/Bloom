---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A private `Codable` struct's `T.self` is read above its declaration, as Swift reads a file's declarations in any order: `decode(ServerErrorBody.self)` in a function above `private struct ServerErrorBody: Codable` was B0205 "names nothing". The derived codec is declared with the file's functions (an exported one already was).
