---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A localization catalog rewritten within one tick of the kernel's coarse file clock is read again: the catalogs are cached on a hash of their content, not their modified time, which two writes in a row can leave unchanged (as on Seldon's CI VMs), so a key just added could be reported missing (B0840) until the next unrelated change. `clear_caches` now forgets them too.
