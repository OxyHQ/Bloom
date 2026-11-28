---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `@jsOptions` on a function keeps a TS options-object ABI. `@jsOptions func shouldScroll(tab: Tab, isWeb: Bool = false)` is called with labels in Bloom and takes one object in TS, `shouldScroll({ tab, isWeb })`. A defaulted parameter is an optional field, and when every parameter has a default the object may be left out. `bloom migrate` writes it on functions it migrates from an options-object signature, so their TS callers keep their calls. A parameter labelled `_`, a rest parameter and a type's member are B0106. **CheckResult:** `FnTy.options` is new. Natively a `@jsOptions` function is a function of labelled parameters.
