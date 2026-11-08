# Horizontal focus visibility

Shared `ScrollViewport` owns focus reveal for both published neutral Toolbar imports and web ScrollArea imports. Native behavior is unchanged.

Chromium 1248, source Storybook port 6134: four cases cover LTR/RTL and reduced motion on/off. Each case tabs through all eight toolbar controls, waits 300 ms for settled geometry, narrows the toolbar host from 320 to 240 px while the last tool retains focus, focuses a nested table control, sends real horizontal wheel input, then focuses the last tool again. Every target fits its clipping ancestors. Outer panel and document offsets remain unchanged. `report.json` records measured bounds and wheel movement; representative screenshots are attached.

Run `BLOOM_PLAYWRIGHT_MODULE=<playwright package> CHROME_PATH=<chromium> node scripts/verify-horizontal-focus.mjs http://localhost:6134`. The `KeyboardReveal` story supplies the fixture.

The initial prototype failed the Properties focus check: RNW replaces the element scrollTo with its x/y imperative API. DOM left/top options silently reset the offset. Calling the DOM prototype method fixes the actual scroll owner; the regression suite also checks that the shadowed method is not called.

This verifies the shared source implementation. Published Nilo adoption and its RN Animated table owner remain separate consumer checks; editor issue 434 is not covered by this evidence.

WebKit 2370 also passes the same four cases and unchanged 300 ms settled checks (`webkit-report.json`). The first implementation queued another animation frame from ResizeObserver and left the focused tool clipped during resize under deferred WebKit frames. ResizeObserver now corrects directly after layout; focus corrects immediately and once more after browser focus scrolling. No wait budget was increased.

Independent review also passed all four unchanged cases on WebKit 2370 and Firefox 1555. `firefox-report.json` records the Firefox measurements. These are desktop browser engines, not physical iPhone evidence.
