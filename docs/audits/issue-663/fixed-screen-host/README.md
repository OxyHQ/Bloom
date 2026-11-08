# Non-panel Screen host inference

Baseline: published Bloom 17.23.0, preserved in the catalog follow-up's
`guide-host/fixed-auto-negative.log`. A non-panel AppShell with scroll=fixed
bounded its frame but did not publish that choice to Screen. Screen auto inferred
document flow, so long content was clipped and wheel input did not scroll.

The source candidate publishes only ScreenHost geometry for web fixed/document
modes. It preserves active/restoration/navigation policy, drops ancestor scroll
refs/metrics for the new viewport, and keeps one provider position across mode
switches. It does not publish panel insets/material metadata into legacy routes.
Panel hosts, container mode and native retain their existing host value.

`artifact.json` identifies the candidate packed from base a0ba40c6, verifies all
installed files against the archive and checks the source behavior marker in the
installed module. This is a source candidate, not a published release.

## Reproduce

Use the Vite host recipe in catalog checkpoint d0a4fd58, replacing its Bloom
manifest entry with this built tarball before a fresh install. Copy `Host.tsx.txt`
to `src/main.tsx`; it deliberately uses Screen auto with no documentScroll prop.
Run Vite on 5186 and execute:

```sh
BLOOM_HOST_URL=http://127.0.0.1:5186 node scripts/verify-fixed-screen-host.mjs
```

`BLOOM_PLAYWRIGHT_MODULE` may identify an external Playwright installation;
`BLOOM_HOST_OUTPUT` chooses the output folder. No package cache modification or
production source alias is used.

Chromium 156.0.8078.4 passes real wheel events, fixed→document→fixed transfers
650→650→850→850, window=0 during fixed scrolling, and input node/draft identity
through the switches. Both full-width and 640 px centered host cases pass. The
latter still has the documented 100dvh fixed height. Screenshots capture the
returned owner at offset850; their empty middle is intentional synthetic content.

A preliminary 480 px parent-height assertion failed: fixed mode is documented as
100dvh on web, not parent-sized. A second fixture with 80 px vertical margins
also retained window offset80 after document collapse. Those fixture assumptions
were not scored as product regressions or silently changed in the engine. Final
narrow-host evidence uses the existing fixed-height contract and no extra vertical
margins. Arbitrary shorter parent sizing is not claimed.

48 existing/new AppShell switching tests passed; an additional targeted run
covers three host tests (49 total in file, 46 intentionally unselected), including
independent ancestor refs/metrics, active=false policy, stable route identity and
unchanged panel/container host identity. Build/package/freshness and Biome pass;
the adoption matrix was regenerated after test imports. Native behavior was not
changed or physically revalidated. Final published consumption remains pending.
