# GoWay canvas baseline and ownership

GoWay origin/main0a83b1d, Bloom17.19.3 and app-preset6.5.0; exact SHA/versions and raster hashes are in baseline.json/artifacts.json. The current app runs signed out at localhost8132. The harness replaces only OAuth application registration with an anonymous synthetic application; map styles, tiles and terrain are real public GoWay assets, and the catalogue is the current app's data. No location or routing answers are fabricated. Chromium uses software WebGL for functional observation, not release performance evidence.

One mounted tree was resized1440→900→390→320→1440, with height900 on desktop and844 on narrow layouts. Five full viewport PNGs preserve the visible map, official brand and compact attribution control. The actual dev-exposed MapLibre instance and canvas retain identity; recorded center/zoom/bearing/pitch persist. The search input retains identity across desktop widths, but not when switching to bottom sheet or back. No page errors or location requests were recorded. Pan/pinch, selection/Back, keyboard and physical-device acceptance remain to be exercised.

| Need | Existing owner | Minimal extension |
| --- | --- | --- |
| Full background map and retained activity | Screen scroll=none and host viewport | Canvas delegates to Screen; no extra root ScreenScope or global provider |
| Persistent responsive information region | Surface, ScreenScope, ScrollArea | CanvasPanel keeps one content/header/scroller tree; only geometry changes; own scope isolates claims |
| Settled obstruction and live movement | top/bottom edge claims, edge-store, Reanimated | Local side claims reuse edge-store; publish resting region separately from live panel height/progress |
| Sheet pan/scroll arbitration | BottomSheetBase manual activation | Extract compatible gesture decision helpers, retain separate modal and nonmodal presentation |
| Camera fit constraints | GoWay clampFitPadding and useExplore | Consume measured region, preserve adapter's35% minimum free axis and discrete fit policy |
| Credits and controls | GoWay map attribution, Bloom MapControls/BlurIsland | Position against measured/live obstruction without replacing map engine or legal UI |

Current defects: useMapPadding guesses peek140 and window-based half; the panel claims peek regardless of selected snap; full uses a240px floor that can exceed a very short host; conditional SidePanel/MapSheet remounts descendants. The local window breakpoint880 and width384 are existing GoWay policy, not proposed universal defaults.

## Proposed public composition

```tsx
<Canvas active={focused} testID="explore-canvas">
  <ExploreCanvasContent />
</Canvas>
```

ExploreCanvasContent uses `useCanvasRegion()` for the local measured bounds and settled occupied insets, keeps its MapCanvas mounted, and declares one `CanvasPanel` with `side={{ from:880, width:384, edge:'start' }}`, controlled `snap/onSnapChange`, measured header, current body and shared animatedHeight/animatedProgress. Side gestures are disabled without replacing the subtree. GoWay converts the physical inset result through clampFitPadding and decides when camera fitting is appropriate; dragging does not issue fit calls.

Coordinates are local CSS/layout pixels from the Canvas viewport, not window coordinates. Logical side policy is converted once using direction; reported map padding is physical top/right/bottom/left. Occupancy combines each edge by MAX through existing stores, not summation, and hidden/inactive panels release claims and hit targets. The full detent reports its actual occupied height, never an invented half-height. The panel owns its own ScreenScope; Canvas inherits Screen activity/navigation/keyboard ownership. Keyboard handling must use the actual reduced viewport or the existing Screen keyboard signal once, never both.

No visual redesign is proposed: preserve current Bloom material and GoWay's existing panel policy. Final consumer acceptance requires the normally published additive package, not this local snapshot. Physical Android is coordinated with the device owner; iPhone verification is deferred by the user.
