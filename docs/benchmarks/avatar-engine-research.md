# Avatar reconstruction evidence (historical)

This is the chronological research record, including superseded implementations, measurements, hazards and residuals. Commands referring to the retired executable are historical evidence, not current build instructions. The current engine and usage contract are in `docs/agent-avatar.mdx`. No original engine executable or compatibility renderer ships or is required by the current runtime.

## Reconstruction research — 2026-10-11

The requirement is many different, independently animated characters with the
same customization, appearance and interactions. A page that scrolls smoothly
while most characters freeze does not satisfy it. Neither does replaying the
same idle phase on every copy. The owner confirmed that the original engine
sources are unavailable and requested a maintainable rebuild without binary
patches or concealed feature reductions.

### Correct baseline and measured limits

The research worktree starts at `796fdfe5`, the shared-renderer integration
branch. `origin/main` at `a800ce72` did **not** contain that renderer. Earlier
experiments based on main measured the older four-resident budget; they cannot
establish the latest renderer's limits or visual parity. The Lottie and idle-cache
prototypes remain in the separate `avatar-lottie` worktree.

The latest adapter already shares one WebGL context, programs, immutable
textures, rendering WASM and preparation worker. It also has asynchronous GPU
fences, an exact preparation cache and controller continuity through Work.
Recommending these as new optimizations would repeat work already present.

The [new instrumented baseline](./benchmarks/avatar-research-baseline.json)
uses 96 CSS pixels, DPR 1 and the existing quality policy. The 24-character case
contains 24 RGB-customized recipes over four authored bodies, not 24 unique body
meshes. Chromium used SwiftShader software rendering. These are individual
diagnostic runs, not physical-GPU capacity or power measurements.

| Characters | Time until all ready | Presented images per character in about 5 seconds | Physical contexts / programs |
| --- | --- | --- | --- |
| 1 | 1.07 s | 151 | 1 / 9 |
| 4 | 1.71 s | 101 each | 1 / 9 |
| 24 | 33.43 s | 5 each | 1 / 9 |

At 24, the adapter still owns 2,424 buffer objects, 220 textures and 97
framebuffers. One context does not make every resource or render pass shared.
The final sampled batch spent 3.9 ms submitting/presenting and 313.8 ms waiting
for completion and task dispatch. That wait is **not** a GPU timer. In the
four-character steady sample, Canvas2D copies took only 46.8 ms total: the large
synchronous copy stall measured in the older adapter is not the same bottleneck
here. The bounds scan runs when framing is invalidated, not every frame.

`scripts/profile-avatar-engine.mjs` records API calls, actual output copies,
upload ranges, context counts, native geometry statistics and Chrome CPU
profiles. Emscripten buffer uploads pass a large heap view plus a subrange;
counting the full view incorrectly reports gigabytes of uploads. Reproduce with
Storybook running and `BLOOM_PUPPETEER_MODULE`/`CHROME_PATH` pointing to local
installations. Output defaults to `.local/avatar-engine-profile`.

### Options and evidence

| Approach | Fit for this requirement |
| --- | --- |
| Lottie or raster clips | Useful for predetermined artwork. Replaying captured frames does not preserve arbitrary 3D pose, gaze, combinations of parts or interruption semantics. The documented Lottie renderer matrix only partially supports 3D layers in HTML; it is not a mesh/material engine. [Lottie feature matrix](https://github.com/airbnb/lottie-web/wiki/Features). |
| Rive | A reasonable authoring choice for a redesigned character system, not an automatic conversion. Its current experimental GPU Canvas supports 3D but requires a separate WebGL context per canvas and cannot share the same GPU Canvas file instance across canvases. This does not solve our current crowd architecture by itself. [Rive GPU Canvas](https://rive.app/docs/runtimes/web/gpu-canvas). |
| One renderer, many characters | The right resource boundary. Three.js documents a single canvas/renderer for multiple views because contexts cannot share their resources. Our new engine should own this directly, without pretending one physical context is many native contexts. [Three.js multiple scenes](https://threejs.org/manual/pages/multiple-scenes.html). |
| Instanced or batched drawing | Share compatible geometry/material work; keep color, transform, morph weights and animation state per instance. InstancedMesh groups identical geometry; BatchedMesh permits different geometries using a shared material. Neither automatically implements independent skeletal blending, transparency ordering or our hair shader. [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), [BatchedMesh](https://threejs.org/docs/pages/BatchedMesh.html). |
| Baked animation textures | Can move animation work onto the GPU while storing per-instance clip/time parameters. Babylon's documented implementation currently lacks animation blending and interpolation between baked frames. It is therefore not a complete replacement for interrupted reactions, smooth transitions and live gaze. A custom blended rig would require its own fidelity tests. [Babylon baked animations](https://doc.babylonjs.com/features/featuresDeepDive/animation/baked_texture_animations/). |
| Worker rendering | OffscreenCanvas can move rendering work away from the UI thread. This improves responsiveness but does not remove the geometry or fragment work. The old renderer already prepares geometry in a worker. A new worker renderer needs an explicit command/input protocol and lifecycle handling. [OffscreenCanvas](https://web.dev/articles/offscreen-canvas). |
| WebGPU | A possible later backend for persistent resources, GPU animation and reusable command submission. Render bundles target submission overhead; they do not make expensive shading free. Browser, OS and device support still need capability detection. Choose it from measured backend results, not from an assumed speed multiplier. [Chrome WebGPU architecture](https://developer.chrome.com/blog/webgpu-io2023), [support overview](https://developer.chrome.com/docs/web-platform/webgpu/overview). |

The actionable WebGL practices are reducing redundant state changes, batching
compatible work, bounding resource lifetime and keeping synchronous queries out
of hot paths. Lowering resolution or hair density is a separate visual tradeoff,
not an exact optimization. Measure on multiple drivers: WebGL submission can be
CPU-bound even when the application is described as GPU-heavy.
[MDN WebGL practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices),
[Emscripten optimization guide](https://emscripten.org/docs/optimizing/Optimizing-WebGL.html).

### Clean reconstruction boundary

`scripts/inventory-avatar-assets.mjs` reads the packager's file table offline,
checks archive integrity and declared asset hashes, and extracts only ordinary
JSON/PNG references. It never runs WASM. The package contains 392 files, including
108 recipes; 100 recipes include material/eye-placement parameters. They do not
include a documented skeleton, animation curves or mesh export. Proprietary
mesh/fitting records are inventoried rather than interpreted as a guessed format.
Bloom's own generated contours and tube geometry are also reusable inputs.

The new Storybook engine under `runtime/avatar/` is a **technical
prototype**, not a visually approved replacement. Its geometry, materials and
animation are ordinary source code. The new dependency on Three.js is confined
to development; no public component or production renderer changes backend.
The research uniform-interception patch was retired when reconstruction became
the chosen direction; the original runtime assets remain unchanged.

The production design should separate a versioned asset catalog, immutable GPU
resources, independent per-character animation/interaction state, and a renderer
that groups compatible draws. An eye blink or paint change must not rebuild the
whole character. Reactions and Work need explicit entry, interruption, completion
and exit states. A shared renderer must respect clipping, overlays, scrolling,
pointer capture, reduced motion, context loss and disposal. Native also needs a
shared rendering host: one WebView per avatar would restore the duplication.

### Acceptance before replacement

Compare complete pose sequences and actual rendered pixels at 48/96/240 CSS
pixels, DPR 1 and 2, light/dark backgrounds and all body/eye/accessory
combinations. Validate materials, fur silhouette, shadows, blink/gaze, drag,
signature reactions, Work props/outro, interrupted transitions and editor changes.
Faster test shapes do not prove equal visual quality or complete behavior.

Benchmark 1/24/48/100/200 independently configured characters, both idle and
mixed actions. Keep size, quality and resolution fixed across crowd sizes.
Record actual per-avatar presentation cadence and p95/p99 gaps, input-to-visible
response, cold/warm readiness, main-thread tasks, resource growth and cleanup.
Treat 30 presented fps per character and responsive 60 Hz UI as proposed targets,
not achieved claims. Separately measure physical GPU duration with supported
timer queries and discard disjoint samples; CPU call duration and fence latency
are not substitutes. [Khronos timer-query specification](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/).

Run sustained tests on an integrated-GPU laptop, an Apple laptop and a physical
Android device, including background/resume and memory after repeated edits.
The available headless environment cannot certify battery use, thermal stability
or production throughput on those devices.

### Original-asset fidelity checkpoint — 2026-10-11

The procedural crowd is only a throughput experiment. Its invented silhouettes,
eyes, materials and motion do **not** establish equivalence with the original.
The `New Engine / Fidelity` story instead loads original authored geometry and
material resources into a separate Three renderer. Its reference PNG is displayed
only in the comparison column; the new avatar is live geometry, not that image.

`scripts/export-avatar-geometry.mjs` calls the shipped preparation API **offline**
and validates the decoded assembly with the existing parser. It exports eight
presets into versioned JSON and typed vertex/index/morph/fur buffers. The first
integrated preset has six meshes, 9,408 vertices, 18,792 surface triangles and
8,192 original fur seeds; every exported geometry byte matches its source.
Roughness/reflectance fields are corroborated through controlled public-API
changes. The original controller, skinning clips and activity transitions are not
recovered by this export.

The offline graphics inspection scripts capture compiler inputs, material maps,
named reference-pose parameters and the presentation crop. The new renderer
imports none of those inspection hooks, native adapters or WASM. The shader port
replaces UBO interfaces with explicit uniforms and adds our instance inputs;
lighting, fur, display transform and contact-occlusion equations are retained.
The four shared maps are pile/cards and two lighting lookup tables, not avatar
portraits or animation frames. Live depth, half-resolution AO and its resolve are
computed for the scene. A final GPU pass reproduces the original presentation
crop. Recovered blue motion uses absolute per-part world transforms plus correct
inverse-transpose normals, carried in reusable per-instance textures. At this
earlier checkpoint, other presets still used provisional rigid instance motion;
the Fidelity action integration below supersedes that limitation.

Fixed-pose check, 320×320 CSS pixels, DPR 1, Chromium/SwiftShader:

| Measured property | Result |
| --- | --- |
| Visible bounds in both images | x 57–264, y 29–291 |
| Mean absolute RGB-channel error, complete image | 0.232 / 255 |
| Mean absolute RGB-channel error, foreground union | 0.546 / 255 |
| Maximum individual channel error | 40 / 255 |
| Changed pixels | 30,808 / 102,400 |

These are **not identical pixels** and are not an animation-parity result. Small
edge/interpolation differences remain. `scripts/verify-avatar-fidelity.mjs`
asserts matching bounds, foreground mean error below one 8-bit level, zero WebGL
errors and no original-engine requests. It writes both images and an 8× amplified
difference image. This tolerance is a regression gate for this fixture, not a
substitute for the complete acceptance matrix above.

The renderer now integrates all eight exported presets and batches repeated
instances of each part. `scripts/verify-avatar-mixed-catalog.mjs` compares all
eight in one 1280×640 scene against their original 320×320 captures: every visible
bounding box matches, and mean foreground RGB error ranges from 0.553 to
0.833/255. This includes Gus's separate furry orb and the spectacles' furry tuft.
The original Canvas2D copy may clip its source/destination (Gus); reconstructing
its full affine crop avoids stretching the clipped image or sampling a neighbour.

The same gate changes the crowd through 8/24/48 instances and back, checks stable
GL buffer/resource counts and draw calls for the eight loaded families, verifies
independent color/look targeting and asynchronous preset replacement, and asserts
zero live GL buffers after disposal. Instance attributes have fixed capacity and
are reused instead of replacing GPU-backed attributes on every count change.
Transforms are evaluated once per avatar per frame; unchanged offsets/pigments
are not uploaded each frame. The UI exposes presets, mixed crowds, selection and
body color. These are explicit preset assets, not yet arbitrary recipes.

`scripts/verify-avatar-lifecycle.mjs` checks actual frame suspension outside the
viewport, resumption, context loss/restoration with identical fixed-pose pixels,
and idempotent resource disposal. Hidden-document events suspend rendering too;
the current browser gate directly exercises viewport and context transitions.

Blue now plays a recovered idle segment and a finite reaction from observations
of the actual app runtime. Its idle segment has exactly equal quiet endpoints;
its reaction clamps at the observed terminal pose. Numeric tracks contain TRS and
named deformation channels, not rendered images or GPU command streams. Separate
output poses and textures preserve independent clocks, and the last terminal
reaction stops frame submission. `verify-avatar-authored-motion.mjs` checks the
actual 14 uploaded parts of two avatars: world/normal errors below 3e-8 and exact
parameters/signature fields; changing one avatar changes 55,197 pixels while the
other changes 0. These tests establish sampler/upload independence, not complete
controller equivalence.

At that initial blue-only checkpoint, the other seven had provisional motion. Captures identified additional
animated eye color/roughness and palette-closure channels, ongoing reaction
motion, and no proven idle loop closure. The renderer now uploads those material
channels per part and instance. A synthetic material-only browser signal changes
49,420 pixels in one avatar and exactly zero in its neighbour; seven part uploads
match within 2.4e-8. This proves plumbing, not original expression timing. The
exporter still rejects unsupported channels, shader transitions and unresolved
endpoints instead of inventing a loop or ending. The compact
`docs/benchmarks/avatar-motion-diagnostics.json` records the gaps. Wall-clock
observations have 83–100 ms gaps; a fixed 1/60s offline public-render clock was also
verified with 721 frames over 12s for Alfred. That improves sampling density but
does not by itself reconstruct its controller. Work actions, continuous gaze,
interruptions, other reactions and complete recipe mixing remain unimplemented.

Offline public Character observations and the app's runtime observations must be
distinguished: the app adapter changes controller modes, so direct Character
tracks alone cannot establish app motion parity. The reference pose/crop is
explicit test data; it must not become a hidden fallback for arbitrary recipes.

Reproduce the checkpoint from this worktree:

```bash
node scripts/export-avatar-geometry.mjs --all
node scripts/capture-avatar-reference-shaders.mjs
node scripts/build-avatar-fidelity-assets.mjs
node scripts/build-avatar-occlusion-assets.mjs
for preset in alfred purple_heart lime_frog coral_monocle gus blue_spectacles lime_headphones; do
  AVATAR_PRESET="$preset" AVATAR_CAPTURE_OUTPUT=".local/avatar-original-materials/$preset" \
    node scripts/capture-avatar-reference-shaders.mjs
done
node scripts/build-avatar-catalog.mjs
node scripts/build-avatar-lods.mjs
AVATAR_SCENARIOS=idle,reaction node scripts/capture-avatar-runtime-motion.mjs
node scripts/build-avatar-motion-assets.mjs
node --test scripts/test-avatar-geometry-export.mjs scripts/test-avatar-occlusion.mjs scripts/test-avatar-motion.mjs
node scripts/verify-avatar-fidelity.mjs
node scripts/verify-avatar-fidelity-ui.mjs
node scripts/verify-avatar-mixed-catalog.mjs
node scripts/verify-avatar-lifecycle.mjs
node scripts/verify-avatar-authored-motion.mjs
node scripts/verify-avatar-authored-crowd.mjs
```

Browser scripts use `CHROME_PATH` and optional `BLOOM_PUPPETEER_MODULE`, with
Storybook running at port 6006. Run performance measurements alone, after source
changes and HMR have settled; a concurrent browser check invalidates the CPU
comparison. The crowd gate keeps 112 CSS pixels per cell, all cells visible,
unique pigment and animation phase, and the same geometry/quality for each count.

The isolated authored-material run is recorded in
`docs/benchmarks/avatar-fidelity-checkpoint.json`: 1/24/48/100 independently
colored instances measured approximately 60.0/4.12/2.09/1.02 fps on SwiftShader.
All visible avatars share one WebGL context and 16 scene draw calls, with
9 geometries, 9 textures and 7 programs in that earlier single-preset run; the
later changes add crop and animation textures (current totals below). Pause stops
submissions and disposal
releases those resources and the actual context. This is **one body/preset with
independent colors and phases**, not a many-geometry or mixed-action benchmark.
The original appearance costs more than the procedural experiment. At that checkpoint, hardware
throughput, diverse-asset performance and complete controller parity remained open.
The bounded Windows hardware measurements below address only the first two on
one desktop GPU; they do not establish the overall performance targets.

#### Original detail levels and density checks

Small avatars (CSS size ≤ 128) now use the original preparation quality 0 meshes;
large ones use quality 1. These correspond to the app's public quality 1/2 enums.
Both are exported byte-for-byte, not decimated by the new renderer. Detail assets
load on demand and stay cached across count/size changes. Blue small meshes use
4,712 vertices instead of 9,408; the 112 CSS px / DPR 2 comparison drops total scene
triangles from 40,988 to 22,204, including depth, fur and presentation passes.

Backing resolution follows the original: 64–512 pixels, with DPR limits 1/1.5/2
for CSS sizes ≤ 64 / ≤ 128 / larger. At 320 CSS px / DPR 2 the backing is 512; at 112 CSS px / DPR 2 it
is 168. Fur density and shader viewport use those physical dimensions. At a new
preset/detail/resolution, alpha bounds are measured once from the actual rendered
geometry, using the original threshold 24 and 1.22 padding; the result is cached
and shared by repeated avatars. No per-frame or per-avatar image readback occurs.
The 320 px exported fit remains a named fixed-pose fixture, not a generic fallback.

Paired-pose renderer comparisons (the native startup pose itself changes with
resolution) pass exact visible bounds and foreground mean error 0.536/255 at
320 CSS px / DPR 2 and 0.716/255 at 112 CSS px / DPR 2. These do not establish temporal parity.
Use `AVATAR_SIZE`, `AVATAR_DPR`, `AVATAR_CAPTURE_OUTPUT` for capture, and
`AVATAR_REFERENCE`, `AVATAR_CAPTURE_STATE`, `AVATAR_FIDELITY_OUTPUT` to compare
the matching pose fixture. The capture-state substitution is test-only and is
never imported into the live renderer.

The current isolated 112 CSS px / DPR 1 run, with native small meshes and recovered blue
idle motion, measured 60.0/7.72/3.99/1.93 fps for 1/24/48/100 avatars on SwiftShader.
The previous high-detail/provisional-motion run measured 60.0/4.12/2.09/1.02 fps;
they are different implementation checkpoints, not a controlled attribution to
one optimization. The current run has 16 draw calls, 9 geometries, 17 textures and
7 programs regardless of count; the extra seven textures carry per-part animation
parameters for all instances. Every visible cell is painted, pause stops actual
submissions and disposal releases the actual context and all tracked resources.
These software measurements do not validate hardware, laptop power/thermal
behaviour or mixed-action throughput. The Windows checkpoint below adds a
bounded desktop hardware measurement. A Linux Chrome probe using the documented
[`--enable-gpu` option](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/gpu/using-gpu-hardware-in-headless-chrome.md)
failed EGL initialization;
software measurements must not be presented as physical GPU throughput.

#### Custom color is not a native recipe-parity test

The new color control tints the existing authored body and fur in linear space.
The original runtime's explicit `bodyColor` path intentionally demotes the named
preset (`runtime.mjs`, `applyAppearance`): observed blue changes geometry/pose,
roughness, reference-pose fields and non-body shader variants too. A capture with
`AVATAR_BODY_COLOR` is retained as evidence, but the fixed-preset fidelity gate
rejects that input rather than treating those different recipes as the same
character. Arbitrary editable recipes remain an open compatibility requirement.

#### Windows hardware checkpoint and explicit frame budget

A dedicated Windows Chrome 155 headless session reaches the physical RTX 5090
through ANGLE Direct3D11. The WebGL unmasked renderer confirms that backend;
the Linux EGL failure above does not imply absent GPU hardware. Evidence:
`docs/benchmarks/avatar-hardware-checkpoint.json`.

At 112 CSS px / DPR 1, with every cell visible and independently colored/phased,
1/24/48/100/200 blue avatars measured about 120 fps. Mixed scenes of all eight
presets at 8/24/48/100/200 also measured about 120 fps. These are five-second
samples near the observed browser cadence, not measured maximum GPU capacity.
Blue uses its recovered idle; the other seven use provisional motion, so this
is not full mixed-action throughput. Single-preset draws stay at 16; eight-preset
draws stay at 121, with 66 geometries, 17 textures and 11 programs. Paused pixels,
all-cell painting and actual resource/context disposal pass in both scenarios.

The live engine now defaults to 60 fps; Storybook offers 30, 60 and uncapped
screen cadence. This is an explicit work budget, not an advertised rendering
speedup. At 200 mixed avatars the 60 fps mode measured 59.93 fps, roughly halving
submissions relative to the uncapped test while retaining all instances, geometry
and shading. Simulation follows elapsed time; input and appearance changes bypass
the continuous-frame budget. The browser UI gate verifies actual submission
pacing, immediate color updates even at a diagnostic 1 fps limit, pause and reset.

The crowd gate is explicitly uncapped by default for throughput measurement;
`AVATAR_FRAME_RATE=60` selects the budgeted run. `AVATAR_CROWD_MIXED=1` enables
eight families, `AVATAR_CROWD_COUNTS=8,24,48,100,200` selects counts, and
`AVATAR_BROWSER_URL` connects a dedicated test Chrome over CDP (the script closes
that browser). Local launch remains SwiftShader. RTX 5090 results do not establish
laptop fluency, energy use, sustained thermal behaviour or complete animation parity.

#### Finite motion review and affine transform support

`Agents/Agent Avatar/New Engine/Motion Review` now plays and scrubs captured
idle/reaction segments for all eight presets. The original PNG appears only at
its exact observed timestamp. Playback stops at the recording boundary and labels
that boundary explicitly; it does not pretend the action ended or wrap an unknown
period. The crowd story links to this separate review. Its local fixtures are not
loaded by the normal motion catalog and are not production animation assets.

Semantic-motion v2 adds QR rotation, signed scale and three shear coefficients.
The explicit 3×3 normal-basis correction retains native floating-point residuals.
All 16 earlier diagnostic sequences now preserve their sampled transforms, with
maximum world error about 1e-15. Singular transforms and orientation changes are
rejected. Quaternion interpolation avoids the 180-degree matrix-blending collapse;
existing v1 blue runtime clips still work. No tolerance was widened to discard shear.

Fresh review captures use a fixed native 1/60s render clock and synchronized PNGs
from the same presentation. 48 keyframe comparisons have foreground mean channel
error 0.527–0.664/255. 43 have equal thresholded bounds; five retain an exactly
pinned one-pixel boundary difference (frog reaction at3s, coral/spectacles idle and
reaction at0s). These shortfalls are reported and equality-gated, not described as
identical pixels. Source frames, camera/light constancy, topology and shader
variants are checked; interpolation and full controller behavior remain separate
questions. Evidence: `docs/benchmarks/avatar-motion-review-checkpoint.json`.

The renderer's explicit pose override copies into owned per-instance buffers, so
reusing a caller's sampler output for another avatar cannot alter the first.
Held poses submit no continuous frames. The review creates a new canvas on preset
or sequence replacement because a deliberately lost WebGL context must not be
reused. Browser gates cover pose ownership, actual independent pixels, all eight
replacements, playback/pause, finite endings and disposal.

Paired fixed-clock idle/reaction observations identify an exact return to idle
for the seven non-blue presets 2.333–2.833s after the accepted command. Identity is
matched by geometry SHA, never draw order; complete DrawBlock, SkinBlock and
FrameBlock values agree along the observed return tail. Those tails last only
0.167–0.667s. Continued native rendering therefore does not alone prove the
reaction is still active, but the finite tail also does not prove arbitrary phase,
future behavior or interruptibility. Blue follows a different path and has missing
presentations at the end; they are not filled or relabeled as idle.

Reproduce one local review fixture (repeat for the other preset names):

```bash
AVATAR_PRESET=lime_frog AVATAR_FIXED_STEP=60 AVATAR_SCENARIOS=idle,reaction \
  AVATAR_IDLE_SECONDS=4 AVATAR_REACTION_SECONDS=4 \
  AVATAR_CAPTURE_OUTPUT=.local/avatar-runtime-motion-review/lime_frog \
  node scripts/capture-avatar-runtime-motion.mjs
AVATAR_PRESET=lime_frog AVATAR_MOTION_DIAGNOSTIC=1 \
  AVATAR_MOTION_SOURCE=.local/avatar-runtime-motion-review/lime_frog \
  AVATAR_MOTION_DESTINATION=.local/avatar-motion-observations-review \
  node scripts/build-avatar-motion-assets.mjs
AVATAR_PRESET=lime_frog node scripts/build-avatar-observation-review.mjs
node scripts/verify-avatar-observation-review.mjs
node scripts/verify-avatar-pose-overrides.mjs
node scripts/verify-avatar-motion-review-ui.mjs
```

The pixel gate accepts `AVATAR_REVIEW_PRESETS` as a comma-separated list; the UI
gate requires all eight fixtures. Capture diagnostics use a minimal same-origin
HTML document with no Vite HMR client; only that navigation is fulfilled offline,
then interception is disabled before original modules/workers load. This protects
recordings from editor reloads and is never imported into the replacement renderer.


#### Fidelity action integration — 2026-10-11

Fidelity now exposes recovered idle and reaction clips for all eight presets,
individual actions and “Reaccionar todos”. The seven custom presets return to
idle after their reactions. Blue retains its separately observed terminal
reaction behavior. The reconstruction remains a development story, not a new
production Avatar backend or a claim of complete feature parity.

Fresh paired observations cover 14s of idle and 6s of reaction per custom preset,
at an explicit native 60Hz clock. The old exporter searched only 7.5–10s cycles;
it therefore missed the approximately 5.95s breathing cycle. The new exporter
requires an **exact quiet seam across every part/material/camera/skin block**,
selects the body period using whole-cycle agreement, and retains the actual
captured eye events. Their recurrence is independent of breathing: frog,
monocle and spectacles have a full-cycle palette-closure difference of 1. This
is measured, not hidden; repeating these observed segments does not establish
future stochastic blink timing. No pose is crossfaded to manufacture a seam.

Reaction completion is now measured against an independent, phase-matched idle,
not “the original stopped rendering”. Every block agrees for another
2.167–2.667s after return. The selected endpoints are 2.333–2.833s after the
command. The runtime resumes precisely that idle phase; repeated clicks use one
pending request per avatar. **Entry from an arbitrary current phase still uses
the recorded entry pose**. A second Alfred observation proves why a naive
additive idle layer is wrong: the original suppresses breathing during the
reaction core and has frozen-entry/live-exit transitions. Do not describe the
current controller as exact for arbitrary interruptions or phases.

“Computer · azul” now runs the original blue episode: nine added meshes for
hands, panel, content and shadows; 421 semantic poses at 60Hz, including camera
change and disappearance of the props. Geometry, indices, material channels,
visibility and render order are explicit assets. There are no runtime WASM
imports, captured draw commands, video frames or pose PNGs in the renderer.
At that checkpoint Computer supported blue only and held the observed final pose after
its seven-second episode. Automatic continuation at an equivalent native idle
phase remains unresolved. The other activities and free part customization
remain outstanding.

The shared renderer carries 16 RGBA texels per part/instance: normal basis,
parameters, deformation, color/roughness, palette closure, reference pose,
coverage, camera/visibility, touch-light channels and world transform. Original
opaque hands draw before fur; panel/content/shadows use premultiplied blending
and no depth writes. Entirely invisible prop batches are skipped. Fur budgets
follow each instance's projected scale, including Computer camera motion.

Universal materials revealed a WebGL failure that numerical pose tests could
not catch: **every active sampler must have a correctly typed binding, even if
a runtime branch does not read it**. Missing referencePalette aliased the shadow
sampler; uninitialized fallback texture types produced GL_INVALID_OPERATION and
invisible props. The disabled cast-shadow path now has an explicit comparison
DepthTexture, and contact occlusion reads the real live depth target. Its inverse
projection restores the current avatar's coordinates from the shared canvas.
AO sampling/resolve quality is selected using **each avatar's backing size**,
not the whole crowd's dimensions; camera scale and noise phase are local, and
taps cannot cross into another avatar's cell. At 112 backing pixels the resolve
uses nine taps instead of the 25 incorrectly selected for a large canvas.

Validation on this checkpoint:

- 29 numerical/export/resource tests pass, including all seven new actions and
  every Computer pose, plus Storybook TypeScript.
- All eight reactions visibly animate in a browser; changing one modifies zero
  pixels in its held neighbour. Queued actions complete and return as specified.
- All 48 existing synchronized idle/reaction image comparisons still pass with
  their five previously pinned one-pixel boundary differences.
- Five Computer comparisons, including both positions in a two-avatar scene,
  have composited foreground RGB mean error 0.515–0.561/255 and alpha error at
  most 0.276/255. The panel's right edge remains exactly one pixel short in the
  specified samples; the gate pins that exception, not a general ±1 tolerance.
  Both neighbour checks change zero pixels; GL errors and original-runtime
  requests are zero. The actual Fidelity button completes the episode with zero
  visible props and one context.
- An isolated Windows Chrome / ANGLE D3D11 / RTX5090 run with all eight recovered
  idle cycles measured 59.98, 59.97 and 60.08fps at 8, 48 and 200 avatars, 112 CSS
  pixels, DPR1, a 60fps cap and approximately five seconds per case. Each case
  used one actual context, 121 draw calls, 66 geometries, 75 textures and seven
  programs. This is not a laptop, battery, thermal or mixed-activity benchmark.

Evidence and explicit limitations:
`docs/benchmarks/avatar-actions-checkpoint.json`. Earlier hardware figures above
remain historical measurements of the earlier provisional-motion implementation.

Rebuild each custom action after its paired captures:

```bash
AVATAR_PRESET=alfred AVATAR_FIXED_STEP=60 AVATAR_SCENARIOS=idle,reaction \
  AVATAR_IDLE_SECONDS=14 AVATAR_REACTION_SECONDS=6 \
  AVATAR_CAPTURE_OUTPUT=.local/avatar-runtime-motion-actions/alfred \
  node scripts/capture-avatar-runtime-motion.mjs
AVATAR_PRESET=alfred AVATAR_MOTION_DIAGNOSTIC=1 \
  AVATAR_MOTION_SOURCE=.local/avatar-runtime-motion-actions/alfred \
  AVATAR_MOTION_DESTINATION=.local/avatar-motion-observations-actions \
  node scripts/build-avatar-motion-assets.mjs
AVATAR_PRESET=alfred node scripts/build-avatar-action-assets.mjs
node scripts/capture-avatar-computer.mjs
node scripts/build-avatar-computer-assets.mjs
node scripts/build-avatar-computer-shaders.mjs
node scripts/build-avatar-occlusion-assets.mjs
node --test scripts/test-avatar-actions.mjs scripts/test-avatar-computer.mjs
node scripts/verify-avatar-actions.mjs
node scripts/verify-avatar-computer.mjs
```

Browser scripts use the Puppeteer/Chrome environment variables documented above.
Repeat the three action commands for the other six custom preset names. The
fixed-clock observations are offline authoring inputs, never runtime dependencies.


#### Computer across the eight presets — 2026-10-11

Fidelity now loads each preset's own Computer assets. The original restriction
was twofold: the motion/catalog loaders allowed only `blue_beret`, and geometry
loading assumed six base meshes. Bases actually contain 3–9 meshes and Gus and
blue_spectacles have two fur parts. The loader now excludes the explicit set of
base mesh IDs when attaching Computer props; it never reuses the blue body or
assumes that fur belongs only to mesh zero.

Each preset contributes its original nine activity meshes and a 421-pose,
seven-second semantic episode, including native camera changes, hand movement,
panel/content/shadow visibility, touch-light and material channels. Frog, coral
and blue_spectacles additionally animate color/roughness and palette closure. Export fails on
unsupported animated channels, skinning, projection changes, geometry/shader
changes, inconsistent render state, or cyclic painter order. Original geometry
bytes, every observed pose and every named material field are checked against
the offline observations.

The `Computer` button operates on the selected avatar. `Computer todos` starts
all avatars, and `Acciones mezcladas` distributes Computer, reaction and idle.
Action buttons are disabled while a new model/scene is loading, preventing a
click from reaching the previous model before the requested one is ready.
Reactions and idle remain available for all eight models. The finite Computer
episode still holds its observed final pose: phase-correct automatic idle,
repeated working cycles, arbitrary interruptions and the other activities remain
unresolved. This extension does not establish full original-controller parity.

The browser comparison gate runs five cases per preset: entry, working and
return keyframes, plus both cell positions beside a **different** preset.
Changing the active avatar's pose/color must leave the held neighbour's pixels
unchanged. It also clicks Computer for every model in the actual Fidelity UI and
checks simultaneous Computer and mixed actions across all eight models.
Exact-boundary checks pin named original/replacement coordinates for measured
raster differences; they never grant a general one-pixel tolerance. The purple
heart's top fur reaches alpha22 where the original reaches alpha20 in two
keyframes, crossing the bounds cutoff of20; this is recorded as a rendering
shortfall, not geometric or visual identity.

Capture and export each Computer preset with `AVATAR_PRESET=<preset>` on
`scripts/capture-avatar-computer.mjs` and `scripts/build-avatar-computer-assets.mjs`.
`test-avatar-computer.mjs` validates the corresponding fixtures. Run
`verify-avatar-computer.mjs` without a preset filter for the full visual/UI gate.
`AVATAR_CROWD_ACTIVITY=work` on `verify-avatar-authored-crowd.mjs` measures the first
two seconds of simultaneous Computer episodes, after loading; the default idle
scenario remains five seconds. Pause checks preserve the sampled action pose.
Neither scenario establishes laptop, battery or thermal performance.


The body color control now also updates both Computer hands for each instance.
Hands are identified by the original semantic material tag (-40), rather than
blue-specific mesh IDs. Their original paint differs from the coat's: simply
copying the coat multiplier makes a pink body acquire purple hands. A custom
color therefore normalizes each hand's original albedo to the selected linear
paint. With no custom color the multiplier is exactly one, preserving the
original palette. Roughness, reflectance, specular response, screen and clothing
remain authored. This adds no draw calls, contexts or per-frame allocations;
pigment attributes update only when appearance changes.

`scripts/verify-avatar-hand-colors.mjs` renders isolated hands and isolated
Computer props beside a held neighbour for all eight presets. It checks the
selected linear paint at the uploaded material boundary, actual changed hand
pixels, zero changed panel/content/shadow or neighbour pixels, and exact pixel
restoration when resetting appearance and restoring the held pose.

Validation evidence for this extension is collected in
`docs/benchmarks/avatar-computer-all-checkpoint.json`. Numerical contracts total
43 tests (26 existing and 17 Computer checks). The Computer image suite contains
40 cases; 32 have exact bounds, while eight pin specific one-pixel raster edges
(blue panel, purple top fur and headphones bottom fur). The headphones endpoint
has alpha20 versus the original21 at (156,291), crossing the same bounds cutoff.
These are acknowledged residuals, not pixel-perfect parity.

An isolated RTX5090 / Windows Chrome / ANGLE D3D11 run of simultaneous Computer
at 8, 48, 200 instances measured approximately 56.40, 56.37, 57.08 fps respectively,
with a 60 fps cap, 112 CSS pixels, DPR1 and two-second active samples. Every size used
one real context, 209 draw calls, 138 geometries, 148 textures and 8 programs. These are
warmed measurements: the first attempt reached the idle draw count before its
end check and was rejected. Cold-start latency is not established by the retry.
The report records the actual renderer, sample times, counts and cleanup.

**Test harness hazard:** never pass full PNG pixel buffers to a failing Node
`assert.deepEqual`. Formatting the difference between two 640×320 RGBA images
consumed about 100 GB RSS on this host and did not respond promptly to SIGTERM.
Use `assert(actual.data.equals(expected.data), message)` and write the images
separately. The comparison remains exact without constructing the diagnostic
megabyte-by-megabyte. Also, `resetAppearance()` resets motion and pose overrides;
a color-reset pixel comparison must restore its held pose before comparing.

### Computer return and lossless motion loading — 2026-10-11

Computer now resumes idle in all eight presets instead of holding the last
sample of its finite clip. The independently captured original reaches the same
complete idle state at 3.266666667 seconds after Start: 225 consecutive frames
agree in geometry identity, shader defines and the entire DrawBlock, FrameBlock
and SkinBlock. No channels are excluded. `assets/motion/computer-returns.json`
records the source hashes and phase mapping. `motion-controller.ts` preserves
elapsed time past that boundary; a delayed frame can also finish a queued
reaction without restarting its clock. Held editor frames remain inspectable.

Blue's old wall-clock observations have been replaced by paired fixed60
observations. Its 8.8-second idle cycle has an exact quiet seam and at most
7.11e-15 residual across 313 overlapping full-state frames. Its reaction genuinely
holds: the original stopped presenting after 2.616666667 seconds and remained
ready, unsuspended and without pending work through another 10.4 native seconds.
The reconstruction retains that hold rather than inventing an idle return.

The browser return gate exercises Computer in eight presets and reactions in
seven, three episodes per case. All 45 transitions paint identical pixels at
the action endpoint and corresponding idle phase, change zero pixels in a held
neighbour and resume RAF afterward. This proves the handoff; it does not prove
entry from arbitrary phases, premature Stop, repeated working cycles or native
interruption behavior. Those remain open alongside gaze/drag and free part mixing.

Runtime animation loading now uses one binary bundle per preset, shared across
instances and geometry detail levels. Numeric channels use Float64 views over
one backing buffer; byte-identical channels share storage. This preserves every
exported number, keyframe, quaternion, material value and camera sample. It does
not quantize, decimate, bake pictures or reduce frame rate. Samplers only read the
shared channels; each avatar still owns its output pose.

Across all eight presets, motion plus Computer data decrease from 37,822,598 to
9,607,280 bytes (74.6%). Offline gzip sizes decrease from 8,174,066 to 1,592,367
bytes (80.5%); this is a size comparison, not a measured production network or
startup-time speedup. JSON authoring sources remain available for inspection.
The binary gate compares every number and 123 sampled poses per preset against
those sources, including fractional times and times beyond each clip endpoint.
Runtime requests are checked for exactly one binary load per exercised preset,
with no JSON animation fallback and no original-engine requests.

After changing animation sources, regenerate in this order:

```bash
node scripts/build-avatar-blue-return-assets.mjs
node scripts/build-avatar-return-assets.mjs
node scripts/build-avatar-eye-blink.mjs
node scripts/build-avatar-reaction-gaze.mjs
node scripts/build-avatar-motion-binary.mjs
```

The seven custom action exporters and Computer exporters precede those steps
when their captures change. Binary tests fail on stale bundles. A partial return
export requires an explicit separate destination; it cannot overwrite the
complete runtime index. Runtime loading also rejects missing/invalid return
phases instead of silently leaving an avatar frozen.

Validation: `test-avatar-return.mjs`, `test-avatar-motion-controller.mjs` and
`test-avatar-motion-binary.mjs`, plus the existing geometry, motion, occlusion,
actions and Computer tests; `verify-avatar-motion-returns.mjs` for the actual
renderer/controller boundary; `verify-avatar-computer.mjs` for original pixels
and the real Fidelity controls. The existing Computer raster residuals above
remain; whole-engine pixel parity is still not claimed.

The completed checkpoint is `docs/benchmarks/avatar-return-loading-checkpoint.json`:
73 Node tests and Storybook type checking pass; 40 Computer image comparisons,
eight individual UI returns, mixed actions, eight reaction checks, 16 hand/prop
color checks and lifecycle recovery pass. A fresh warmed hardware run measured
58.44/60.25/56.47 fps at 8/48/200 active Computer avatars over approximately two
seconds, with the same RTX5090, 112px/DPR1, single context and 209 draw calls.
These short samples establish continued crowd operation, not a statistically
significant FPS improvement over the previous checkpoint.

### Pointer reconstruction checkpoint (2026-10-11)

Fidelity now owns real pointer capture: drag stays on its initial avatar across
cells, release/cancel/lost capture/window blur end the gesture, and cleanup
removes the listeners. Selection works in the fixed comparison too; dragging is
available when movement is enabled. The separate preliminary Engine Lab has not
been promoted to the fidelity renderer.

Blue's unpressed hover is a native no-op: 481 paired adapter observations agree
in every Draw/Frame/Skin value. Its drag model is source-viewport displacement
(after the original alpha fit), with Float32 input arithmetic, yaw gain 1.7 and
limits ±0.32, pitch gain 1.5 and limits ±0.22. The transform is conjugated by the
native eight-degree Y basis; release decays by `0.88^(60 * elapsedSeconds)`.
Three independent fixed60 axis captures plus a held-out fixed30 sequence cover
reversal, limits, release, regrab and cancellation. Across all parts, world
matrix residual is below 2.46e-7 and normal residual relative to each matrix's
largest component is below 2.94e-7. Normal **absolute** error reaches 3.08e-6
on a squashed blinking eye: its inverse normal matrix contains values near 18.
Camera, skin and every material channel are identical. This is numerical
controller evidence, not a claim of whole-image/native pixel identity.

The runtime applies drag without another context, new motion assets or clips.
Blue hover schedules no frame. Unaffected pointer controllers do no decay work.
After release, an otherwise held pose stops submitting frames. An initial
1e-8-radian cutoff changed painted pixels and was rejected. The 1e-12 cutoff
passes exact painted comparisons at the maximum 512px backing in all eight
presets, reference/Computer/reaction poses and all four angle-sign combinations
(96 cases). This proves those sampled poses; it does not prove every possible
pose/color/backing. The real-browser gesture changes 107,136 pixels in the
selected 512px cell and zero in its held neighbour, returns exactly to the
original pixels, and distinguishes tap from drag. Actual Fidelity DOM dragging,
45 action returns, context recovery and mixed-catalog buffer/disposal checks
also pass.

A separate wake-up regression exposed a stopped-clock bug: after 800ms with no
RAF, the first new reaction was already at 0.8666 seconds. The renderer now clears
its last frame timestamp when it becomes quiescent. Actual reaction and Computer
requests both present time zero when awakened; offscreen/context suspension keeps
its existing clock handling. Gate: `verify-avatar-quiescent-actions.mjs`.

**Idle body, ocular hover and reaction entry/exit composition are integrated.**
Unlike blue, all seven custom presets track unpressed pointers.
`AvatarGazeController` reproduces their body spring (`omega = 22`, yaw target
`(clamp(float32(x), 0, 1) - .5) * .11`, with pitch gain `.07`). Body rotation adds gaze and drag
angles, keeps the body's original translation, and has one presentation of
spring latency. World transforms rotate about the body pivot; normal transforms
use only the rotation. This distinction is verified for every non-ocular part
in all seven presets, including fur and accessories. Input is committed after
the presented frame's spring advance, preserving the observed presentation order.

`test-avatar-gaze.mjs` and `test-avatar-pointer-attachments.mjs` prove the body
and non-ocular matrices plus unchanged material/camera/skin channels. The browser
checks 35 actual uploaded poses. In Alfred, Purple Heart and Gus, no additional
eye transform was observed: 15 complete-image comparisons against native pose
matrices have mean absolute channel error at most 0.000078125/255, maximum one
channel value, and at most 27 changed pixels in a 320px cell; held neighbors are
pixel-identical. This is a comparison using the independent renderer for both
pose paths, not a new whole-engine/native-renderer pixel-parity claim.

Eye attachments in Frog, Spectacles, Headphones and Coral now use an independent
critical spring (`omega = 55`), native per-geometry anchors and projected ocular
transforms. Frog/Spectacles decode the exposed blink morph; Coral moves only its
catchlights. Headphones' fixed eyelid parameters do **not** expose its blink:
481 contemporaneous native observations identify that hidden scalar, and all
358 samples align exactly with the existing idle clock. It ships only in the
Headphones motion binary and becomes a semantic `eyeBlink` field on the body;
no other avatar or original engine is loaded. Rebinding a sampler recreates its
pose even when the part count is unchanged, so reaction-first instances acquire
the idle-only channel when they return.

Twenty ocular Node tests compare every part's world/normal matrix and material
channels, including separate axes, blink, outside-viewport clamps, and both
native quality levels. Native `Character.setQuality(1)` selects the LOW geometry
(profile key `0`); `setQuality(2)` selects HIGH (profile key `1`). Reversing that
mapping produces plausible eye movement around the wrong anchors. The browser
adds 35 low-detail and 20 high-detail whole
image comparisons: maximum channel difference is one, held neighbors are exact.
These compare reconstructed versus captured-native poses on the same independent
renderer. They do not claim complete original-renderer pixel parity.

Native activity mode ignores hover and drag, including Start/Stop. The renderer
therefore applies neither correction while sampling Computer. Forty actual
browser poses across eight presets retain exactly the same uploaded matrices,
material fields and painted pixels under down/move/up/hover. This does not prove
the separate adapter's arbitrary-phase handoff back to the interactive mode.

Reaction entry/exit now composes the body's and eyes' live gaze in the renderer.
The incoming gaze is frozen and fades out over 0.18 seconds; after the native
preset-specific core, current live gaze fades back in over 0.18 seconds. The
springs continue advancing while their visual contribution is suppressed.
The neutral frame is weighted breathing translation, the 8-degree basis, and
the current reaction body's scale. It is not the animated body's full frame:
using the latter moves eyes incorrectly during an expression. Exported metadata
follows the actual adapter presentation clock (command at native3, frozen idle
at3.0166667, transition origin3.0333333), detected from the observed repeated
body transform rather than guessed from clip duration.

Headphones also carries its hidden reaction blink: frozen incoming closure
multiplied by the entry envelope, live closure multiplied by the exit envelope.
An additional original capture starting during blink validates the composition;
141 corresponding direct/runtime idle observations have exactly equal exposed
Frog morph channels. The exported scalar belongs only to Headphones' own packed
motion. Missing reaction neutral data or its hidden blink fails loading rather
than silently disabling eye movement. A paused reference does not reuse stale
animated blink data.

Ten native reaction composition tests include all seven presets, vertical
reversal and blink-active entry. See `docs/benchmarks/avatar-gaze-diagnostics.json`.
Browser verification adds 73 cases: 45 native-observed reaction poses, 14
explicitly synthetic XY checks against the pure composer and 14 real packed
sampler checks. The 59 same-renderer image comparisons retain untouched
neighbors; the maximum channel difference is one. Alfred's outgoing reaction
has an exact pinned shortfall of seven pixels differing by one channel level
(mean0.000179/255), rather than a widened generic threshold. These are not PNG
comparisons against the complete original renderer. The public `react()` path
also preserves its incoming gaze snapshot after live input changes.

The reaction-during-drag arbitration is integrated: an active drag rejects a
new reaction until pointer up/cancel. Reaction cancellation after an accepted
reaction has a separate reconstructed helper and offline/browser evidence; it
is not yet wired into the public controller. Arbitrary-phase Stop and queued
reaction handoff during Computer remain incomplete.

Continuous Computer now runs independently for all eight presets. Its seven-second
asset contains entry and a six-second repeating activity section, including all
four screen rows. The body, accessories and shadows use an independent breathing
clock, rather than repeating captured breathing at the activity seam. Comparisons
against each preset's 1,081-frame native observation cover 360 second-cycle poses:
world error is at most 2.004e-7, relative normal error at most 2.5361e-7, with exact
materials and visibility. The browser gate compares 56 complete images through
the packed runtime: 52 are exact and four have individually pinned residuals
(maximum one or two channel levels, one to six pixels); neighbors are unchanged.
These are same-renderer pose comparisons, not original-renderer PNG parity.
`verify-avatar-computer-loop.mjs` also checks activity beyond 60 seconds, one
context, one packed motion load per preset, and disposal. No original engine is
loaded by the independent renderer.

#### Editor adoption and cleanup — 2026-10-12

### Avatar efficiency investigation — 2026-10-31

This section records a new investigation without replacing the earlier measurements,
renderer fidelity or shader hazards. The user explicitly authorized removing the hair
material and geometry to improve performance; this is a deliberate visual change, not a
claim that a cheaper image is pixel-identical. Body shapes, parts, pigment, gaze and authored
actions remain the shared runtime's responsibilities. Cached still identity advances to
version 2 so persisted portraits cannot keep the previous hair appearance.

#### External approaches and what they actually establish

- [The comparison gallery](https://libraries.dev/bots) and its
  [public renderer](https://github.com/Jakubantalik/Libraries.dev/tree/main/packages/bot-avatars)
  use Canvas 2D with 2.5D volume assembled from heightfield slices. Surface preparation is
  shared by shape, lighting, style and tier (192/320/512); the cache is limited to 24 entries.
  A shared animation scheduler, offscreen/hidden-document suspension and DPR capped at 2
  avoid multiplying scheduling and raster cost while retaining independent rigs and gaze.
  These are useful ownership patterns, not evidence that translating arbitrary 3D parts
  and authored motion into that representation is free. Its 0.2.2 startup waits for bakes
  before revealing avatars, with a four-second ceiling; the smooth reveal alone does not
  measure loading time. No renderer code was copied.
- The [native port's own documentation](https://github.com/Jakubantalik/Libraries.dev/blob/main/packages/bot-avatars/ports/react-native/bot-avatars-native/README.md)
  describes Skia and Reanimated, a JavaScript rig producing one packed array for the UI
  runtime, and a shared-canvas sheet. Its reported 18-avatar plastic example improves from
  44 to 58 FPS **in a simulator**. This is the upstream author's measurement, not Bloom's,
  and does not establish physical low-end Android, thermals or equivalent fabric rendering.
  The port is not distributed as an npm package.
- [Rive's Canvas/WebGL guidance](https://rive.app/docs/runtimes/web/canvas-vs-webgl)
  recommends shared offscreen rendering for multiple 2D instances. Its separate
  [experimental GPU canvas/3D guidance](https://rive.app/docs/runtimes/web/gpu-canvas)
  requires an individual context per canvas with offscreen sharing disabled. Changing
  libraries therefore does not automatically remove context ownership costs.
- [Three.js multiple-scene guidance](https://threejs.org/manual/pages/multiple-scenes.html)
  explains why separate WebGL contexts cannot share GPU resources. Bloom's web document
  already pools live scenes by resolution. The remaining native WebView boundary cannot
  be removed by sharing only a JavaScript frame callback.
- [Baked animation textures](https://doc.babylonjs.com/features/featuresDeepDive/animation/baked_texture_animations/)
  move repeated animation work from CPU to GPU and texture memory. The documented
  blending/interpolation limitations make this a trade-off requiring action and gaze
  fidelity checks, not a transparent replacement for the present arbitrary compositions.
- [WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
  support batching, avoiding synchronous GPU queries and explicit GPU resource release.
  They also record mobile precision hazards, including explicit high-precision floating
  texture samplers on iOS. [Android material guidance](https://developer.android.com/games/optimize/materials)
  and [vertex data guidance](https://developer.android.com/games/optimize/vertex-data-management)
  emphasize overdraw, bandwidth, memory and shader work: high desktop FPS cannot establish
  that the same scene is inexpensive on an ARM mobile GPU.
- [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
  can move canvas work off the UI thread. It does not remove the scene's GPU drawing,
  geometry, texture memory or overdraw; moving a bottleneck is not eliminating it.

#### Integration defects and corrections

The native still host previously used `key={job.key}`. A sequential queue therefore kept
only one WebView mounted at once **but recreated its document for every distinct still**.
A test that counted simultaneous views passed while missing repeated module, donor and GPU
preparation. The corrected host retains the same WebView and source object for a burst,
keeps the preceding paused scene until the successor paints, and releases the host after
1.5 seconds idle. Capture identities reject late results; capture waits for both first paint
and controller creation. Tests now count actual mounts/unmounts and execute the generated
bridge with independent fake controllers, including early readiness and late completion.
This establishes resource ownership, not physical-device speed.

Cancelled queued requests previously never settled. Provider teardown could also leave its
queue draining. The cache now settles cancelled queued requests with `null`, discards queued
work on disposal and ignores late results; an already running backend may complete, but
cannot repopulate a disposed cache. Native teardown removes the drawing document. Web still
jobs have a 15-second deadline including runtime loading and creation; controllers that arrive
later are disposed. The runtime module loader also expires a hung request, removes the script
and permits a retry without letting an old callback delete the newer request. Failed native
module documents are replaced before the next queued character uses them.

Live native avatars still own separate WebViews. A future shared live surface must own
native positioning, clipping, stacking and input, or use a native renderer with equivalent
geometry and motion. Physical Android/iOS crowds, low-memory behavior and sustained thermal
runs remain required before claiming efficient live crowds on inexpensive phones. Browser
software rendering and CPU throttling do not stand in for these measurements.


#### Optional activity loading

The original production engine requested `loadAuthoredAsset(..., true)` for every character.
Its packed motion combined idle, reaction, Computer and the repeating Computer loop; catalog
composition also attached Computer before resolving its motion, even for a paused eye
preview. These resources were eager despite the visible avatar being idle.

The motion transport now splits base (idle/reaction/blink/gaze) from optional work
(Computer/loop). Catalog libraries split each rig's work clip in the same way. Channel byte
ranges are relocated directly, retaining Float64 bytes and intra-file sharing; no number is
rounded or motion resampled. The surface renderer's unused strand tracks are omitted.
Source bundles remain unchanged. The complete eager loader is retained for diagnostic
and fidelity tooling; production scene ownership prepares work only when requested.

| Source collection | Original combined bytes | Base transport bytes | Optional work bytes |
| --- | ---: | ---: | ---: |
| Eight authored motion bundles | 17,267,296 | 1,990,440 | 15,239,904 |
| Ten catalog motion libraries | 40,051,136 | 12,740,064 | 27,227,384 |

These are uncompressed sums over those collections, **not** bytes downloaded by every visit.
Each character uses selected files. Splitting duplicates a few channels shared between base
and work, so summing both transport columns is not an overall package-size claim. The base
motion reduction is 88.5% for the authored collection and 68.2% for the catalog collection.
Geometry and per-visit network totals require their own measurements.

`node --test scripts/test-avatar-motion-transport.mjs` compares every retained field in all
18 reconstructed bundles against the originals, verifies no work fetch during authored
idle/reaction setup, deduplicates simultaneous work requests, retries a failed work fetch,
and ensures upgrading does not mutate the base samplers or attach gaze twice. The original
motion fidelity suite still validates all eight presets against authored JSON.

Native process reclamation remains separate from render performance: the live bridge lacks
Android `onRenderProcessGone` and WKWebView `onContentProcessDidTerminate` handlers. The
[upstream event documentation](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#oncontentprocessdidterminate)
explicitly describes OS memory reclamation/background termination. Timeout recovery for
queued stills does not establish recovery of an already live native avatar.

#### Verification scope of the efficiency change

The combined runtime source passed the focused Jest union: 16 suites, 108 tests, covering
characters, native still lifetime/capture, cache cancellation, runtime loading, retargeting,
provider isolation and the family/documentation gates. The self-contained Node selection
passed 279 tests across 15 files, including exact motion transport and authored JSON parity,
geometry transport, shared-transform sampling, catalog layout/fitting and material rules.

The broader `node --test --test-concurrency=2 scripts/test-avatar-*.mjs` invocation was also
attempted: 31 files produced 428 test results, with 296 passes and 132 failures. The failures
were missing historical `.local/` captures (`ENOENT`) in 16 scripts; examples include
`avatar-original-geometry`, `avatar-computer-source`, `avatar-reaction-pointer`,
`avatar-eye-activities` and `avatar-catalog-rig/rig2`. None of those 16 test scripts changed
from the `798d6513` foundation, and those inputs were absent in the shared checkout too.
The passing 15-file selection is not a claim that the broader suite passed. No source
oracle was regenerated from the implementation, assertion weakened or missing-input test
silently skipped. Full historical native-observation replay still requires those captures.
