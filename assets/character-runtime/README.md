# Recovered character renderer

Serve this directory unchanged from a static URL and pass runtime.mjs's URL to
AgentAvatarProvider. The runtime loads lazily when an avatar becomes visible.
Serve .mjs as JavaScript and .wasm as application/wasm. Version the static
directory as a unit: changing only the runtime.mjs query does not invalidate
its relative imports under immutable HTTP caching.

The four generated engine files are preserved byte for byte from the supplied
local beta. integrity.json records their SHA-256 hashes. The complete supplied
folder, including single-thread and threaded versions, was also backed up. The
supplied folder contained no engine source or license text; this directory does
not assign Bloom's license to those binaries.

runtime.mjs is an adapter for the original engine, retaining its appearance,
materials and animations. It owns loading, selection, input, display scaling and
resource lifetime. There is no replacement mesh renderer in the product.

All visible moving characters share one physical WebGL2 context, a packed canvas,
and one animation clock with a 30fps per-character target. Each character retains its own state and private
render targets. shared-surface.mjs maps its default framebuffer into a tile,
resolves MSAA before translation, and clips output copies to that tile. Only the
last lease destroys the physical context. shared-programs.mjs pools shaders and
linked programs, preserving independent uniforms and Emscripten object metadata.
Identical uniform values are not resent when changing logical program owners.
shared-textures.mjs shares the exact bytes and parameters of the two 512px
mipmapped RGBA8 assets and the 576×960 RGBA8 atlas. Mutation or framebuffer
attachment first gives that logical texture independent storage. Other textures,
mutable buffers and private render targets are not deduplicated. Small avatars
use compact meshes independent of device pixel ratio. Fur and original materials
remain intact. resolution.mjs selects backing size by CSS size and DPR, activating
the original engine's existing size-dependent fur LOD.

Physical Pixel 8a measurements and exact asset fingerprints are recorded in
docs/benchmarks/avatar-continuous-renderer.json (same-character controllers and
pose transitions, before shared authored parts). All 24/48 avatars move with
one context and no graphics errors. Median paint rates are 4.42/2.29 Hz per avatar;
all-ready latency is 14.85/24.80 seconds with warm HTTP caches. The 30 fps target
is not achieved. Earlier snapshots are retained for comparison; see
docs/agent-avatar.mdx for workload and measurement limitations.

Original and migrated contours share a rendering WASM module and one preparation
worker, which owns a separate WASM instance. Geometry identities include contour and attachment transforms. The adapter
scopes the recovered engine's deferred preparation dispatcher to its character;
that boundary is specific to the integrity-pinned glue. Its native global batch
can combine jobs from different characters, so wrapping callbacks alone is not
sufficient: the preparation lease spans mutation, deferred jobs and first paint. Cold preparation is
serialized; painted moving neighbours remain resident. Static portraits are
cached (up to 64 images), and release graphics surfaces after painting. Exact contour preparations use an independent 8 MiB/16-entry LRU cache, including appearance, quality, activity and contour and authored-part identity; returned buffers are copied. The preparation owner receives a render turn every batch until its first complete paint. Recent interactions receive alternate-batch priority without starving the remaining round-robin queue.
Offscreen/background characters release their leases. Pause and reduced motion
freeze a complete visible frame. The binary's initial reduced-motion flag can
produce transparent frames; the adapter freezes its clock after painting instead.

Shared submissions contain at most eight avatars and an 8 ms CPU allowance. A WebGL fence is polled asynchronously before error checks and presentation, allowing the page to process input while the GPU works. Lifecycle and native input operations wait for this boundary; DOM pointer capture remains synchronous. Diagnostics separate CPU submission/presentation from elapsed GPU waiting and task dispatch. This improves responsiveness without claiming faster GPU throughput.

React and Work retain one native Character, its prepared meshes and animation
clock. controller-mode.mjs verifies the original WASM SHA-256 before capturing
its memory through the supported instantiateWasm hook. A JS hash fallback keeps
this check working on insecure HTTP WebView origins. The adapter validates the
Embind handle, native type marker, live instance, bounds and boolean controller
field on every access; memory growth never leaves a stale typed view. Its ABI
layout is specific to the pinned WASM and must be re-proved for another binary.
Activity support prepares the original props up front. A constructor without
activity support rejects Restore/Start; incremental preparation is not assumed.
Stop completion reads the original current phase/activity/episode, since both
copyActivityRestore and hasPendingUpdate can misrepresent outro completion.
Appearance changes retain any simultaneous Work/React request until the new
scene is painted; pausing or disposal cancels those requests.
Queued reactions retain the original Busy semantics until the suspended reaction
finishes. verify-avatar-controller-continuity.mjs checks the complete runtime
switches, native identity, unchanged geometry, original outro and real pixels.
pose-transition.mjs interpolates reflected transform/skin uniform blocks and
camera for 180 ms from the last presented pose. It preserves material/discrete
bytes and original animation of newly added props. No bitmap crossfade or
replacement mesh renderer is involved.

authored-parts.mjs exposes eyes:todd and accessory:felipe_beret across all 20
shapes. The worker copies complete native records from lime_frog and blue_beret,
retaining materials and animation deltas, fits them after contour deformation,
and removes the generic fitting references. Original activity data remains intact; the aggregate scene bounds expand to
include the fitted parts. Virtual IDs never reach native catalog selection. Cache keys include
these parts; verify-avatar-authored-parts.mjs checks all 20 real rendered shapes,
original/migrated Work and React, generic selections and cleanup.

clippo-geometry.mjs adds a smooth open tube and an independently selectable
Clippo eye/brow set as native prepared records. It generates capped tube meshes,
retains the original eye deformation fields and uses the recovered smooth
material in the same renderer. No raster cutout or additional WebGL context is
used. character-recipe.mjs resolves the clippo preset to its virtual shape/eyes
and grey paint; explicit selections override those defaults. Runtime capabilities
retain the caller's raw saved key, including when an explicit default selection
leaves the prepared appearance unchanged. Editor chips are static SVG artwork.

Current editing supports the beta's original catalog combinations and actual
availability constraints. appearance-codec.mjs validates explicit RGB and optional eye
transform edits through the original engine. Untouched presets keep their bytes.

legacy-geometry.mjs transforms copies of prepared scene assemblies: existing
Bloom contours deform the body, pose deltas, normals and fur roots. The packaged
meshes, manifest and WASM remain untouched. The parser checks structural mesh
keys, counts, finite values and layout; it is tied to these recovered binaries.
legacy-worker.mjs applies the deformation before the original renderer consumes
it. The original wave and working activity operate on this geometry.

Eight distinct paper/blob contours use this path. Circle, triangle, flower,
diamond and heart recipes reuse the original beta shapes instead of duplicates.
Alien avatars are removed from the visible catalog, with saved-data compatibility. The
migrated bodies use the original catalog eyes at their authored proportions and
animations; old expression/eye transform fields no longer alter the 3D face.
Migrated bodies support original eyewear and accessories. Headwear, Bulb, bow
and Tuft receive rigid contour-relative translations; eyewear and headphones
keep original placement. A bounded reference cache identifies attachment meshes
without changing eyes, materials or fur vectors. Intact presets retain authored
signature reactions; edited and migrated bodies use the original Wave when
the engine rejects Signature.
Mascots and hidden faces still use SVG.
Original material/grain effects become the beta's 3D surface.

Browser gates (with Storybook running) are scripts/verify-character-avatars.mjs
and scripts/verify-legacy-avatars.mjs, plus verify-avatar-render-budget.mjs and
verify-avatar-shared-renderer.mjs for crowd lifetime and actual 24/48-avatar motion.
verify-avatar-shared-surface.mjs checks atlas pixels, MSAA and failed allocation;
verify-avatar-shared-programs.mjs and verify-avatar-shared-textures.mjs compare
actual frame pixels against the original commands and verify independent changes.
verify-avatar-runtime-errors.mjs injects a GL failure before publication. verify-avatar-deferred-input.mjs forces a delayed GPU fence and checks real mouse capture, reactions, appearance edits, resizing and disposal during that wait. They inspect painted pixels, interaction,
activity, transitions and resource cleanup, not just preparation callbacks.

The optional native bridge uses separate WebViews, which cannot share the web
engine/context caches. A physical Android WebView is checked separately from the native multi-WebView bridge.
