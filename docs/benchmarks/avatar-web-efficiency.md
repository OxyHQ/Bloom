# Web avatar efficiency: shared presentation

Status: the production presenter and pool integration are under final verification.
The physical rates below describe isolated prototypes on a pinned engine; they
are not yet an integrated Storybook or published-package performance claim.
Native results belong to [the separate phase-two report](avatar-efficiency-phase2.md).

## What changes

The existing WebGL renderer still draws the same geometry, materials, lighting,
MSAA, poses, gaze and actions at the same backing resolution. It already shares
its renderer and assets across an atlas. Profiling identified a second cost:
copying that atlas into many independently laid-out HTML Canvas2D elements.
Removing only those copies in a diagnostic raised a physical 24-avatar scene
from about 26 to 60 frames/s while keeping the WebGL draw workload. That ablation
is evidence of the bottleneck, not a shippable result.

The new presentation owner copies active atlas bounds once into a shared WebGPU
texture, then draws a bilinear quad into each avatar's existing canvas. One source
texel around the copied bounds preserves the original `drawImage` filtering,
including neighboring pixels outside the individual source rectangle. Inactive
avatars retain their last image. The surrounding DOM, clipping, pointer events,
labels and layout continue to belong to the existing component.

There is one WebGPU device and pipeline per loaded runtime/document, shared by
pools. The shader here only presents an image; it does not replace the 3D shader.
No frame-rate cap, animation substitution, resolution reduction or geometric
simplification is introduced. Device selection uses the browser default without
requesting a dedicated/high-performance GPU or browser flags.

## Routing and bounded work

The current integration admits WebGPU when a pool has multiple reserved avatars.
A new singleton retains Canvas2D, including the legacy one-WebView-per-avatar
native path. Adapter/pipeline/context preflight completes before binding a real
avatar canvas. Unsupported WebGPU, a reported software fallback adapter or failed
initialization retains Canvas2D. A canvas already bound to Canvas2D keeps that
mode and DOM identity. A retained WebGPU canvas can explicitly reacquire its mode
when attached alone; canvas context modes cannot be switched in place.

For fallback Canvas2D, the separate PBO path is restricted to at least four active
destinations of at most 128×128 backing pixels. It reads the eligible atlas bounds
once asynchronously, restores the exact premultiplied filtering input in CPU
storage, and uses the existing Canvas2D crop. Larger destinations retain direct
copying because physical tests showed regressions there. This is an explicit
size/count admission policy, not a user-agent guess or an assumed universal win.

At most two presentation batches may be outstanding. The engine stops issuing
additional presentation work until capacity returns; it does not accumulate an
unbounded queue or reduce resolution. Delivery checks entry identity, revision,
size, visibility and sequence before marking a frame painted or firing `onReady`.
Pause/offscreen state retains the last delivered pixels; pending obsolete updates
cannot claim readiness for a replacement character. PBO reads cancel when hidden.

GPU completion deadlines count visible, responsive event-loop time. Background
or OS suspension does not consume the five-second deadline. Device loss allows
one shared replacement; thirty seconds of healthy use restores the retry budget.
A repeated immediate failure reports the error instead of remounting forever.
After binding WebGPU, an error cannot silently rebind the same canvas to Canvas2D.

Normal release/disposal retains the last canvas image. It destroys owned atlas
textures and uniforms without waiting forever for a hung queue, but intentionally
keeps one idle shared device with no animation loop. It never calls `unconfigure`
on a retained destination, because that clears its pixels. Device and texture
limits are checked; allocations do not silently reduce quality.

## Evidence and limits

The [full experiment log](avatar-presentation-experiments.md) preserves rejected
paths as well as improvements. On Pixel 8a / WebView 148, an isolated 24-avatar
prototype at 192→192 pixels completed about 59.8 GPU batches/s versus about 28.2
direct-copy batches/s on the same source engine. A batch completion is a GPU
completion measurement, not proof of distinct compositor scans. Standalone
Chromium 159 on the same phone also improved, but its rates differ; neither
measurement guarantees performance on every device.

Exact Chromium 159 PNG comparison passed 120 character/state/scale cases,
15,390,720 pixels, both immediately after submit and after completion. WebView
148 was exact at 1:1 scale. Its scaled backend has an independently documented
quantization difference: at most 1/255 in premultiplied RGB, 2/255 alpha and an
observed 2/255 in RGB composited over black, white and actual Bloom surfaces.
The [separate precision gate and reviewed contact sheet](avatar-webgpu-webview148-quantization.png)
preserve this distinction; the exact Chromium and 1:1 gates were not relaxed.
Resolution, antialiasing and shape remain unchanged.

The production module also passed a real NVIDIA Blackwell browser lifecycle gate:
24 targets, sparse 1/24 copying with an exact full-atlas reference, retained PNGs
after release/dispose, 50 same-canvas mount cycles with one device and no remaining
owned atlas/uniform resources, and one successful recovery after actual
`GPUDevice.destroy()`. A second consecutive loss failed cleanly. See
[the result](avatar-webgpu-lifecycle-rtx.json) and
`node scripts/verify-avatar-webgpu-lifecycle-cdp.mjs`; this is not a mobile
integrated-pool test. Fifteen isolated module tests separately cover hung queues,
late initialization, hidden pages and OS clock jumps.

A browser interop hazard remains explicit: in the tested browser,
`Canvas2D.drawImage(webgpuCanvas)` after a frame boundary could read transparent
pixels while the actual displayed canvas and `toDataURL` PNG were correct.
Bloom's snapshot owners use `toDataURL`; their contract is tested directly.
This change does not claim arbitrary cross-context `drawImage` interoperability.

## Review in Storybook

`Characters / ManyAvatars` mounts 48 real `AgentAvatar` components at 96 CSS pixels.
`Characters / SmallAvatars` reuses the same mixed authored/catalog recipes,
per-avatar reaction/work controls and document scrolling at 64 CSS pixels. The
stories contain no performance instrumentation or alternate renderer. Inspect
actual canvas/context diagnostics outside the UI when testing backend routing.

Final acceptance still requires the integrated stories on physical mobile and
RTX hardware, scroll/pause/resize/replacement/error lifecycle checks, real cold
`onReady` snapshots, and generated-package validation. The rates above must remain
labeled prototype until those integrated results are recorded.
