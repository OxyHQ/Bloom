# Field interior correction checkpoint

The shared material resolver now offers an explicit web body range. Its input
is the full unknown sampler cube unless a caller proves narrower bounds. This
covers a parent's rim and outside-parent sampled pixels as input uncertainty;
it does not pretend the nominal parent fill is the real map. The field's own
edge gain is then bounded separately over the text region. No paint, filter,
solid fill, native palette or nominal `publishedFill` is changed by this patch.

TextField's placeholder uses that owner range with the existing
semantic quiet-text calculation and 4.5 floor. Reduced transparency and increased
contrast resolve against the existing opaque solid fill instead. Explicit alpha
is preserved, and transparent/paint=false hosts do not acquire a material range.
The external Textarea counter stays unchanged: it is outside the painted field,
so the field-body enclosure is not its backing. The core still returns an explicit unsatisfied result when no available semantic
foreground can clear the whole range. It does not assert a primary fallback is AA.

## Canonical geometry and pixels

Single-line web defaults use 14px text, 20px line height, zero vertical input
padding and a centered line box. Input start padding is 4px and mirrors in RTL;
the shell contributes 4px horizontally for xs and 8px for sm/md/lg.

| Size | Field height | Line-box edge inset | Measured glyph top/bottom inset | Dark-white minimum after correction |
| --- | ---: | ---: | ---: | ---: |
| xs | 28 | 4 | 9 / 5 | 4.792 |
| sm | 32 | 6 | 11 / 7 | 4.732 |
| md | 36 | 8 | 13 / 9 | 4.600 |
| lg | 44 | 12 | 17 / 13 | 4.600 |

The pure bound uses the line box rather than assuming these particular glyph
metrics. Bare InputGroup members subtract the group's 4px ring share from the
available height, so their corresponding line-box inset is 2px smaller. Their
specific pixel layout remains to be checked; this is not a measurement claim.

`fields/body-only-*` retains the diagnostic negative: xs dark on white was
4.475, despite the body-only mathematical bound passing. The glyph descender
reaches the glow at 5px. `maximumEdgeGain` enumerates authored angle/depth knots
at or beyond the region inset, including the glow; brightness/mask composition
is bounded by multiplying the body's upper channel bound by 1 + maximum gain.
The lower bound stays unchanged because this layer only brightens. Two output
channel units cover rounding when the edge is included (body-only uses one).
This allowance is a browser-probe bound, not a cross-engine theorem.

`fields/edge-aware-*` records light/dark × LTR/RTL × black/white fixtures, eight
inputs per scene. Canonical defaults all exceed 4.5 on those backings. Dark-white
is the relevant negative control; light-black remains 4.606 and light-white
7.140. The script captures the full viewport, hides placeholder ink for a second
capture, and reads each image into a fresh canvas. It requires exactly matching
solid glyph pixels before comparing their painted foreground with underlying
pixels. This establishes painted colors, not unused computed declarations.

## Remaining requirements

The explicit 24px/32px-line fixture reaches closer to the rim: xs 4/1px, sm 6/3,
md 9/4, lg 13/8. Dark-white measurements are 4.062, 4.400, 4.389 and 4.600.
Those are above the large-text 3:1 threshold, but do not establish behavior under
native font scaling or text-only enlargement. Accessible large text and retained
height/legibility remain requirements, not dismissed caller styling. A separate
native/default-font-scale check and a text-enlargement geometry check are pending.
Deliberately destructive height/padding overrides likewise are not certified.

Across all theme presets the conservative xs region range cannot be certified
with the existing primary foreground in mono/dark (4.432) or graphite/dark
(4.421). The test pins those exact unresolved cases. A tighter verified sampler
or a real known backing would be needed for that guarantee; this patch does not
raise global primary tokens or change approved paint. There is no global AA claim.

Real GoWay land/sea repeat, its other 20 neighboring text samples, WebKit and
native map/accessibility verification are still pending at this checkpoint.
