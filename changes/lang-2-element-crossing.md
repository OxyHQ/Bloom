---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **Silent wrong renders:** Bloom views reaching TS element positions crossed raw (React's "Objects are not valid as a React child", or an empty element read as present). Now each crosses as `toElement(view)`:
  - a modifier's object fields TS types `ReactNode` (`.header({ right: saveAction })`, a Dialog's `DialogHeaderConfig`; `buttons`, `logo`, `linkView`, `sectionIndex` too), from the spec's generated `elementFields` (mention13 header-right-node);
  - a TS prop typed `ReactElement | null` (an optional element stays one, generic components included) and a function value given where TS takes one returning an element (`renderCell: (item: T, size: number) => ReactElement`: `(...a) => toElement(renderCell(...a))`) (mention13 generic-ts-component-node-props);
  - an optional view (`meta: View?`) is `meta == null ? undefined : toElement(meta)`: `none` stays `undefined` (mention13 optional-view-to-reactnode).
