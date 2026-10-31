# Web avatar efficiency: shared presentation

Status: the integrated production pool passed physical mobile and RTX browser
checks. The measurements below distinguish integrated stories from earlier
prototypes; they are observations on the named devices, not universal guarantees.
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
once asynchronously through two reusable ROI read buffers and one ROI ImageData,
restores the exact premultiplied filtering input in a CPU scratch canvas sized to
the existing full atlas, and uses the existing Canvas2D crop. The readback is
bounded to eligible tiles plus one filtering texel; full-coordinate scratch
storage preserves the original filter coordinates. Larger destinations retain direct
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

## Integrated measurements

The [production evidence](avatar-web-production-2026-10-31.json) compares the same
stories on Pixel 8a, Android 16, WebView 148, at 411×914 CSS pixels and DPR 2.625.
These are short sequential paired samples, without a randomized thermal campaign.
The baseline contains the earlier shared renderer and flat joint upload fix;
the candidate includes the integrated presentation owner. Engine frames and GPU
batch completions are not measurements of distinct display scans. Document RAF
is measured separately as an indication of main-thread scheduling availability.

| Scene | Engine frames/s, before → after | Document RAF/s, before → after |
| --- | ---: | ---: |
| 48 mounted, 8 visible, 96 CSS px, stationary | 50.2 → 59.8 | 52.0 → 119.7 |
| Same scene while scrolling | 44.1 → 59.9 | 44.1 → 119.8 |
| Same scene with pointer input | 49.7 → 59.8 | 52.3 → 119.8 |
| 48 mounted, 8 visible, 64 CSS px | 19.3 → 51.2 | 19.3 → 82.4 |
| 24 sequentially attached, all visible, 96 CSS px | 23.6 → 40.0 | 24.0 → 107.6 |

The final scene deliberately retains its first Canvas2D destination alongside
23 WebGPU destinations: it does not replace the caller's canvas to improve a
benchmark. The smaller story keeps 64-pixel source tiles and 128-pixel output;
the 96-pixel story keeps 192-pixel backing. Geometry and draw counts are unchanged.

On Windows Chrome 156 with RTX 5090, the integrated 1/8/24-avatar cases retained
about 60 engine frames/s and 120 document RAF/s. They did **not** reduce measured
main-thread CPU time: the respective three-second samples rose from 194/461/290 ms
to 274/699/669 ms. This is a mobile presentation improvement with a desktop CPU
tradeoff, not a claim that every resource falls on every machine.

Paused avatars produced zero engine frames over 5.42 seconds (1.17 ms script
time); the hidden page produced zero over 18.72 seconds (10.21 ms script time).
The integrated editor lifecycle gate passed 15 cases, including retained pixels
and reuse of the same GPU canvas; eight lazy-asset/race cases also passed. The
physical source/story results do not independently prove a published deployment
or every cheap phone, ARM laptop, browser or thermal state.

## Earlier experiments and precision limits

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

The integrated measurements above use these actual components. Earlier isolated
prototype rates remain labeled as such in the experiment log. Generated web and
native artifacts are paired by the build manifest; deployment and optional
native-package adoption are separate from the browser performance measurements.
