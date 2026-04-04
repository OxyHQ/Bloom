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

## Key Info

- **Peers**: react >= 18, react-native >= 0.73, react-native-safe-area-context >= 5
- **Optional peers**: @gorhom/bottom-sheet, reanimated, gesture-handler, SVG, sonner
- **Consumers**: Mention, Allo, Alia, Homiio, OxyHQ apps
