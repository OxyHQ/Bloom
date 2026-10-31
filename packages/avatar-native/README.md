# Bloom native avatar GPU adapter

Private integration under development. This package is intentionally separate from
Bloom: installing ordinary Bloom must not autolink a native graphics dependency.
The adapter uses the existing avatar engine, assets, shaders and motion controllers.
It does not stream screenshots or substitute images for live animation.

The Android prototype creates one headless Expo GL context. Each independently laid-out
native TextureView owns an EGL surface in that context. The existing engine renders its
atlas, including 4× MSAA and its final presentation pass; native GPU framebuffer blits
present the corresponding cell into each view. Native composition owns clipping,
transforms, scrolling and input. No atlas pixels cross the JavaScript bridge.

The stock Expo GL 58.0.3 implementation lacks `renderbufferStorageMultisample`. The
adapter supplies that native operation on the same GL command queue after a JS flush;
this preserves the renderer's requested samples instead of reducing quality. Of the
79 GL methods observed in the startup/idle/work/dispose trace, this was the only method
listed as unimplemented in that installed release. This audit is not a claim that every
GPU or texture extension is supported.

`node scripts/build-avatar-native-runtime.mjs` compiles the same TypeScript engine into
a static CommonJS factory. It accepts the absolute asset-directory URL. Shader strings
are compiled into the bundle, while all 433 generated external assets matched the web
runtime's names and SHA-256 bytes in the initial build. It does not evaluate remote code,
use `import.meta`, inline binary assets or create global DOM replacements.

The initial physical Pixel 8a proof rendered twelve independently composited native views
from one context with MSAA 4×, transparent output, rotated cards, native press handling
and unmount/remount. That first proof used animated test geometry; the subsequent integration described
below uses the actual shared avatar engine. iOS presentation
and packaging are not implemented yet.

## Choice of backend

- [Expo GL](https://docs.expo.dev/versions/latest/sdk/gl-view/) retains the WebGL2 API and
  therefore the existing custom GLSL material equations. Its headless context alone has
  no native presentation; this companion supplies the GPU surfaces.
- [React Native WebGPU](https://wcandillon.github.io/react-native-webgpu/docs/getting-started/canvas)
  can configure multiple native canvases with one device; its default Android TextureView
  supports ordinary alpha composition. This is a viable alternative backend, but
  [Three RawShaderMaterial](https://threejs.org/docs/pages/RawShaderMaterial.html) supports
  only WebGLRenderer. Adopting it would also require a shader/render-pass port with visual
  parity gates, not merely replacing the canvas component.
- [Skia's WebGPU interoperability](https://wcandillon.github.io/react-native-webgpu/docs/integrations/react-native-skia)
  shares Dawn devices/textures without CPU copies. Matching Dawn releases and a new
  rendering backend remain prerequisites; adding Skia does not translate our GLSL.
- [React Native Filament](https://margelo.github.io/react-native-filament/docs/guides)
  supplies a native physically based renderer and GLB loading. Replacing the present
  material equations, authored asset loading and motion binding would be a larger port;
  visual equivalence is not established by using a physically based renderer.

A single WebView is not itself a texture-export API. Android virtual displays can target a
Surface, but routing an entire browser compositor through that path adds a separate native
presentation system. WKWebView's public snapshot API produces an image, not a reusable GPU
texture. The chosen adapter avoids depending on browser compositor internals on either
platform. A native EAGL presentation adapter could preserve GLSL on iOS, but OpenGL ES is
 deprecated there and requires explicit device validation; it must not be described as
implemented based on the Android proof.

## Integration contract

Install this companion and its declared peers in the native application, then rebuild
that application's native binary. It is a private package in this repository, not a
published npm release. Ordinary Bloom remains usable without it. Bloom accepts companion ABI version 1; the
companion also requires native module ABI 1. Installing new JavaScript without the
matching native rebuild cannot silently use an incompatible binary. Bloom's optional
literal `require` selects the adapter only on Android and only after the hosted
`manifest.json` matches the compiled adapter's complete expected manifest, including
`runtime.mjs`, every code chunk, and every binary asset. A missing module, another
runtime revision, or an unavailable manifest retains the existing WebView route.
Concurrent checks share one request. Failed checks expire after five seconds; successful
checks expire after one minute for later mounts. A running adapter remains on its
bundled code revision. Production hosting must use immutable versioned directories or
retain the pinned files for the lifetime of released native applications.

The native build first compiles a fresh browser runtime from the same checkout into
`.local/avatar-native-compatible-web`, verifies native asset hashes against it, and
writes its complete manifest into the companion. The regular tracked web runtime must
be regenerated from those same inputs before deployment. A code-only shader/controller
change invalidates compatibility even when asset hashes are unchanged. The companion
pins Expo GL 58.0.3 because its context registry and native GLContext integration are
internal APIs. Updating that peer requires another API, pixel and lifecycle audit.

Pools are shared across providers for one runtime URL directory and initial size bucket
(64, 128 or 320 logical pixels). Equal-size instances share one context, renderer,
asset cache and atlas. Each pool contains at most sixteen slots, reduced further when
the device texture/renderbuffer/viewport limits require it. Additional slots open another
pool. The limit reserves room for every existing slot to grow to the unchanged 512px
maximum backing without an unbounded atlas; allocation failure is reported, never
compensated by reducing quality. Different initial buckets use separate contexts to avoid drawing
a small icon at a hero's resolution. Resizing an existing group changes its engine size
in place and may promote that group to its largest member; it preserves motion state,
clock positions and consumed action keys. This trade-off avoids silently resetting a
working avatar or transferring private state into another renderer.

Every destination is an ordinary transparent TextureView. Native composition retains
its clipping, scrolling, transforms and stacking; JavaScript does not stream positions.
Native pre-draw visibility observations send only boolean transitions. Offscreen views
and background applications hold their existing pose. Surfaces becoming available or
being recreated invalidate a fresh frame, including a paused avatar. `onReady` follows
a successful native swap, rather than merely issuing draw commands. One avatar's
snapshot reads its retained native output on explicit request and encodes PNG off the
GL thread; animation never performs image readback or encoding.

The presenter submits synchronously into Expo's GL queue and acknowledges completion
by ticket. At most two presentation batches may be outstanding; this permits CPU/GPU
overlap without an unbounded frame queue. Context destruction follows queued batches
and surface destruction. Native EGL failures reach Bloom's existing unavailable state.
This adapter does not yet recover a lost native GL context automatically. It restores
EGL draw/read surfaces and framebuffer/scissor state after every batch.

The physical integration now renders twelve real avatars through the shared slot and
latest-intent controllers, rather than test geometry. Android debug observations on a
Pixel 8a found approximately 292–295 actual TextureView updates per five seconds with
two batches outstanding; a single batch serialized work at approximately 186–188.
These are development-build observations, not a cross-device performance guarantee.
All twelve paused views held their counters unchanged across four five-second samples.
Formal comparison and remaining lifecycle evidence belong in the repository benchmark
report. iOS continues through the existing WebView renderer; this package currently
contains no iOS presenter.
