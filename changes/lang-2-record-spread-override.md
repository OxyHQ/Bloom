---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `{ ..base, k: v }` is copy-and-change: a key written after the spread replaces base's field, as JS's `{ ...base, k: v }` does, where it was B0208 "`k` is given twice" when no struct was expected (Mention's settings/pages/feed, jobs/index, AddToListSheet, MerchantInstallmentSettings, EmojiPickerSheet). Only a key written twice is B0208. A literal whose first entry spreads a struct, and whose keys are all that struct's fields, is that struct, each key checked against its field's type, with or without an expected type.
