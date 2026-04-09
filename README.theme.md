## Theme & Color Presets

Bloom ships a theme system with four modes and eleven presets.

- Modes: `light`, `dark`, `system`, `adaptive`.
- Presets: `teal`, `blue`, `green`, `amber`, `yellow`, `red`, `purple`, `pink`, `sky`, `orange`, `mint`, `oxy`.

`adaptive` uses iOS/Android native dynamic colors when available and falls back to the selected preset otherwise. On web, adaptive behaves like `system`.

Wrap your app with `BloomThemeProvider` and pass your preferred mode/preset. Use `hexToAppColorName` to map arbitrary brand colors to the closest preset.

```tsx
import { BloomThemeProvider } from '@oxyhq/bloom/theme';

<BloomThemeProvider mode="system" colorPreset="oxy">
  <App />
</BloomThemeProvider>
```

Use `BloomColorScope` to tint a subtree with a different preset without changing the global theme.

```tsx
<BloomColorScope colorPreset="mint">
  <ProfileCard />
</BloomColorScope>
```
