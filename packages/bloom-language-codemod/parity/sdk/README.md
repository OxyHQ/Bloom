# SDK className → style parity

Bloom 23 takes no `className`. The Oxy SDKs (`@oxy.so/services`, `@gemies/sdk`, `@syra.fm/sdk`) moved
their NativeWind classes to React Native styles with Bloom's colour tokens. This folder is how each
converted element was proven to draw as before. Not a package; run from `packages/bloom-language-codemod`.

1. `node parity/sdk/sites.mjs <sdk-package> <dir>/sites.json` lists every `className` / `*ClassName`
   JSX attribute in the SDK's `src`.
2. The class resolver gives each class string's native style at the app preset's 16px rem, colours as
   Bloom tokens: `RESOLVE_INLINE_REM=16 BLOOM_BASELINE=<a Bloom 22 checkout>
   scripts/no-nativewind/resolve/resolve.sh -f <dir>/strings.json > <dir>/resolved.json`.
3. `node parity/sdk/convert.mjs <sdk-package> <dir>` rewrites the static sites into a sheet per file
   (`StyleSheet.create`, or `createTokenStyles` when a colour is involved), following what Bloom 22
   drew (a Bloom 22 `Text` keeps its inline default size and colour unless the class claims them; a
   heading under a class drew no ramp and becomes `Text` with `role="heading"`). It writes
   `<dir>/table.json` and flags what it leaves for hand conversion; `manual.json` overrides a site.
4. `parity/sdk/run.sh <dir>` renders every site of `table.json` (and the hand-converted cases of
   `extra.json`) before — the element with its class, NativeWind's runtime over the app's compiled
   Tailwind, Bloom 22 for a Bloom component — and after — the element with its style under Bloom 23 —
   light and dark, native and web, through the codemod's parity suites.

`<sdk>/` holds each SDK's table, hand cases and overrides as converted.
