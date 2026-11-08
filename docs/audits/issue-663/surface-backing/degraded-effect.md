# Foreground bounds when the backdrop effect is omitted

`surfaceBodyBounds` now encloses both the filtered sampler and the unfiltered
sampler before compositing the unchanged tint. This is a channel-wise union of
two bounded RGB boxes, not a capability guess or user-agent branch. A narrower
sampler still requires proof of every sampled pixel; unknown remains the full
RGB cube. The regional maximum edge gain and quantization allowance remain.
Opaque/native/reduced-transparency paint and nominal published fills are unchanged.

The captured tint-only [152,162,174] negative is now included by a unit contract.
The same semantic quiet-text computation finds a darker light-mode placeholder,
without changing a global token. The existing mono/dark and graphite/dark
unsatisfied cases remain explicit: their primary pair cannot certify the whole
unknown interval with the regional glow. This change does not claim global AA.

The committed `degraded-effect/` contains full viewport and ink-hidden captures,
96 samples per runtime, and ordered comparisons keyed by scene/index/target ID.
All ratios derive from exact painted foreground pixels and the corresponding
ink-hidden background pixels. All 288 comparisons have no contrast regression.
92 placeholder samples per engine change foreground; four remain identical.
Chromium's 64 canonical samples have minimum 4.643457; WebKit and Firefox's
canonical minimum is 4.618117, up from the measured tint-only 3.385787.
The 24px/32px-line Chromium cases still have six results below 4.5, minimum
4.089362. These explicit sizes do not prove native accessible font scaling,
height/legibility at large settings, or arbitrary glyph coverage of the rim.

Material painting is untouched. WebKit/Firefox backdrop optical parity remains
failed-runtime/not verified, even though this fixture's text contrast improves.
The field fixture contains placeholders, not a complete neighbor-text census.
The actual GoWay 84-text comparison must be repeated with this new source before
consumer acceptance; its earlier 80 unchanged neighbors belong to the prior
filtered-only checkpoint. Native map/TalkBack and published adoption remain open.
