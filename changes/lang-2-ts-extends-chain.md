---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A TS interface's fields are its whole `extends` chain's, as tsc reads them: `minDate` of `DatePickerProps extends PickerBaseProps extends CalendarConstraintProps` (Bloom's date picker) was B0205 "has no field", since only one base up was read.
