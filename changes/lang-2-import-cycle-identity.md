---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A type named across an import cycle of a module's files is one type, whatever order the files are read in. With `struct ToneDeltaPair { roleA: ColorRole }` in one file and `enum ColorRole` in another that builds a `ToneDeltaPair`, a third file was B0201 "expected `ColorRole`, found `ColorRole`": inside the cycle, `ColorRole` resolved to the language's `ColorRole` token set. A file read inside a cycle now sees its imports' types by name. An imported type is also one def however many imports bring it, so a module's checks no longer grow with its import graph: the theme engine's 12-file module checks cold in 0.53 s, where it took 3.3 s (release build).
