# Published composer browser transitions — 2026-11-10

Scope: issue #663 §8, web portion of rapid phase/theme/attachment/long-input
transitions and draft/focus/selection retention. This does not complete either
cross-platform checklist item. No issue text or checkbox was changed.

The isolated consumer uses npm Bloom **18.4.0**, not this checkout's source.
`receipt.json` records the verified registry integrity and 28,185 identical
installed files. The fixture locks its dependencies, disables React Compiler,
and builds a production Vite bundle. No production component was changed.
See [reproduction instructions](../../../scripts/loader-web-lab/README.md).

The runner asserts native DOM input identity, focus, full draft and backward
selection endpoints/direction for ComposerPill and AgentChatComposer through
width, theme, attachment fixture state, idle, submitting, streaming, stopping,
error and complete. Each receives a real Stop click followed by typing. Retained
Screen and reduced motion steady-state clocks are checked after Animation.ready.
The nine changes use actual pointer clicks separated by 60 ms after each click;
this is not a precisely timed 60 ms application scheduler or fade-unmount test.

Eight full-viewport captures per passing browser pause the existing CSS clocks
at four times in light/dark. Selected PNGs and the isolated loader's SVG snapshots
are archived alongside reports; PNG hashes in each report identify the capture.
The viewport is 900×1200 CSS pixels, DPR 1, desktop default text scaling. It is
**not** matched to Pixel density/font scale. CSS time is not a physical native
path alignment. No optical-parity, native quality, frame-budget or video claim.

The host is WSL2 Linux x64. Playwright **1.64.0** pairs with Chromium revision
1248, Firefox 1555 and WebKit 2370. Exact browser versions are in reports. Earlier
exploratory runs used a mismatched Playwright client and are not acceptance
results. Firefox's earlier pending-pause measurement is retained as a runner
negative: waiting for Animation.ready resolves that sampling race, without any
product change or claimed maximum pause latency.

No ADB was used: the authorized Pixel 8a was not confirmed available, and a
reported Pixel 10 Pro is not a substitute authorization. Android continuation
requires the authorized device. Physical iPhone testing remains deferred by the
user. Alia, menus/drawers, keyboard, rotation and unmount during fade remain
outside this fixture's evidence.

## Result

- **Chromium 156.0.8078.4: passed**, 27 recorded cases; no page errors.
- **Firefox 157.0: passed**, the same 27 cases; no page errors.
- **WebKit 27.2: failed/blocked**, the first Width pointer action times out after
  10 seconds waiting for the element to be visible, enabled and stable. The page
  mounted and the input accepted the long draft before that action. No page error
  was reported. This repro does not establish whether the cause is material,
  SVG animation, browser scheduling or the automation host. The gate uses actual
  hit testing; it does not bypass the failure using DOM click or forced actions.

WebKit's matching-client negative prevents a universal web pass. Further isolation
should compare the same fixture with a diagnostic paused/static loader and then
isolate painted layers; neither a renderer fallback nor a production material
change is justified by this timeout alone.
