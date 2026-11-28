---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- A TS error class (`export class PollContractError extends Error {}`, any class whose base's name ends in `Error`) is a value and a type, never a component: `err is PollContractError` and `err as? PollContractError` of a caught error or a TS value are `instanceof` (Swift's `e is C`), so `if let e = err as? PollContractError { e.code }` reads its members. Before, its name was B0204 as a type. **CheckResult (additive):** `is_tests` holds `Ty::Foreign(<the class's name>)` for such an `is` or `as?`.
