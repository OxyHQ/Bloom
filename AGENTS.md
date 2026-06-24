# Bloom (@oxyhq/bloom)

## Custom Agents

Use this agent for all implementation work:
- `bloom` — UI library engineer (component changes affect ALL ecosystem apps)

## Commands

```bash
bun run build               # bob build (→ lib/)
bun run test                # Jest tests
bun run typescript          # Type check (tsc --noEmit)
bun run clean               # rm -rf lib
bun run release             # Clean + build + release-it
```

## Architecture

Shared UI component library for React Native + Web. Used by ALL apps in the Oxy ecosystem.

```
src/
  accordion/     admonition/    avatar/        badge/
  bottom-sheet/  button/        card/          checkbox/
  chip/          collapsible/   context-menu/  dialog/
  divider/       error-boundary/ fill/         grid/
  grouped-buttons/ hooks/       icon-circle/   icons/ (100+)
  image-resolver/ loading/     menu/          portal/
  prompt/        prompt-input/  radio-indicator/ search-input/
  segmented-control/ select/   settings-list/ skeleton/
  styles/        switch/        tabs/          text-field/
  theme/         toast/         tooltip/       typography/
  index.ts       # Barrel export (37 named exports)
```

## Platform-Specific Files

Components with `.web.tsx` variants: dialog, context-menu, menu, prompt-input/Textarea, select, toast, tooltip, theme/adaptive-colors.

## Overlay surface architecture (0.16.x — two canonical components)

Only TWO overlay surface components exist. `CenteredDialog` and `ResponsiveSheet` were REMOVED (breaking, no shims) in 0.16.x.

- **`dialog/`** (`@oxyhq/bloom/dialog`) — THE unified overlay. Renders as a centered modal, side-sheet (left/right), or bottom-sheet based on the `placement` prop. `placement` accepts `'center' | 'left' | 'right' | 'bottom'` or a responsive map `{ base; sm?; md?; lg?; xl? }` resolved by `useWindowDimensions()` against breakpoints sm 640 / md 768 / lg 1024 / xl 1280. Default placement: `'center'`. Two control models: imperative `control` (via `useDialogControl`) OR controlled `open` / `onClose`. Content modes: declarative (`title`/`description`/`actions`), custom `children`, or imperative `alert()`. Key props: `width` (side-sheet width, default 460), `maxWidth` (centered cap, default 480), `maxHeightRatio` (bottom-sheet height fraction, default 0.9), `inset {top,bottom,left,right}` (side-sheet inset from overlay edges), `showHandle` (bottom drag handle, default true), `dismissOnBackdrop` (default true), `panelStyle`/`panelClassName` (paint the surface), `containerStyle`/`containerClassName` (root overlay — e.g. rail offset / theme-var scope), `contentPadding` (body padding default 20; set 0 for custom children that own their padding), `label`. Bottom placement composes `BottomSheet` on BOTH web and native; custom `children` on bottom placement are NON-scrollable (children own scrolling). Consumer must inject `BLOOM_DIALOG_CSS` on web.
- **`bottom-sheet/`** (`@oxyhq/bloom/bottom-sheet`) — standalone cross-platform component (web + native). Gesture drag-to-dismiss, internal scroll, snap. `style` paints the sheet surface; `scrollable` (default true) opts the internal ScrollView in/out. Exposes `BottomSheetRef` with `present/dismiss/close/expand/collapse/scrollTo`. `Dialog`'s bottom placement composes it internally.

**REMOVED — do NOT use:**
- `CenteredDialog`, `CenteredDialogProps`, `BLOOM_CENTERED_DIALOG_CSS`, `CENTERED_DIALOG_BACKDROP_TESTID` → use `<Dialog placement="center">`.
- `ResponsiveSheet`, `@oxyhq/bloom/responsive-sheet` subpath → use `<Dialog placement={{ base:'bottom', md:'left' }}>`.

`AlertDialog` and `Command` still exist with unchanged public APIs — they now build on `Dialog` internally.

**Native consumers must wrap the app root with `GestureHandlerRootView`** for pan gestures to work (no longer requires `BottomSheetModalProvider` from Gorhom).

## Build

Uses `react-native-builder-bob` → `lib/` (commonjs + module + typescript).

## Theme System

`BloomThemeProvider` manages color presets and light/dark mode:

- Supports both **controlled** (`colorPreset` prop) and **uncontrolled** (`setColorPreset()` from context) usage
- Applies dark class on web via `applyDarkClass()`
- Applies CSS custom properties on web via `applyColorPresetVars()` when preset or mode changes
- 12 built-in color presets: teal, blue, green, amber, red, purple, pink, sky, orange, mint, oxy
- `useBloomTheme()` returns `{ theme, mode, colorPreset, setMode, setColorPreset }`
- `BloomColorScope` overrides color for a subtree without affecting the rest of the app
- `BloomColorScope` must emit both canonical tokens (`--primary`) and Tailwind v4 aliases (`--color-primary`) from the same resolver, so NativeWind classes inside scoped subtrees use the scoped preset instead of the app-wide root preset

```typescript
// Basic usage
<BloomThemeProvider mode="system" colorPreset="oxy">
  <App />
</BloomThemeProvider>

// Dynamic color change from a child component
const { setColorPreset } = useBloomTheme()
setColorPreset("blue") // Updates context + CSS vars on web
```

## Key Info

- **Peers**: react >= 18, react-native >= 0.73, react-native-safe-area-context >= 5
- **Optional peers**: @gorhom/bottom-sheet, reanimated, gesture-handler, SVG, sonner
- **Consumers**: Mention, Allo, Alia, Homiio, OxyHQ apps

## Coding Standards

- No `useEffect` for derived state — compute during render
- No `useEffect` for event responses — handle in event handlers
- Platform-agnostic code by default; use `Platform.OS` checks only in dedicated platform files
- `apply-dark-class.ts` handles both dark mode class and CSS var injection on web (no-op on native)
