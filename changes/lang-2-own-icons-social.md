---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Changed
---

- **`.share`, `.bookmark`, `.bookmarkFill` and `.menu` are Bloom's own glyphs:** `Icon(.share)` draws `ShareIcon` (and `BookmarkIcon`, `BookmarkFillIcon`, `MenuIcon`) from `src/icons/social`, as `.like` draws `LikeIcon`, matching Mention's post actions, not `RiShareLine`/`RiBookmarkLine`/`RiMenuLine`.
