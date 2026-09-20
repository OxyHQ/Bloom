# chart-cards — writing a Bloom chart card

Chart cards render with `react-native-svg` on recharts' own geometry, so they work on native and web and land on
the same pixels. `AreaChartCard.tsx` is the reference implementation — read it first.

## Layout of the family

| File | What it is |
|---|---|
| `primitives/` | The shared chrome — one file per part (table below) |
| `geometry.ts` | recharts' maths as pure functions: plot box, ticks, scales, stacking, curves, bars, tick culling |
| `palette.ts` | Chart colours from the theme: card chrome (`resolveChartCardPalette`) and series tones |
| `use-chart-progress.ts` | recharts' 450ms series clock: reveal on mount, morph on data change |
| `use-count-up.ts` | `useCountUp` / `useCountUpPrecise` — the headline roll |
| `types.ts` | Public prop types for every card |
| `<Name>ChartCard.tsx` | One card per file; `ChartCard.tsx` is the dashboard revenue/orders variant of the chrome |
| `index.ts` | Pure barrel: cards, their types, and the composable primitives |

## Primitives (`primitives/`)

| Primitive | Notes |
|---|---|
| `ChartCardSurface` | 329 tall (`height`, or `'auto'` for `tiles` cards), radius 16, padding 16/16/12 longhands, `gap` 16 |
| `ChartHeader` | `ChartHeadline` + optional `trailing` + `range` pill or `ranges` dropdown |
| `ChartHeadline` | label / count-up number with 220ms fade (`fadeKey`) / delta `Chip` (hidden, not removed, while `hovering`) / optional `caption` |
| `ChartRangePill` | static 32px pill with calendar glyph |
| `ChartRangeSelect` | the pill as a Bloom `DropdownMenu` (188px panel, check on the current row); a bottom sheet on native |
| `useChartRange` / `ChartRange<T>` | selection state; a range's fields override the card's props |
| `ChartCenterReadout` | absolutely centred number for ring charts (`size` `display` / `title`) |
| `ChartStatTiles` | tile rows (3 per row ≥ 640 viewport, 2 below), bleed −8 / −4, 40% dimming |
| `ChartLegend` | centred wrapping swatch legend, 50% dimming |
| `useChartTones()` + `resolveTone(tones, i, color?, activeColor?)` | in `palette.ts` / `use-chart-palette.ts` |
| `useMonoTone()` / `resolveMonoTone(theme)` | |
| `describeDeltaRatio` | `format.ts`. (`geometry.ts#describeDelta(current, previous)` is the dashboard cards' two-total version) |
| `formatNumber` | `format.ts`, plus `compactNumber` (`4.5K`), `percentTick`, `groupThousands` |
| `CartesianPlot` | recharts `ResponsiveContainer` + axes + `CartesianGrid` + headless tooltip, rebuilt: measures itself, grid, culled tick labels, pointer tracking, `role="img"` surface |
| `FadeOnChange` | |
| `useActiveIndex(count, controlled, onChange)` | hovered index, controlled or tracked; every card takes `activeIndex` / `onActiveIndexChange` |
| `useChartCardPalette()` | chrome colours (surface, text ramps, cursor, track, chips, `inner` tiles, `pill`) |
| `useWebTransition(prop, ms)` | CSS `transition` on web only, `null` on native and under reduced motion |

## Skeleton of a card

```tsx
export function FooChartCard({ data, series, ranges, range, defaultRange, onRangeChange, delta, title = 'Foo',
  format = formatNumber, tiles = false, activeIndex: controlled, onActiveIndexChange, accessibilityLabel, style, testID,
}: FooChartCardProps) {
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);
  const rows = selected?.data ?? data ?? [];
  const tones = series.map((s, i) => resolveTone(palettes, i, s.color, s.activeColor));
  const [active, setActive] = useActiveIndex(rows.length, controlled, onActiveIndexChange);

  return (
    <ChartCardSurface height={tiles ? 'auto' : undefined} style={style} testID={testID}>
      <ChartHeader
        label={active !== null ? rows[active].label : title}
        value={/* hovered or resting number */}
        format={format}
        delta={delta !== undefined ? describeDeltaRatio(delta) : undefined}
        hovering={active !== null}
        fadeKey={`${selectedId ?? ''}:${active}`}
        range={range} ranges={ranges} rangeId={selectedId}
        onRangeChange={(id) => { setActive(null); select(id); }}
        testID={testID}
      />
      <View style={{ width: '100%', flex: 1, minHeight: 0 }}>
        {/* Cartesian: CartesianPlot. Radial / funnel / sankey: your own onLayout-measured View + Svg. */}
        <CartesianPlot categories={...} yAxisWidth={44} yDomain={...} yTicks={...} formatYTick={compactNumber}
          grid outside="clear" onActiveIndexChange={setActive} palette={palette}
          accessibilityLabel={accessibilityLabel ?? 'Foo chart: …'} testID={testID ? `${testID}-plot` : undefined}>
          {({ size, box, x, y }) => <Svg width={size.width} height={size.height} pointerEvents="none">…</Svg>}
        </CartesianPlot>
      </View>
      {tiles ? <ChartStatTiles items={...} /> : <ChartLegend items={...} style={{ paddingBottom: 4 }} />}
    </ChartCardSurface>
  );
}
```

Rules that apply to every card:

- **Demo data goes in the story, not the component** — the component takes typed props.
- **No hand-typed font sizes**: `<Text variant="body-medium">` / `TYPE_SCALE[...]`. SVG text is avoided —
  labels are Bloom `Text` over the SVG so they get the sans font on both platforms (see `CartesianPlot`).
- **`useId()` is not a valid `url(#…)` id** — strip it: `rawId.replace(/[^a-zA-Z0-9_-]/g, '')`.
- **Z-order**: anything absolutely positioned paints over in-flow siblings. `CartesianPlot` puts the grid, your SVG
  and the labels in separate absolute layers in that order; keep your own layers absolute too.
- Padding / margin in LONGHANDS (`paddingTop`…), never `paddingHorizontal` — react-native-web ranks the shorthand above.
- Every plot needs a NAME: `role="img"` + `accessibilityLabel` (a summary). Legends/tiles are plain text.
- recharts series: `animationDuration={450}` → `useChartProgress(values)`; lerp with `from`, reveal with a
  `ClipPath` rect (`box.left + (width − box.left) × progress`) when `from` is null.

## Series colours from the theme

The nine canonical `chart-n` / `chart-n-active` pairs come from the colour policy and
are exposed as `theme.chartColors`. The first five fills retain their established
hues; four additional hues are interleaved. Monochrome presets use separated tones.
`chartHueTone(theme, n)` reads that same pair, so JS charts and CSS tokens agree.
Hand-authored themes without `chartColors` use the same policy from their primary.

- Default series order: `useChartTones()`, then `resolveTone(tones, index, color, activeColor)`.
- A specific token (e.g. `chart-9`): `chartHueTone(theme, 9)`.
- Single-ink looks: `useMonoTone()`.
- Chrome: `useChartCardPalette()` → `surface` (background-secondary), `text` / `textSecondary` / `textTertiary`,
  `track` (grid, bar hover band), `cursor`, `neutralSeries`, `positive` / `negative` / `neutral` chips, `inner`
  (tiles), `pill`. Anything else: `resolveButtonRamps(theme)` / `colorRamp` / `mixColor` from `button/shared`.
  Translucent colours (`color-mix(… 60%, transparent)`) are pre-mixed over the known surface.
- A chart hue is DATA, not status: do not use `success`/`warning` for series. Delta chips are status and do.

## Hover / tooltips on web and native

recharts tooltips are HEADLESS (`content={() => null}`): hovering only sets an active index that drives
the header, cursor, active dots, legend and tiles:

- `CartesianPlot` hit surface: web `onPointerMove` / `onPointerLeave` (offsetX/Y); native responder — a finger
  presses and scrubs, release clears. Index = nearest point (`xScale="point"`) or containing band (`"band"`).
- Outside the plot rectangle (over the axes): `outside="clear"` when leaving the plot should clear the active
  index (area charts), `"keep"` when it should hold (dashboard revenue/orders).
- Non-cartesian charts (radial, funnel, sankey, heatmap): put `onPointerEnter` / `onPointerLeave` on the shape's
  wrapping `View`, or hit-test in your own responder, and call the `useActiveIndex` setter.
- Legend / tile hover: pass `onActiveChange` — they use `onPointerEnter` / `onPointerLeave`.
- Hover colour/opacity easing: `useWebTransition` (no transition on native; snaps under reduced motion).

## Testing

- One suite per card: `src/__tests__/<Pascal>.test.tsx`. Pattern: `src/__tests__/AreaChartCard.test.tsx`.
- Render inside `<BloomThemeProvider mode colorPreset="teal">`. The plot draws nothing until laid out: fire
  `layout` on `${testID}-plot` with the plot's size (e.g. 448 × 189 for a 480-wide card).
- Pin geometry against a REAL recharts render: render the equivalent recharts chart standalone, copy
  `d` strings / coordinates, and assert them exactly (`areaBandPath`, tick values, dot positions).
- Pointer: `fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX, offsetY } })`; native:
  `responderGrant` / `responderMove` with `locationX/Y`, `responderRelease`.
- A chip hidden while hovering is excluded from default queries — use `{ includeHiddenElements: true }`.
- Then run `family-layout`, `aria-state-source-census`, `classname-interop`, `web-css-style`, `root-barrel-graph`,
  `reanimated-deps`, and `bunx tsc --noEmit -p .`, and check the story in light + dark with hover.

Structural fills, hover states, borders and labels read canonical surface and
text roles, including neutral Sankey nodes and idle chart segments. Intentional
data encodings retain ramps: Contributions maps magnitude to accent intensity;
stat-card categorical hues and ProOffer artwork gradients retain their color
scales. Stage glyphs choose black or white for AA against their actual series
fill, including caller-provided colors; they are not shell text.
