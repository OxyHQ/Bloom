---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `bloom_lang::backend` (ADR 0003, from #1067): the checked program for the native backends, read-only. `backend::checked(source, filename, options)` parses, lowers and checks a file as `compile` does and returns the lowered tree and the checker's `CheckResult` (each expression's type and what each call, field, name, `await` and `try` resolved to), instead of emitting TypeScript. `compile`, `check` and `backend::checked` now share one front end (`check_source`), so a backend reads exactly what the TypeScript emitter reads and reports exactly its diagnostics.
