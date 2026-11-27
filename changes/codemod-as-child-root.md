---
package: '@oxy.so/bloom-language-codemod'
bump: minor
section: Changed
---

- The child of an `asChild` element outside a language view converts (`<Link asChild>{toElement(…)}</Link>`): its root takes the element's props on its outermost host. Inside a view it is still `Embed((render) => …)`, and a file that names `render` keeps it JSX (`as-child`).
