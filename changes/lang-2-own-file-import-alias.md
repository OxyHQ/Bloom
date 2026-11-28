---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A path import of a file of the same module that renames a name (`import { ListCard as ListCardComponent, type ListCardData } from "@/components/ListCard"`) keeps the renamed names, imported from the `.bloom` file itself, and drops the rest, which are in scope already. It was read as a TS import, which hid the module's own `ListCardData` (B0602, then B0204).
