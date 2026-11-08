# Canvas contract checkpoint

This is an implementation checkpoint, not GoWay adoption acceptance. Baseline
935b8fb3 remains immutable. The GoWay candidate still needs the published additive
Bloom release, final web targets/material contrast, and a real Android map build.

The second Android run uses the explicit noncollapsable boundary and CanvasBackground.
It precedes the later controlled-snap proposal reconciliation; that behavior is
covered separately in the real browser, not claimed as device-tested.

Current API: Canvas delegates Screen; CanvasBackground owns one absolute renderer
part; CanvasPanel owns its own scope and a stable header/body/scroller. GoWay's
MapView background slot separates its renderer/layers from official attribution,
scale and error chrome. No Android blur capability is enabled.

| Subject | Evidence | Result / limit |
| --- | --- | --- |
| Existing GoWay map at 1440→900→390→320→1440 | Baseline ledger | Map object/canvas/camera retained; input remounted |
| First intermediate GoWay candidate | Local candidate/baseline.json and five PNGs | Input, map object and camera retained; not final background/target candidate |
| Local host in external scroll container | embedded-web-host.json; scripts/verify-canvas-viewport.mjs | Host x100,y230→y30 with unchanged size; viewport140→300 and local y40. Descendant scroll ignored; observers detach |
| Synthetic Pixel scene side→bottom | Android initial XML/PNG | Scene1, selection1, draft42 retained; not a map renderer |
| Android IME, side and bottom | keyboard-side / keyboard-bottom | Local viewport796→454dp, input above keyboard; no second keyboard subtraction |
| Android handle | bottom-after-ime XML | 126 physical px at density420 =48dp, SeekBar semantics |
| Android Back and gestures | peek-back / full-drag / body-scroll | Back collapses half→peek after IME dismissal; handle drag expands; body scroll stays full |
| Android inactive initial | initial uncompressed XML | INCONCLUSIVE: uncompressed UIAutomator includes nonimportant nodes; this did not establish TalkBack exposure or a regression |
| Android inactive current | current compressed XML + physical tap | Scene and Select object absent from compressed hierarchy; tap at old target leaves selection1; reactivation retains scene1 and draft42 |
| Controlled snap | controlled-browser.json; scripts/verify-canvas-browser.mjs | Reject returns to prop; delayed acceptance waits for prop. Fine/coarse handles24/44px; retained input and web inert focus exclusion pass |
| TalkBack | Not run | Compressed hierarchy and taps do not prove screen-reader reading/focus |
| Real Android GoWay map | Not run | Pan/pinch, official attribution, camera and selection require actual renderer build |
| iPhone | Not run | Deferred by user |

The APK had no INTERNET permission and negative HTTP/WebSocket probes had to
reject before the fixture scene mounted. android-initial.json records exact APK,
Hermes bundle, embedded Bloom sources, dependency lock, OS and viewport evidence.
It loaded Bloom source with the published17.22.0 native module, not published
candidate JS. Pixel orientation, density, font scale, brightness and other device
settings were not modified. Only so.oxy.bloom.canvaslab was installed/used and
force-stopped. The device was returned to the material agent.

The old22px handle becomes48dp Android,44 iOS/coarse web,24 fine web, without
hit slop crossing the search header. Peek includes that real height. The panel
uses approved Bloom Surface material; tint over varying map backing is an
intentional difference from GoWay's old opaque panel and still needs final
light/dark painted-contrast measurements.

Focused Bloom contracts:655 tests across10 suites passed. Build/package/freshness
passed with1558 literal export targets. GoWay maps155 tests passed; adapter gesture
and lift tests15 passed. These are scoped checks, not a full repository CI claim.

Final checkpoint follow-up: hidden header layout events preserve the last measured
peek until reactivation (five focused CanvasPanel tests pass). Private `.local/`
lab packages are excluded from the Jest module map. The final build and package
freshness gates pass; repository lint has no errors (existing warnings remain).
