# WebKit material frame stall, isolated from header actions

WebKit 2370 on Linux freezes native requestAnimationFrame delivery in the original AdaptiveActions story while timers continue and document.visibilityState stays visible. The original owner-review snapshot is retained in `original-adaptive-actions.json`. Removing the measuring nodes, actions, or whole body after the freeze, then resizing or taking a screenshot, did not restart frames. No cancelAnimationFrame calls were observed; ResizeObserver settled after 11 callbacks.

Before first paint, disabling only backdrop-filter avoids the freeze; disabling filter, box-shadow, animation/transition, forcing visibility visible or changing containment/transform does not. Disabling backdrop only inside the hidden probes, action group or entire header does not help. Disabling it only on the five fixture width-selector Buttons does. No production material was removed.

The `WidthControlsOnly` story reproduces this with five existing Bloom Buttons and no PageHeader or HeaderActions. Button.web.tsx, Surface.web.tsx and surface/web-material.ts have no diff against origin/main at the comparison. `scripts/reproduce-webkit-material-raf.mjs` captures native RAF before application code and counts a 1,200 ms interval after 1,500 ms settling:

| Fixture | Frame delta | Timer/visibility result |
| --- | ---: | --- |
| Five material Buttons | 0 | timers advance; visible |
| Same Buttons, backdrop disabled before paint | 75 | timers advance; visible |
| Existing single Button story | 75 | timers advance; visible |
| Existing ButtonGroup story | 74 | timers advance; visible |

All four cases have zero page errors. These comparisons isolate a material/compositor defect; they do not establish its full cause or a cross-platform performance guarantee. Physical iPhone behavior remains untested.

Only the width-selector controls in LocalWidth and ResponsiveNavigation now use native HTML buttons. The actual PageHeader/HeaderActions, visible material, descriptor actions, overflow menus and navigation are unchanged. With that fixture isolation, the full existing WebKit interaction runner passes both themes, widths240/320/390/640/900, zero-width cap, essential control identity, focus transfer, open-menu continuity and navigation390/900. Raw results are `header-actions-webkit.jsonl`. The material defect remains open independently of header behavior.

Reproduce with `BLOOM_PLAYWRIGHT_MODULE=<playwright> node scripts/reproduce-webkit-material-raf.mjs http://localhost:6136`. The original header runner needs no logic change; run it against the updated story fixture.
