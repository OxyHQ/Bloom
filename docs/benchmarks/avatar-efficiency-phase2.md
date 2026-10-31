---
title: Avatar efficiency — phase 2
description: Exact rendering optimizations, shared native presentation, and measured limits.
---

# Avatar efficiency — phase 2

These changes start from `e0fee324`, which already has the approved smooth finish,
deferred work assets and retained portraits. Earlier download and memory savings
are not counted again here. Meshes, shaders, lighting, backing resolution, animation
times and the four-sample color target remain unchanged.

## Less work for retained scenes

Destination canvases already retain paused portraits. The renderer now bounds depth,
occlusion, color, multisample resolve and presentation to the active atlas rectangle.
A physical-pixel guard preserves depth-normal and occlusion sampling at its edges.
Logical slots, pointer coordinates and crop transforms stay unchanged. Uploads also
exclude unused instance rows without adding one GL call for every texture row.

For the measured scene of 24 avatars with one active slot at the first cell:

| Work per frame | Before | After |
| --- | ---: | ---: |
| Submitted pose and instance upload bytes | 50,304 | 1,920 |
| Atlas pixels inside the rendering bounds | 409,600 | 18,496 |
| Submitted triangles | 18,804 | 18,804 |

That is 96.2% fewer uploaded bytes and 95.5% fewer pixels inside these pass bounds.
It is **not** a claim of 95.5% less total GPU time. Allocated atlas dimensions remain
unchanged, and separated active cells can span a much larger rectangle. The previous
phase already removed the retained slots' geometry submissions.

On the RTX 5090 control, both versions reached the 60 fps cap. The color pass including
resolve had a median GPU query interval of approximately 0.040 ms before and 0.012 ms
after in this sparse case. Such intervals include command and upload gaps; they do not
isolate shader execution. Warm SwiftShader runs at DPR 1 also reached 60 fps in both
versions. Higher pixel pressure showed a directional benefit with substantial variation;
there is no stable multiplier or general device guarantee.

The full conditions, repeated runs and limitations are in the
[phase 2 measurements](./avatar-efficiency-phase2-2026-10-31.json).

## Exact reuse of matching idle poses

Several live avatars can have the same sampler and the exact same idle time. The engine
counts those clocks before sampling and computes one private pose for a matching group.
Every avatar receives its own matrices and field arrays, so its eye, gaze and reaction
state cannot mutate a neighbor's result. There is no clock rounding or change in cadence.

Only duplicate **explicit idle clocks** take this path. Independent clocks, singleton
samplers, work and reaction keep direct sampling. A weakly keyed cache retains one pose
and one candidate time per sampler, rather than a history. Additional duplicate cohorts
at other times may deliberately miss this optimization.

Alternating, warmed Node runs measured the sampler and copies over 600 frames:

| Scene | Direct sampling median | Shared sampling median | Evaluations per frame |
| --- | ---: | ---: | ---: |
| 24 matching clocks, one preset | 71.10 ms | 24.54 ms | 24 → 1 |
| 24 matching clocks across eight presets | 72.37 ms | 52.59 ms | 24 → 8 |
| 24 independent clocks | 44.22 ms | 44.01 ms | 24 → 24 |
| One avatar | 1.253 ms | 1.255 ms | 1 → 1 |

The first two rows reduce this specific sampling work by 65.5% and 27.3%. These are
microbenchmarks, not total frame CPU, GPU time or FPS. The independent and single-avatar
results were effectively unchanged. Full samples and mutation checks are recorded in
the [pose-sharing evidence](./avatar-pose-sharing-2026-10-31.json).

## Less allocation when decoding geometry

Index decoding now concatenates typed ranges directly, or reuses a matching single
range from the immutable asset buffer already retained by the vertices. It avoids
creating an array of boxed numbers per range, flattening those arrays, and converting
the flattened result back to a typed buffer. Draw order and Three's index-width rule,
including the reserved primitive-restart value 65535, remain identical.

All 671 source and catalog parts, comprising 5,450,982 indices, match the previous
decoder byte for byte and use the same component types. Seven alternating warmed
Node runs measured a median of 171.39 ms before and 3.19 ms after for this operation
across the complete catalog. This excludes file reads, other geometry setup and
shader compilation; a real scene loads only its required assets. It is neither a
whole-startup nor an FPS result. The [decode measurements](./avatar-index-decode-2026-10-31.json)
retain the individual samples; `scripts/test-avatar-index-buffer.mjs` checks all
assets and synthetic width/empty-range boundaries.

## First presentation and shared controllers

The alpha-fit pass previously delivered its neutral reference pose as the first image,
even when the caller requested a different held pose. A paused renderer could then stop
before presenting the requested pose. The original browser baseline reproduced this:
17,517 of 36,864 pixels differed between its first held-idle delivery and a second request
for that identical pose.

Fitting is now preparation. The engine schedules the requested pose and delivers only
that image through its output callback. `fitPasses` records the preparation work; startup
measurements must still include it. An intentionally empty preview uses its authored
crop and becomes quiescent instead of repeating an impossible alpha fit. First delivery
now matches the later cached delivery exactly in both browser and injected-host tests.
See the [frame-fidelity evidence](./avatar-native-frame-fidelity-2026-10-31.json).

Browser and native hosts share slot playback and latest-intent reconciliation. Pause and
reduced-motion constraints apply immediately during optional loading; superseded work
cannot hold up a replacement character or start a stale action. A completion-microtask
race that could lose an update immediately following a no-op update is also covered.
The still-image cache version changes so old first-frame captures cannot survive the fix.

## Web startup responsiveness

The one-time alpha fit now uses a web pixel-pack buffer and a GPU fence. The UI polls
completion without a blocking GPU wait, then applies the same alpha threshold and
crop equations before delivering the requested pose. At most two tiles occupy temporary
readback buffers. Preset/layout changes, disposal and context loss cancel obsolete reads;
all success, cancellation and failure paths release buffers and fences. A failed read
settles the affected pool entries through their error callback. The injected native host
explicitly retains synchronous fitting because its GL bridge lacks these web operations.

In an alternating fresh-browser SwiftShader diagnostic, the synchronous fit control had
maximum heartbeat gaps of 586 and 893 ms; asynchronous fitting had gaps of 347 and 189 ms.
The blocking `readPixels` calls took 380 and 626 ms in the control, versus effectively
zero at submission with a fence and at most 0.1 ms copying the completed buffer. Other
first-render work still caused long tasks. First delivery was 655/923 ms for the control
and 859/609 ms for the asynchronous path: this is UI unblocking, **not** a demonstrated
startup-time or warm-FPS gain. The [individual samples](./avatar-async-fit-2026-10-31.json)
and `scripts/measure-avatar-fit-readback.mjs` preserve the isolated comparison.

Separately, immutable joint matrices now arrive at Three as the same 384 flattened
floats. An actual `WebGLUniforms` test confirms byte-identical uploads while eliminating
24 `Matrix4.toArray` calls per draw. GPU upload count and shader equations stay unchanged;
this CPU saving alone does not establish a production FPS improvement.

## Native adoption and remaining scope

The optional Android companion renders this same engine into a framebuffer and presents
its tiles into independently composed native surfaces with GPU blits. Native composition
continues to own clipping, transforms and scrolling. There is no per-frame screenshot
transfer through JavaScript. One-time crop fitting and explicitly requested snapshots
can still read pixels.

This path requires installing the private companion and its declared peers, rebuilding
the application's native binary, and serving the matching complete runtime manifest.
It is not enabled fleet-wide merely by updating Bloom JavaScript. Size buckets preserve
the existing 64/128/320 resolution policy instead of promoting every small avatar to a
large hero's backing size. The package, capability checks and installation contract are
documented in the [native companion](../../packages/avatar-native/README.md).

The Android presenter does not establish iOS support. Without a compatible installed
adapter, the existing WebView route remains available and its per-document live-context
limit remains relevant. Physical native results must identify whether they measure the
isolated engine, the companion or the final React Native component; those are distinct
claims.

The physical Pixel 8a audit used authored idle at 192 backing pixels and MSAA 4:

| Workload | Observed result | Counter and scope |
| --- | --- | --- |
| Eight independent WebViews | 36.84–37.03 frames/s each | Engine submissions; an upper bound on presentation |
| Eight shared native surfaces, warmed after remount | 57.26 updates/s each | Actual surface updates over 10 seconds; one context |
| Twelve shared native surfaces | 57.11 updates/s each | Separate capacity sample over five seconds; one context |
| Installed companion tarball, eight surfaces | 58.75–58.95 updates/s | Warm repeat; same engine binary as the final lifecycle audit |

The initial native windows were slower (37.2–44.2, then 50.2–58.0 updates/s), so the
warmed results do not describe cold startup. PSS snapshots were 373,532–385,240 KiB
for the RN debug host versus 496,509 KiB for the Java host plus WebView renderer;
their different host overhead prevents treating this 22–25% difference as a universal
memory saving. The paths also have different final compositor scaling chains; raw
engine fidelity does not establish identical final screen pixels across those chains.

The final compatible package passed cold first-frame equality, paused/offscreen zero
updates, resume of all twelve mixed surfaces, snapshots, and complete context/view
cleanup. Mixed work was an appearance/lifecycle check, not a performance benchmark.
Artifact hashes, timing-versus-final-package distinctions and reproducible fixtures
are recorded in the [physical native audit](./avatar-native-shared-context-2026-10-31.json).

## Verification boundaries

- 57 source-rendering cases compare 45,936,640 pixels with zero changed RGBA values,
  covering all eight authored presets and four catalog combinations at multiple sizes.
- Four injected-host cases match browser output exactly, including transparency, sparse
  slots and restoration, with no DOM observer subscriptions.
- Eight pose-sharing renderer cases compare 786,432 pixels exactly and assert that the
  intended sample-count reduction actually occurred. Numeric tests mutate every copied
  matrix and field to prove output isolation.
- Browser lifecycle and deferred-work gates cover retained images, resize, input,
  immediate constraints, latest intent, failure and disposal. Shared-controller tests
  also run without a DOM.

The historical full capture-based Node collection still requires untracked `.local`
inputs: its previously recorded run had 132 `ENOENT` failures across 16 scripts. Those
missing captures were not fabricated or silently removed. The focused self-contained
and browser gates above do not imply that the historical capture collection passed.
