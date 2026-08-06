<p align="center">
  <b>Bloom is the UI library every Oxy app is built with.</b><br>
  One component set for React Native, Expo and the web, with the same props on every platform.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@oxyhq/bloom"><img alt="npm" src="https://img.shields.io/npm/v/@oxyhq/bloom?style=flat-square&color=440151&label=%40oxyhq%2Fbloom"></a>
  <a href="./LICENSE"><img alt="License Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-informational?style=flat-square"></a>
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-0.73%2B-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-supported-000020?style=flat-square&logo=expo&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Bun" src="https://img.shields.io/badge/Bun-1.3.14-000000?style=flat-square&logo=bun&logoColor=white">
</p>

---

<table>
<tr>
<td valign="top" width="50%">

### What it is

Components, hooks and design tokens published as `@oxyhq/bloom` across 88 subpath exports, shipped as `src` for Metro and as compiled CommonJS and ESM for everyone else. Web builds resolve platform forks automatically through export conditions, so a `.web.tsx` fork never reaches a native bundle.

Styling is NativeWind classes throughout. There are no colour props and no wrapper components to theme a button, because a second way to set a colour is a second thing that can disagree.

</td>
<td valign="top" width="50%">

### How it fits the Oxy platform

Bloom is the presentation layer of [**oxy**](https://github.com/OxyHQ/oxy). It knows nothing about identity or the network, so it has no dependency on the Oxy SDK and can be used on its own.

Where an app does use the SDK, the two meet at one seam: register `imageResolver` once at the root, usually `oxyServices.getFileDownloadUrl` from `@oxyhq/core`, and every `Avatar` and image in the tree resolves bare file ids for free.

</td>
</tr>
</table>

## Install

```bash
bun add @oxyhq/bloom
```

<details>
<summary><b>Peer dependencies</b></summary>

<br>

Always required:

| Package | Range |
|---|---|
| `react` | `>=18.0.0` |
| `react-dom` | `>=18.0.0` |
| `react-native` | `>=0.73.0` |
| `react-native-safe-area-context` | `>=5.0.0` |
| `react-native-screens` | `>=3.16.0` |
| `nativewind` | `>=5.0.0` |

Required by specific surfaces, and by more of them than you would guess:

| Package | Range | Needed by |
|---|---|---|
| `react-native-reanimated` | `>=3.13.0` | `Dialog`, `BottomSheet`, `toast`, `Loading`, on the web too |
| `react-native-gesture-handler` | `>=2.16.1` | `Dialog`, `BottomSheet`, swipe to dismiss on toasts |
| `react-native-svg` | `>=13.0.0` | icons, `Avatar` in `squircle` shape |
| `react-native-keyboard-controller` | `>=1.11.4` | keyboard aware surfaces |
| `expo`, `expo-blur`, `expo-font`, `expo-haptics`, `expo-image`, `expo-symbols` | see `package.json` | native effects, fonts, haptics, images and SF Symbols |
| `expo-glass-effect` | `>=0.1.9` | glass surfaces |
| `expo-router` | `>=3.0.0` | the `expo-router` variants of `tabs`, `scroll` and `tab-bar` |
| `@react-native-community/netinfo` | `>=11.1.0` | `connection-status` |

On native, wrap the app root in `GestureHandlerRootView` from `react-native-gesture-handler`, or the bottom sheet pan gestures will not fire.

</details>

## Getting started

Mount `BloomProvider` once, at the very top of the app. It composes every piece of app wide Bloom state, theme, haptics, image resolution, scroll restoration and tab bar minimise progress, so none of them can end up at the wrong depth.

```tsx
import { BloomProvider } from '@oxyhq/bloom/provider';

<BloomProvider
  defaultMode="system"
  defaultColorPreset="blue"
  persistKey="app.theme"
  storage={storage}
  imageResolver={(id, variant) => oxyServices.getFileDownloadUrl(id, variant)}
>
  <App />
</BloomProvider>
```

Everything scrollable must sit under it. `useScrollRestoration()` throws outside its provider, so a list rendered beside the root, a right rail or an overlay, crashes that screen.

Outlets are deliberately not included, because where they sit in the tree is a real application decision and a second mount duplicates every surface they render. Mount these yourself, under `BloomProvider`: `ToastOutlet`, the `Provider` and `Outlet` pair from `@oxyhq/bloom/portal`, `SurfaceHost`, `BloomDialogProvider` and `AlertDialogHost`.

```tsx
import { Button } from '@oxyhq/bloom/button';
import { toast } from '@oxyhq/bloom/toast';

<Button onPress={() => toast.success('Saved')}>Save</Button>
```

## Theming

<table>
<tr>
<td valign="top" width="50%">

**Four modes**

`light`, `dark`, `system`, and `adaptive`, which follows the iOS and Android dynamic colours when the platform offers them.

```tsx
import { useTheme } from '@oxyhq/bloom/theme';

const theme = useTheme();
// theme.colors.primary, theme.colors.text, theme.isDark
```

`useTheme()` throws outside a provider, so hoist `BloomProvider` above the splash and loading branches, not just above the main tree.

</td>
<td valign="top" width="50%">

**Eighteen colour presets**

`teal`, `blue`, `green`, `yellow`, `red`, `purple`, `pink`, `sky`, `orange`, `mint`, `pumpkin`, `gray`, `brown`, `peach`, `rose`, plus `oxy` and `faircoin`, which are reserved for the accounts whose brands they are, and `mono`, which ships with a subscription.

Every palette is generated from a single seed colour by a dependency free colour engine, into the full Material 3 role set for light and dark. A colour a user picks themselves runs through exactly the same path, so a preset is only a fixed seed.

</td>
</tr>
</table>

## Components

Bloom publishes 88 subpath exports. Importing from the subpath rather than the root keeps a bundle to what it actually renders.

| Group | Exports |
|---|---|
| Providers and theme | `provider`, `theme`, `color-presets`, `preset-vars`, `design-tokens`, `tailwind-preset`, `styles`, `hooks` |
| Overlays | `dialog`, `alert-dialog`, `bottom-sheet`, `popover`, `context-menu`, `menu`, `tooltip`, `overlay`, `portal`, `surfaces` |
| Actions | `button`, `fab`, `frosted-icon-button`, `grouped-buttons`, `pressable-scale`, `pressable-with-hover`, `subtle-hover` |
| Forms | `text-field`, `field`, `input-group`, `label`, `select`, `combobox`, `command`, `checkbox`, `switch`, `slider`, `segmented-control`, `search`, `prompt-input` |
| Layout and lists | `grid`, `list`, `scroll`, `tabs`, `tab-bar`, `settings-list`, `content-panel`, `card`, `accordion`, `collapsible`, `divider`, `item` |
| Identity and media | `avatar`, `avatar-group`, `user-hover-card`, `profile-card`, `image-resolver`, `image-aspect-ratio-cache`, `zoomable-image-gallery`, `media-inset-border`, `progressive-blur`, `fill` |
| Feedback and data | `toast`, `admonition`, `loading`, `skeleton`, `error-boundary`, `badge`, `chip`, `kbd`, `code`, `link-preview`, `connection-status`, `connection-dots` |
| Charts and motion | `composition-bar`, `dot-grid-meter`, `stat-bar`, `activity-heatmap`, `motion`, `animated-check`, `icon-circle`, `radio-indicator` |
| Assets | `icons`, `typography`, `fonts`, `benefit-list` |

`tabs`, `scroll` and `tab-bar` each ship an `/expo-router` variant for apps on Expo Router.

## Documentation

Component guides live in [`docs/`](./docs): [getting started](./docs/getting-started.mdx), [theme](./docs/theme.mdx), [design tokens](./docs/design-tokens.mdx), [dialog](./docs/dialog.mdx), [bottom sheet](./docs/bottom-sheet.mdx), [toast](./docs/toast.mdx), [alert](./docs/alert.mdx), [menu](./docs/menu.mdx), [select](./docs/select.mdx), [context menu](./docs/context-menu.mdx), [button](./docs/button.mdx), [avatar](./docs/avatar.mdx), [text field](./docs/text-field.mdx), [settings list](./docs/settings-list.mdx), [tab bar](./docs/tab-bar.mdx), [prompt input](./docs/prompt-input.mdx) and [loading](./docs/loading.mdx).

Upgrade notes are in [MIGRATION.md](./MIGRATION.md), and the theme reference is in [README.theme.md](./README.theme.md).

## Development

```bash
bun install
bun run build        # react-native-builder-bob, then verify the published shape
bun run typescript   # type check
bun run test         # jest
bun run storybook    # component workshop on port 6006
bun run clean        # remove lib/
```

`build` regenerates the platform export map and the theme CSS first, then verifies the package it just produced. If that verification fails, the package is wrong, not the check.

## Contributing

Issues and pull requests are welcome. Please run `bun run typescript` and `bun run test` first. Org wide [contributing notes](https://github.com/OxyHQ/.github/blob/main/CONTRIBUTING.md), the [security policy](https://github.com/OxyHQ/.github/blob/main/SECURITY.md) and the [code of conduct](https://github.com/OxyHQ/.github/blob/main/CODE_OF_CONDUCT.md) live in the organisation profile.

## License

Apache-2.0, The Oxy Collective, Inc. See [LICENSE](./LICENSE).

Bloom moved from AGPL-3.0-only to Apache-2.0 at `0.87.0`. Versions published before that keep AGPL-3.0-only permanently; a licence change binds future versions only.

Third party code Bloom derives from, principally the universal toast engine, is credited in [NOTICE](./NOTICE).
