# Avatar presentation experiments, 2026-10-31

These are diagnostic prototypes, **not production optimizations**. They preserve
source geometry, shading, animation, output dimensions and normal filtering. A
numerically equivalent operation can still be slower on the physical browser.
Do not replace the production presenter based on operation counts alone.

The scripts under `scripts/fixtures/avatar/presentation/` intentionally intercept
browser APIs only inside a dedicated fixture. Install destination-context probes
before creating fresh avatars: a canvas bound to one context type cannot later
switch to another. They are not imported by Bloom or the runtime.

## Paired physical observations

The physical benchmark owner measured these on the same Pixel 8a. These are
individual observations, not device guarantees; the final curated benchmark
records the full source, browser, timing and temperature context.

| Controlled workload | Candidate | Observation | Decision |
| --- | --- | --- | --- |
| 24 live authored avatars | One immutable atlas ImageBitmap, then original Canvas2D destinations | Direct 105 frames/5s → bitmap 104 → direct 104; maximum pending 1, no stale/error/fallback | No improvement; do not adopt |
| 24 live authored avatars | Full-destination `copy` composite without `clearRect` | Direct 24.67 → copy 15.33 → direct 24.84fps | Regression despite exact pixels; reject |
| 24 live authored avatars,192px outputs | Exact-size Offscreen2D scratch → bitmaprenderer | 12.92fps; 1632 destination transfers/5.26s, no errors/fallback | Regression; reject for this workload |
| 24 live authored avatars | Persistent transferred Offscreen2D destinations | 24.74fps, approximately control | No benefit sufficient to justify contract changes |
| 64 live avatars,64px source →128px destination | Persistent transferred Offscreen2D destinations | 11.02fps versus original 1.62fps; scratch bitmaprenderer 5.19fps | Useful diagnostic, still slow and not production eligible: first-ready snapshot fails |

A separate ablation kept full WebGL drawing and explicit flushing, but suppressed
presentation: normal 27.25fps → no `drawImage` 48.71fps → neither clear nor copy 59.92fps
→ restored 25.95fps. This is evidence about the destination presentation cost, not
an acceptable optimization: the suppressed outputs do not animate.

## Pixel and lifecycle findings

- One-atlas bitmap → original2D preserved 147,456 held pixels in the real pool.
  Deliberately reordered completions could not overwrite a newer recolor; pending
  work stayed bounded at 2, discarded bitmaps closed, disposal rejected late work,
  and PNG snapshots remained valid (`verify-avatar-presentation-probe.mjs`).
- `copy` compositing preserved 737,280 pixels across pigments and transparency,
  with a valid PNG snapshot (`verify-avatar-copy-probe.mjs`). This does not negate
  its measured physical regression.
- `createImageBitmap` crop-and-resize with `resizeQuality:'low'` did **not** match
  Canvas2D resampling: 163,213/393,216 changed pixels for 64→128 and
  360,609/1,204,224 for 192→224. Crop/transfer without resize was exact 983,040 pixels.
- Scaling a whole atlas before cropping was exact for 64→128 but changed 5,390
  pixels for 192→224. Drawing each tile at nonzero atlas offsets still changed 1,454
  pixels (maximum premultiplied-channel difference 8, alpha 7). Both were rejected.
- Drawing each tile at origin in one exact-size Offscreen2D scratch and consuming
  `transferToImageBitmap()` preserved 1,597,440 pixels for 64→128 and192→224
  (`verify-avatar-bitmaprenderer-fidelity.mjs`). The actual pool also preserved
  205,824 pixels at 64/96/112/160CSS, decoded PNG pixels, held paused outputs and
  first-ready ordering (`verify-avatar-bitmaprenderer-probe.mjs`). No queue,
  frame drop, readback, padding or resolution inflation is involved.
- Persistent transferred Offscreen2D eventually preserved the same 205,824 pixels
  and PNG after placeholder publication. However, snapshots taken **inside the
  first onReady callback** were 300×150 and fully transparent in 4/4 cases. This
  fails the existing contract (`verify-avatar-offscreen-placeholder.mjs`).
  A separate physical gate preserved 665,600 pixels across 20 actors with authored
  and catalog variants. One later physical onReady sample was nonblank; this
  does not invalidate the reproducible initial blank-placeholder counterexample.
  A future implementation must address snapshot and placeholder readiness
  explicitly; waiting during a benchmark does not fix production semantics.

Fidelity readbacks can cause Chromium to change Canvas2D backing policy. Timing
windows therefore use fresh destinations that have never been read with
`getImageData`. Do not combine a pixel gate and a performance sample on the same
destination canvas. A GPU completion counter is also not proof that every frame
was displayed by the compositor.

The forced CPU-atlas experiment (`premultiplyAlpha:'none'`) was exact at 192→192
but failed scaled output: 162,553/393,216 changed pixels for 64→128 and
362,255/1,204,224 for 192→224. A second atlas conversion to
`premultiplyAlpha:'premultiply'` before drawing restored all 1,597,440 scaled
pixels exactly. This roundtrip is available with `repremultiply:true` in the
atlas probe; its physical cost must be measured. Two CPU conversions are not
free, and the first atlas is closed even if conversion or disposal fails.

## Browser mechanisms and remaining experiments

Chromium's HTMLCanvas2D acceleration policy has a small-canvas area cutoff of
128×129 pixels unless the relevant feature is enabled. A 128×128 destination is
below that threshold. This explains why CSS size and output backing dimensions
must both be recorded; it does not authorize inflating either. See
[HTMLCanvasElement::ShouldAccelerate](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/html/canvas/html_canvas_element.cc).

The Offscreen2D backing policy checks GPU compositing, accelerated2D support and
`willReadFrequently`, without the same small HTML-canvas cutoff. Transferring an
ImageBitmap resets/discards the previous scratch backing. Persistent Offscreen2D
avoids that per-frame transfer churn, but the HTML placeholder is asynchronous.
See [OffscreenCanvasRenderingContext2D](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/canvas/offscreencanvas2d/offscreen_canvas_rendering_context_2d.cc).

An ImageBitmap Promise does not promise nonblocking GPU work. Cropping can also
allocate and blit rather than merely retain a view of the source atlas. Neither
API capability nor the word "bitmap" establishes a zero-copy implementation.
See the [HTML image bitmap specification](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html)
and [Chromium bitmap transform implementation](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/platform/graphics/static_bitmap_image_transform.cc).

`webgpu-fixture.mjs` is a separate presentation-only experiment: the existing
WebGL engine/shaders render unchanged; one WebGPU device copies the finished atlas
once per frame and draws destination quads. It explicitly bounds submitted GPU
batches at 2 by deferring the engine scheduler, records source revision and GPU
completion separately, and does not drop frames. It is not production code or a
validated quality/performance improvement. An explicitly forced local software diagnostic (`--enable-unsafe-webgpu` plus
SwiftShader) lost the GPU process during WebGL/WebGPU interoperation. This is
not a capability test for normal user browsers. The fixture uses default adapter
selection without browser flags and excludes `adapter.info.isFallbackAdapter`
when true; an explicit diagnostic override is required for software experiments.
Physical validation remains required. The
[WebGPU specification](https://www.w3.org/TR/webgpu/) permits external canvas
copies but does not promise they are free.

## WebGPU gate and an observed browser interop hazard

The fixture's `captureHeld` takes the Canvas2D reference from the exact same
WebGL atlas in the same frame as WebGPU submission. It records decoded PNG both
immediately after `queue.submit` and after GPU completion/presentation, plus a
separate diagnostic `Canvas2D.drawImage(webgpuCanvas)` read. The external CDP gate
connects to an existing benchmark page; it does not launch or close a browser.
Its matrix is 64→128,192→192,192→224 and512→640, with eight authored and two catalog
characters in idle, reaction and work. These readbacks occur only when the gate
is explicitly invoked, outside timing windows.

An initial physical 192→192 held-idle run matched all 24 decoded PNGs exactly, while
`drawImage(webgpuCanvas)` after a frame boundary returned transparent pixels.
The screenshot was correct too. This is not a shader/filter discrepancy and must
not be silently relabeled full interop parity. Chromium's `GetImage()` can use the
front buffer after the current texture expires, whereas its back-buffer snapshot
path may return an existing resource-provider snapshot without a current
texture. See [GPUCanvasContext implementation](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/webgpu/gpu_canvas_context.cc).
This is an implementation hypothesis for the observed divergence, not a proven
root-cause fix. The [WebGPU canvas specification](https://www.w3.org/TR/webgpu/#canvas-rendering)
hooks both image-copy APIs to the context image.

Bloom's current web snapshot, embedded live-WebView snapshot, web still capture
and embedded still capture all use `canvas.toDataURL('image/png')`. The PNG gate
therefore tests those actual contracts; it does not claim the browser's
cross-context `drawImage` behavior is correct. Scaled PNG fidelity, immediate
snapshot ordering, lifecycle and physical throughput remain separate gates.

## Index locality audit, not a shipped change

`audit-avatar-vertex-cache.mjs` examined 546 opaque parts and excluded 125 duplicate
or potentially order-dependent parts. It used meshoptimizer 1.1.1 offline, inverted
its vertex-fetch remap to preserve original vertex IDs and verified the exact
multiset of oriented triangles. No production asset changed. Estimated LRU-cache
miss reductions were:

| Geometry group | Parts | Triangles | LRU16 | LRU32 |
| --- | ---: | ---: | ---: | ---: |
| Authored low |54|87,372|48.2%|36.7%|
| Authored high |54|154,844|45.4%|39.6%|
| Authored work |16|69,440|32.3%|30.6%|
| Catalog low |210|505,394|42.7%|21.7%|
| Catalog high |210|825,584|43.8%|43.8%|
| Catalog work |2|8,680|32.3%|30.6%|

These FIFO/LRU models are not measured GPU invocations or FPS predictions. Even
opaque triangle reordering needs pixel validation for overlapping/coplanar
surfaces. The physical bottleneck above is presentation, so this opportunity is
archived rather than introduced as an unrelated production change.
