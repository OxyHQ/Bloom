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

Physical Pixel 8a measurements and asset fingerprints are recorded in
docs/benchmarks/avatar-shared-renderer.json, with interpretation in
docs/agent-avatar.mdx. All 24/48 avatars move without context loss, but measured
mean paint rates are only 3.76/2.59 Hz per avatar and all-ready latency is
24.6/74.1 seconds with warm HTTP caches. The 30fps target is not achieved.

Original and migrated contours share a rendering WASM module and one preparation
worker, which owns a separate WASM instance. Geometry identities include contour and attachment transforms. The adapter
scopes the recovered engine's deferred preparation dispatcher to its character;
that boundary is specific to the integrity-pinned glue. Its native global batch
can combine jobs from different characters, so wrapping callbacks alone is not
sufficient: the preparation lease spans mutation, deferred jobs and first paint. Cold preparation is
serialized; painted moving neighbours remain resident. Static portraits are
cached (up to 64 images), and release graphics surfaces after painting.
Offscreen/background characters release their leases. Pause and reduced motion
freeze a complete visible frame. The binary's initial reduced-motion flag can
produce transparent frames; the adapter freezes its clock after painting instead.

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
signature reactions; edited and migrated bodies fall back to the original Wave.
Mascots and hidden faces still use SVG.
Original material/grain effects become the beta's 3D surface.

Browser gates (with Storybook running) are scripts/verify-character-avatars.mjs
and scripts/verify-legacy-avatars.mjs, plus verify-avatar-render-budget.mjs and
verify-avatar-shared-renderer.mjs for crowd lifetime and actual 24/48-avatar motion.
verify-avatar-shared-surface.mjs checks atlas pixels, MSAA and failed allocation;
verify-avatar-shared-programs.mjs and verify-avatar-shared-textures.mjs compare
actual frame pixels against the original commands and verify independent changes.
verify-avatar-runtime-errors.mjs injects a GL failure before publication. They inspect painted pixels, interaction,
activity, transitions and resource cleanup, not just preparation callbacks.

The optional native bridge uses separate WebViews, which cannot share the web
engine/context caches. A physical Android WebView is checked separately from the native multi-WebView bridge.
