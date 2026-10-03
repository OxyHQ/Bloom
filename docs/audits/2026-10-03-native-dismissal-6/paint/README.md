# Default bottom-dialog paint follow-up

The shared material refactor a8eb008ab changed DialogBottomSheet's default background to transparent. BottomSheet interprets that style as its backing fill, so the actual SurfacePaint SVG Rect received `fill="transparent"`. Native baseline screenshots confirm the header paints but the body is transparent. This is a paint defect, not evidence that transparency causes touch interception.

The one-line fix restores the theme background as the default, while panelStyle still overrides it. The regression renders actual Dialog/BottomSheet/SurfacePaint into mocked native SVG primitives, asserting the emitted fill in light/dark mode and preserving an explicit transparent panel. Initial test-query/alpha mistakes are retained; corrected RED has exactly two default-paint failures and the transparent control passes. GREEN: six focused suites/82 tests, strict TypeScript+consumer control, fresh same-command build/pack and package/freshness gates.

The prior dismissal-only candidate and proof remain historical. This proof pins the new package; real candidate paint/Back/X checks and publication are still pending. Matching runtime/test changes are forwarded to main7 PR258.
