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

## Component Families

Compound components are flat-prefixed exports (e.g. `Tabs`, `TabsTrigger`, `TabsContent`; `Menu`, `MenuItem`, `MenuTrigger`). The collection families `Icons`, `Typography`, `Skeleton`, `Grid`, `Code`, `Fonts` stay namespaces. No deprecated/back-compat aliases — breaking renames are clean cuts.

**Which pattern (the rule, so it's never ambiguous):**
- **Flat-prefix** when the parts are the *fixed-arity pieces of ONE component* that are always composed together and have specific names (`SelectTrigger`, `SegmentedControlItem`). This is the shadcn/Radix convention.
- **Namespace** when it's an *open/large set of sibling primitives* of the same kind whose members have **generic, collision-prone names** (`Text`, `Box`, `Row`, `Col`, `Title`) or **high cardinality** (hundreds of icons). Flattening these would either collide at the top level (`Skeleton.Text` vs `Typography.Text` vs RN `Text`) or pollute it (`Icons.*`). The namespace disambiguates for free, and because each family ships as a subpath export (`@oxyhq/bloom/skeleton`), `import * as` does **not** cost tree-shaking. Under this rule Skeleton (`Text/Box/Row/Col/Circle/Pill`) is correctly a namespace.

## Media / Avatar resolution — ONE centralized chokepoint (0.19.0)

All Oxy media URLs are built in EXACTLY ONE place: the SDK's `oxyServices.getFileDownloadUrl(id, variant)` (canonical `https://cloud.oxy.so/<id>?variant=` for public assets, signed `api.oxy.so/assets/<id>/stream` for private). Bloom never builds these URLs and never hardcodes a domain. The bridge is the **`ImageResolver`** (subpath `@oxyhq/bloom/image-resolver`).

**The contract every app follows:**
- Register ONE resolver at the app root, wiring Bloom → the SDK chokepoint, and pass it to `ImageResolverProvider`:
  ```tsx
  import { ImageResolverProvider } from '@oxyhq/bloom/image-resolver';

  <ImageResolverProvider value={(id, variant) => oxyServices.getFileDownloadUrl(id, variant)}>
    <App />
  </ImageResolverProvider>
  ```
- Pass BARE Oxy file IDs (never a URL) to `<Avatar source={...}>`, with an optional `variant` to pick a rendition:
  ```tsx
  <Avatar source={fileId} variant="thumb" />   {/* lists / grids → small rendition */}
  <Avatar source={fileId} />                    {/* full-size rendition */}
  ```

**Resolver signature (widened in 0.19.0, additive / non-breaking):**
`ImageResolver = (id: string, variant?: string) => string | undefined`. Old `(id) => …` registrants still satisfy it (they ignore the 2nd arg → full-size). `Avatar` only calls the resolver for non-URL string `source`; a full `http(s)://`/`data:` URL or `{ uri }` object passes through untouched, ignoring `variant`.

**Components that forward `variant`:** `Avatar` (`variant?`), `AvatarGroup` (`variant?`, default `'thumb'` since stacked avatars are small), `UserHoverCard` (`variant?`, default full). All route the value through `Avatar.source` → the resolver.

**NEVER do this** (defeats centralization): hardcode `cdn.oxy.so` / `cloud.oxy.so` / `${oxyUrl}/media/...`, or call `getFileDownloadUrl(id, 'thumb')` yourself and pass `{ uri }` into `Avatar` to get a thumbnail — pass `source={id} variant="thumb"` instead so the single resolver builds the URL.

`image-resolver/` is pure JS (a React context); it has NO `.web`/`.native` split and is a universal single-file subpath — correct, no platform fork needed.

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
