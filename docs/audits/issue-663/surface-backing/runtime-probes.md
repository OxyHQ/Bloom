# Browser follow-up: passing group geometry, non-operational backdrop runtimes

This checkpoint retains the negative instead of changing approved paint to fit
a test environment. The active library source is 0d21ec4c; the added stories and
scripts are verification scaffolding. There is no Safari/iPhone acceptance.

## Chromium InputGroup

`runtime-probes/field-group/fields.json` contains 96 samples: 64 canonical inputs
(normal/grouped) and 32 explicit 24px/32px-line cases, in both themes, directions
and black/white backings. Every canonical sample clears 4.5. Grouped dark-white
xs/sm/md/lg measure 5.193/4.925/4.732/4.600. Exact painted foreground pixels were
found for every sample. RTL here verifies mirrored padding/layout with the same
Latin test string; it does not certify every script or font's glyph metrics.

## WebKit 27.2: isolate before attributing the failure

The dense fixture reports 3.386 for light text fields over black. A cold page
with just **one** TextField reproduces it with either body only or body+edge:
actual center [152,162,174], while the existing numerical recipe predicts
[179,189,201]. Forced baked diagnostic paint yields the predicted pixels and
4.606 contrast. The live field is not automatically baked because its color
transition makes that path ineligible. This is not a claim of automatic baking
adoption. All 16 cold variants have zero errors and advance RAF/timers.

`single-field.ts` records full viewport captures, ink-hidden captures, exact
foreground samples, actual body pixels, computed filters and timing counters.
The forced-baked variant uses the same pure calculation and the shared baked
CSS path, explicitly marked as a diagnostic mutation.

The decisive reduction is `minimal-backdrop.ts`, which has **no Bloom DOM,
pseudo-elements or React**. On black, the same backdrop chain still paints only
the tint. An ordinary CSS `filter` applied to an opaque black sample correctly
produces [98,98,98]. On stripes, backdrop leaves hard alternating bands while
ordinary filter blurs them. Both prefixed and unprefixed CSS support checks are
true. Thus a support declaration alone does not establish that pixels were
filtered. The mathematical recipe is not disproved by this runner's missing
backdrop effect.

Headless uses the downloaded runtime's WPE path. A separate headful process on
DISPLAY :0 uses its GTK path and reproduces both black and stripes. A separate
process with `WEBKIT_FORCE_COMPOSITING_MODE=1` reproduces them too. No global
environment or browser configuration was changed. Metadata includes the exact
launch path, flags, relevant environment, reported WebGL strings, computed CSS,
errors and RAF/timer counts. The reported “Apple GPU”/Mac user agent is runtime
output, not evidence of physical Apple hardware on this Linux host.

## Firefox 157

The field fixture has the same 3.386 light/black negative. The minimal no-Bloom
page reproduces the missing backdrop operation on black and stripes; ordinary
CSS filter works. The four minimum cases advance RAF/timers without errors.
Firefox and WebKit visual status remain **failed-runtime / not verified**,
not passes. This is not a general exception to contrast: translucent tint
without a functioning effect is still a real painted state that a conservative
owner range should evaluate. Any such correction needs its own comparison.

## Reproduce and scope

Start this worktree's Storybook on 6042 for `fields.ts` and `single-field.ts`.
`minimal-backdrop.ts` uses only `page.setContent` and needs no server. Set
`PLAYWRIGHT_PACKAGE_JSON`, `BROWSER`, `BROWSER_PATH` and `FIELD_OUTPUT`.
`HEADED=1` and optional comma-separated `PROBE_CASE` affect only the minimum
runner. Single-field and minimum variants each use a cold page/browser; the
full field matrix reuses its page across variants. Chromium's executable was
revision 1248; cached WebKit 2370 and Firefox 1555 expose the versions above.

The minimum isolates a limitation of these runtime/backdrop combinations; it
does not identify a browser vendor bug or establish behavior on real Safari,
iPhone or another graphics backend. Do not apply a user-agent workaround or
change material paint based on these measurements. Native map, TalkBack and
accessible text enlargement remain separate requirements.
