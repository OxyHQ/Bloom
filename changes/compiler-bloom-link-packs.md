---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `BLOOM_LINK` installs a linked checkout as it packs (its `pack:local` script when it has one, else `bun pm pack`), never as a copy of the directory. bun copied all of a `file:` directory, the checkout's examples and their `.bloom/build/` included, each holding the last linked copy, so every build nested one level deeper until the tree was too deep to delete. A pack that would carry a `.bloom` build is refused, and a rebuilt checkout is installed again on the next build (the tarball is named by its content), with no `.installed` stamp to delete.
