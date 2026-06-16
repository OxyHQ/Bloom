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

## Modal component architecture

Bloom has three modal/sheet components. Don't confuse them — they have different implementations and different consumer requirements.

- **`dialog/`** — platform-adaptive. On native uses `@gorhom/bottom-sheet` (`BottomSheetModal` with `enablePanDownToClose`, `enableDismissOnClose`, dynamic sizing, max width 500). On web uses `Portal` + `Pressable` overlay with CSS keyframe animations (consumer must inject `BLOOM_DIALOG_CSS`). The `preventExpansion` prop snaps the native sheet to a fixed `'40%'` snap point. The `webOptions.alignCenter` prop centers the dialog vertically on web. **Native consumers must wrap their app root with `GestureHandlerRootView` and `BottomSheetModalProvider`** — without these, `Dialog` (and `Prompt`) silently fail to render.
- **`prompt/`** — thin wrapper over `dialog/` for confirmation dialogs. Always passes `preventExpansion` (40% sheet on native) and `webOptions.alignCenter: true` (centered 320px modal on web). Adds title, description, and action button primitives. `Prompt.Action` defaults to `shouldCloseOnPress={true}`. Same provider requirements as `dialog/`. `ActionColor` enum: `primary | primary_subtle | secondary | negative | negative_subtle`.
- **`bottom-sheet/`** — standalone, NOT built on Gorhom. Uses RN `Modal` + `react-native-reanimated` + `react-native-gesture-handler` directly. Exposes a `BottomSheetRef` with `present/dismiss/close/expand/collapse/scrollTo`. Use this when the compound `Dialog` API doesn't fit, when avoiding the Gorhom dependency, or when fine-grained scroll/keyboard/detached behavior is needed. Does not require `BottomSheetModalProvider`.

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
