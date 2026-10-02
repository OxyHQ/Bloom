# Recovered character renderer

Serve this directory unchanged from a static URL and pass runtime.mjs's URL to
AgentAvatarProvider. The runtime loads lazily when an avatar becomes visible.
Serve .mjs as JavaScript and .wasm as application/wasm.

The four generated engine files are preserved byte for byte from the supplied
local beta. integrity.json records their SHA-256 hashes. The complete supplied
folder, including single-thread and threaded versions, was also backed up. The
supplied folder contained no engine source or license text; this directory does
not assign Bloom's license to those binaries.

runtime.mjs is an adapter for the original engine, retaining its appearance,
materials and animations. It owns loading, selection, input, display scaling and
resource lifetime. There is no replacement mesh renderer in the product.

Beta characters share one engine per document and all avatars share a 30fps
clock. Legacy contours isolate rendering modules to keep native geometry caches
from returning another silhouette; one worker prepares their scenes. Unused
modules are released. Static portrait preparation is serialized, cached (up to 64 images), and
releases its graphics surfaces after painting. Offscreen/background characters
stop rendering; pause and reduced motion freeze a complete visible frame. The
binary's initial reduced-motion flag can produce transparent frames; the adapter
freezes its own clock after painting instead.

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
and scripts/verify-legacy-avatars.mjs. They inspect painted pixels, interaction,
activity, transitions and resource cleanup, not just preparation callbacks.

The optional native bridge uses separate WebViews, which cannot share the web
engine/context caches. Physical-device validation remains pending.
