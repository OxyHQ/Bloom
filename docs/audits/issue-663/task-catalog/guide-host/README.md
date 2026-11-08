# Packaged host guide follow-up

This corrects the blocking setup findings from the independent candidate preflight
at `consumer-preflight/catalog/PREFLIGHT.txt` on checkpoint 553e4960. It is a
candidate guide verification, not the final fresh-context evaluation of published
guides and not an Android/iPhone acceptance.

The canonical root is BloomProvider. Imperative SurfaceProvider and ToastOutlet
remain explicit and single; native portal/inert placement still follows the
existing provider/portal guides. The minimal button example has a local callback
and therefore needs no absent toast outlet. Measured optional ESM peer history
was moved intact into `web-optional-peers.mdx`, linked from Getting started.

## Reproduction and integrity

The artifact SHA256 is in `sha256.txt`. Its installed Bloom tree was compared
byte-for-byte against all 27,827 archive files: zero mismatches. The entire host
recipe was extracted from that tarball into a second clean directory, then only
the Bloom manifest dependency was replaced with that exact tarball path before
`bun install`. No source alias, cache patch or node_modules overwrite was used.
Later edits only add explanatory text/comments about the known fixed-host gap;
the tested executable recipe is unchanged. A separate registry install supplied
the shipped lockfile for the recipe's published 17.23.0 dependency; it contains
no candidate file path. Its `--frozen-lockfile` install, production build and
real browser gate also pass against registry Bloom 17.23.0; see
`published-runtime/report.json`. These newly authored guides are still unpublished
and this author-run check is not the final independent discovery evaluation. The recipe's published dependency
selection is web-only and does not attest the same versions as an Expo native SDK.

From a copy of the packaged `docs/examples/vite/`:

```sh
bun install
bun run typecheck
bun run dev --port 5183
# Another process, from Bloom:
BLOOM_VITE_URL=http://127.0.0.1:5183 node scripts/verify-vite-guide.mjs
# Then production:
bun run build
bun run preview --port 5184
BLOOM_VITE_URL=http://127.0.0.1:5184 node scripts/verify-vite-guide.mjs
```

Set `BLOOM_PLAYWRIGHT_MODULE` to the installed Playwright module if it is outside
this checkout; `BLOOM_VITE_OUTPUT` chooses the artifact directory. The evidence
used Chromium 156.0.8078.4. Reports and screenshots cover 1100×800 and 390×800.
The first working exploratory consumer was separate from the final extracted
consumer; its failures informed the recipe rather than being silently scored.

## Measured outcomes

Both dev and production pass real button clicks, state retention through resize,
CSS on actual Bloom Text (24 px font, 16 px padding), row direction/gap/padding,
all four registered FontFaces loaded and four HTTP 200 WOFF2 font responses.
Required component styles are adopted, not copied into inline tags. A real wheel
moves the bounded viewport 650 px while window scroll stays zero; pageerrors=[]
in both runs. `production-build.log` preserves the build's large-chunk warning:
this is functional setup evidence, not a bundle-size/performance claim.

The six task examples still compile from packed browser/native declarations;
the missing-export and native-source-export negative controls still fail as
intended. `catalog-check.log`, `package-check.log` and `biome.log` preserve gates.
The Canvas example now includes defined MapControls/MapLayerPicker state and
callbacks. It still does not deliver occupied-map or persistent-panel APIs.

## Negative observations retained

- Without the dependency worklet transform, the independent preflight reached
  “Passed a function that is not a worklet” after passing typecheck.
- Reanimated dependency JSX in `.js` failed production parsing until the explicit
  JSX transform. RN-SVG's Buffer import needed its browser package. Reanimated's
  Jest probe needed an explicit absent JEST_WORKER_ID, not a global environment
  replacement. The exploratory Worklets alias was removed; the final host uses
  Reanimated 3's plugin and does not directly install Worklets.
- A layered Tailwind utility import left real RNW Text at 14 px/0 padding while
  raw HTML utilities appeared correct. Unlayered utilities produce 24 px/16 px.
- `fixed-auto-negative.log` preserves the unmodified public composition
  `<AppShell scroll="fixed"><Screen><ScreenScrollView>…`: no local owner,
  overflowing content and zero wheel movement. AppShell's non-panel branch does
  not publish its bounded host. The pinned 17.23.0 example uses the public
  `documentScroll={false}` override explicitly; a separate shared-owner fix is
  required before removing it. This is not a permanent consumer workaround or
  proof that the automatic host contract already works.

Final publication, clean-context discovery from that publication, native peers,
physical devices, SSR/CSP and router history remain separate acceptance gates.
