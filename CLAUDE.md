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
