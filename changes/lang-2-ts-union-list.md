---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A list of a foreign union whose first member is in parentheses, such as `[Tab]` with `Tab = Foreign<"(typeof NAMES)[number] | 'shop'">`, now emits `readonly ((typeof NAMES)[number] | 'shop')[]`. It emitted `readonly (typeof NAMES)[number] | 'shop'[]`, which Babel refuses ("'readonly' type modifier is only permitted on array and tuple literal types") and which means something else to tsc. A `keyof`/`typeof` operand is wrapped too (Mention: Profile/types' `ProfileTab`, 9 suites).
