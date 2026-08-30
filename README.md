# Bloom

Shared UI component library for the Oxy ecosystem. Built for React Native + Expo + Web.

## Install

```sh
bun add @oxyhq/bloom
```

### Peer dependencies

Required:

- `react >= 18`
- `react-native >= 0.73`
- `react-native-safe-area-context >= 5`

Also required:

- `react-native-reanimated >= 3.13` (`Dialog`, `BottomSheet`, `toast`, `Loading`) — on web too: the toast engine runs on react-native-web.
- `react-native-gesture-handler >= 2.16.1` (`Dialog`, `BottomSheet`, toast swipe-to-dismiss) — **native** also needs the app root wrapped in `GestureHandlerRootView`, see [Dialog](#dialog); on web the toast host provides its own.
- `react-native-svg >= 13` (Bloom icons, Avatar `squircle` shape)

## Usage

### App root

Mount `BloomProvider` once, at the very top of the app. It composes every piece of
app-wide Bloom state — theme, haptics, image resolution, scroll restoration and the
tab-bar minimize progress — so none of them can end up at the wrong depth. It takes
all of `BloomThemeProvider`'s props plus `imageResolver` and `haptics`.

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

Everything scrollable must be **under** it: on web `useScrollRestoration()` throws
outside its provider, so a list rendered beside the root (a right rail, an overlay)
crashes the screen.

Outlets are **not** included — their position in the tree is a real app decision, and
a second mount duplicates every surface they render. Mount these yourself, under
`BloomProvider`: `<ToastOutlet>`, `<Portal.Provider>`/`<Portal.Outlet>`,
`<SurfaceHost>`, `<BloomDialogProvider>`, `<AlertDialogHost>`.

### Theme

`BloomProvider` also installs the Android blur target used by modal backdrops;
without that root, Android safely falls back to dim-only overlays. It already mounts `BloomThemeProvider`; mount it directly only when you
need a nested/scoped theme. It accepts controlled `mode` and `colorPreset` props — persist them however you like (AsyncStorage, Zustand, etc.).

```tsx
import { BloomThemeProvider } from '@oxyhq/bloom/theme';

<BloomThemeProvider mode="system" colorPreset="teal">
  <App />
</BloomThemeProvider>
```

Access theme values in any component:

```tsx
import { useTheme } from '@oxyhq/bloom/theme';

const theme = useTheme();
// theme.colors.primary, theme.colors.text, theme.isDark, etc.
```

10 color presets: `teal`, `blue`, `green`, `amber`, `red`, `purple`, `pink`, `sky`, `orange`, `mint`.

4 modes: `light`, `dark`, `system`, `adaptive` (uses iOS/Android native dynamic colors when available).

### Overlay components: Dialog, BottomSheet, toast / alert

Bloom ships **two** overlay surface components plus feedback helpers:

| Component | Use when |
|-----------|----------|
| `Dialog` | All modal surfaces — centered card, side-sheet (left/right), or bottom-sheet — via the `placement` prop. Confirmation flows AND custom content. |
| `BottomSheet` | You need direct control over snap points, scroll handoff, gesture coordination, or detached presentation. |
| `toast` / `alert` | Passive feedback (`toast`) or one-shot confirmations (`alert`) called imperatively from anywhere. |

> **Removed in 0.16.x:** `CenteredDialog` and `ResponsiveSheet` no longer exist. Migrate: `<CenteredDialog visible={v} onClose={c}>…</CenteredDialog>` → `<Dialog placement="center" open={v} onClose={c}>…</Dialog>`; `<ResponsiveSheet side="left" open={o} onClose={c}>…</ResponsiveSheet>` → `<Dialog placement={{ base:'bottom', md:'left' }} open={o} onClose={c}>…</Dialog>`.

### Dialog

A single `<Dialog>` component for every overlay surface — centered modal, side-sheet, or bottom-sheet — selected by the `placement` prop. Same component and same props on every platform.

> **Required providers (native).** Your app root **must** be wrapped with `GestureHandlerRootView` from `react-native-gesture-handler` for the bottom-sheet pan gestures to work.

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BloomThemeProvider, BloomDialogProvider } from '@oxyhq/bloom';

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BloomThemeProvider mode="system" colorPreset="oxy">
        <BloomDialogProvider>
          <App />
        </BloomDialogProvider>
      </BloomThemeProvider>
    </GestureHandlerRootView>
  );
}
```

`BloomDialogProvider` powers the imperative `alert()` helper — mount it once near the app root.

#### Declarative (the 90% case)

```tsx
import { Dialog, useDialogControl } from '@oxyhq/bloom';

function SignOutButton() {
  const control = useDialogControl();
  return (
    <>
      <Button onPress={() => control.open()}>Sign out</Button>

      <Dialog
        control={control}
        title="Sign out?"
        description="You'll need to enter your password to sign in again."
        actions={[
          { label: 'Sign out', color: 'destructive', onPress: doSignOut },
          { label: 'Cancel', color: 'cancel' },
        ]}
      />
    </>
  );
}
```

#### Controlled open state

```tsx
<Dialog
  placement="center"
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm?"
  actions={[{ label: 'OK', onPress: handleOk }, { label: 'Cancel', color: 'cancel' }]}
/>
```

#### Side-sheet (drawer)

```tsx
// Fixed left side-sheet
<Dialog placement="left" control={control} title="Filters">
  <FilterPanel />
</Dialog>

// Responsive: bottom-sheet on mobile, left drawer on desktop
<Dialog placement={{ base: 'bottom', md: 'left' }} control={control} title="Filters">
  <FilterPanel />
</Dialog>
```

#### Custom content

Provide any JSX as `children`. Combine with `title` to keep a consistent header. Set `contentPadding={0}` when the children own their own insets.

```tsx
<Dialog control={control} title="Pick a tag" contentPadding={0}>
  <YourCustomBody />
</Dialog>
```

#### Pure custom

Drop the declarative props entirely — `children` owns every pixel.

```tsx
<Dialog control={control}>
  <YourEntirelyCustomLayout />
</Dialog>
```

#### Props

- `control?` — from `useDialogControl()`. Omit when using controlled `open` instead.
- `open?` — controlled open state. When provided, wins over `control`.
- `placement?` — `'center' | 'left' | 'right' | 'bottom'` or a responsive map `{ base; sm?; md?; lg?; xl? }`. Default: `'center'`. Breakpoints: sm 640 / md 768 / lg 1024 / xl 1280 px.
- `title?: string` — header text.
- `description?: string` — supporting copy rendered below the title.
- `actions?: DialogAction[]` — confirmation buttons. Each action:
  - `label: string`
  - `color?: 'default' | 'cancel' | 'destructive'` — defaults to `'default'`.
  - `onPress?: (e) => void` — invoked after the dialog finishes closing.
  - `disabled?: boolean`
  - `loading?: boolean` — replaces the label with a spinner and disables the action.
  - `shouldCloseOnPress?: boolean` — defaults to `true`. Set `false` while an async action is in flight.
  - `testID?: string`
- `children?: React.ReactNode` — custom content rendered after the description.
- `onClose?: () => void` — fires after the dialog has finished closing. In controlled mode, the host must flip `open` to `false`.
- `contentPadding?: number` — inner padding of the dialog body. Default `20`. Set `0` for custom children that own their own insets.
- `width?: number` — side-sheet width (px). Default `460`.
- `maxWidth?: number` — centered-card max width (px). Default `480`.
- `maxHeightRatio?: number` — bottom-sheet height as a fraction of viewport height. Default `0.9`.
- `inset?: { top?; bottom?; left?; right? }` — side-sheet inset (px) from the overlay container edges.
- `showHandle?: boolean` — show drag handle in bottom-sheet mode. Default `true`.
- `dismissOnBackdrop?: boolean` — tap backdrop to dismiss. Default `true`.
- `panelStyle? / panelClassName?` — style/class for the panel surface.
- `containerStyle? / containerClassName?` — style/class for the root overlay (e.g. rail offset, theme-var scope).
- `label?: string` — accessibility label.
- `testID?: string`

#### Web setup

Inject the CSS animations into your global styles once:

```tsx
import { BLOOM_DIALOG_CSS } from '@oxyhq/bloom/dialog';

// In your HTML head or global CSS file:
<style>{BLOOM_DIALOG_CSS}</style>
```

### toast

Passive notifications. Bloom's own universal engine — one implementation on native and web, no `sonner` / `sonner-native` to install.

```tsx
import { toast } from '@oxyhq/bloom';
import { ToastOutlet } from '@oxyhq/bloom/toast';

// Mount once near the app root, inside BloomThemeProvider:
<ToastOutlet />

// Anywhere in your app:
toast('Saved');
toast.success('Profile updated');
toast.error('Network error', { duration: 5000 });
toast.warning('Please verify your email');
toast.info('A new version is available');

const id = toast.loading('Uploading…');
toast.dismiss(id);
```

`toast(content, options?)` accepts strings or React elements, and every method
returns the toast's id. `options.type` (`'default' | 'success' | 'error' |
'warning' | 'info' | 'loading'`) is overridden by the typed helpers above; the
full surface (`promise`, `custom`, `wiggle`, `action`/`description`, stacking,
positions) is documented in [docs/toast.mdx](docs/toast.mdx).

### alert()

Imperative one-shot confirmation dialogs, matching React Native's `Alert.alert(title, message?, buttons?)` signature. Calls are queued and rendered through `BloomDialogProvider` — you can call `alert()` from anywhere, including before the provider mounts (alerts queue and drain on subscribe).

```tsx
import { alert } from '@oxyhq/bloom';

alert('Sign out?', 'Are you sure you want to sign out of this device?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Sign out', style: 'destructive', onPress: doSignOut },
]);

// Single OK button (default when no buttons passed):
alert('Saved');
```

Each button:

- `text: string` — required label.
- `style?: 'default' | 'cancel' | 'destructive'` — defaults to `'default'`.
- `onPress?: () => void` — fires after the dialog finishes closing.

### BottomSheet

A standalone, draggable bottom sheet built on React Native `Modal` + `react-native-reanimated` + `react-native-gesture-handler`. **Not** based on `@gorhom/bottom-sheet`, so it does not require `BottomSheetModalProvider`. Use it when the compound `Dialog` API doesn't fit, when you want to avoid the Gorhom dependency, or when you need direct control over scroll, keyboard handling, or detached presentation.

```tsx
import { useRef } from 'react';
import { BottomSheet, type BottomSheetRef } from '@oxyhq/bloom/bottom-sheet';

function Example() {
  const sheetRef = useRef<BottomSheetRef>(null);

  return (
    <>
      <Button onPress={() => sheetRef.current?.present()}>Open</Button>

      <BottomSheet ref={sheetRef} onDismiss={() => console.log('dismissed')}>
        <Text>Sheet content</Text>
      </BottomSheet>
    </>
  );
}
```

`BottomSheetRef` methods: `present()`, `dismiss()`, `close()`, `expand()`, `collapse()`, `scrollTo(y, animated?)`.

`BottomSheetProps`:

- `children`
- `onDismiss?: () => void`
- `enablePanDownToClose?: boolean` — defaults to `true`.
- `enableHandlePanningGesture?: boolean` — defaults to `true`.
- `onDismissAttempt?: () => boolean` — return `false` to veto a dismiss attempt.
- `detached?: boolean` — when `true`, the sheet floats with horizontal margins and rounded corners on all sides; when `false`, it's flush to the bottom edges with rounded top corners only.
- `showHandle?: boolean` — defaults to `true`. Toggles the drag handle pill at the top of the sheet.
- `backdropOpacity?: number` — opacity (0–1) of the translucent dim laid over the blur once fully visible. Defaults to `0.45`.
- `backgroundComponent?` — custom background renderer.
- `backdropComponent?` — custom backdrop renderer.
- `style?`
- `scrollable?: boolean` — defaults to `true`. When `false`, renders `children` directly without the internal `Animated.ScrollView` wrapper. **Required when the sheet's content owns its own scrolling primitive** (e.g. `FlatList`, `SectionList`, or any `VirtualizedList`) — nesting a virtualized list inside the internal ScrollView breaks windowing and triggers a React Native warning. Combine with `manualActivation` so the handle stays draggable while the inner list owns the scroll.
- `manualActivation?: boolean` — defaults to `false`. When `true`, the body pan uses RNGH's `manualActivation` and only activates when (a) the inner ScrollView is at the top AND (b) the user has moved their finger downward by > 8dp. This is the `@gorhom/bottom-sheet` coordination model — recommended for sheets that contain a scrolling region on Android (the legacy always-active pan can steal vertical events from the inner scroller). Enabling this also gives the drag handle its own dedicated, unconditionally-active gesture so users can always grab the handle even mid-scroll.
- `dynamicBackdrop?: boolean` — defaults to `false`. When `true`, the backdrop dims proportionally to drag distance — fades from full `backdropOpacity` (sheet at rest) to 30% as the sheet is pulled down 40% of the screen height. This is the iOS Photos / iMessage drag-to-dismiss look. The base `backdropOpacity` still controls the resting dim.
- `handleComponent?: () => React.ReactNode` — custom drag-handle renderer. When provided (and `showHandle` is `true`), replaces the default 36×5 pill. In `manualActivation` mode the rendered handle sits inside the dedicated handle hit-area and gesture detector so it remains unconditionally draggable.

**Pattern: sheet with a `FlatList` inside.** Use `scrollable={false}` so the BottomSheet doesn't wrap the list in its own ScrollView, plus `manualActivation` so the drag handle remains the dedicated drag-to-dismiss surface while the list owns vertical scroll:

```tsx
<BottomSheet ref={sheetRef} scrollable={false} manualActivation>
  <FlatList data={items} renderItem={renderItem} />
</BottomSheet>
```

**Pattern: iOS Photos-style backdrop dim.** Combine `manualActivation` (so the inner photo grid keeps scroll ownership) with `dynamicBackdrop` (so the overlay fades as the user pulls down):

```tsx
<BottomSheet
  ref={sheetRef}
  scrollable={false}
  manualActivation
  dynamicBackdrop
  backdropOpacity={0.85}
>
  <PhotoGrid />
</BottomSheet>
```

### Button

```tsx
import { Button, PrimaryButton, SecondaryButton, IconButton, GhostButton, TextButton } from '@oxyhq/bloom/button';

<Button variant="primary" size="large" onPress={handlePress}>
  Save
</Button>

<IconButton icon={<TrashIcon />} onPress={handleDelete} />

<SecondaryButton disabled>Cancel</SecondaryButton>
```

Variants: `primary`, `secondary`, `icon`, `ghost`, `text`. Sizes: `small`, `medium`, `large`.

### GroupedButtons

iOS-settings-style grouped action list.

```tsx
import { GroupedButtons } from '@oxyhq/bloom/grouped-buttons';

<GroupedButtons>
  <GroupedButtons.Item label="Edit Profile" icon={<EditIcon />} onPress={handleEdit} />
  <GroupedButtons.Item label="Settings" onPress={handleSettings} />
  <GroupedButtons.Item label="Delete Account" destructive onPress={handleDelete} />
</GroupedButtons>
```

### Divider

```tsx
import { Divider } from '@oxyhq/bloom/divider';

<Divider />
<Divider spacing={16} color="#ccc" />
<Divider vertical />
```

### RadioIndicator

```tsx
import { RadioIndicator } from '@oxyhq/bloom/radio-indicator';

<RadioIndicator selected={isSelected} />
<RadioIndicator selected={true} size={24} selectedColor="#007AFF" />
```

### Avatar

Supports circle and squircle shapes. Squircle requires `react-native-svg`.

```tsx
import { Avatar } from '@oxyhq/bloom/avatar';

<Avatar uri="https://example.com/photo.jpg" size={48} />
<Avatar uri={userPhoto} shape="squircle" verified verifiedIcon={<BadgeIcon />} />
<Avatar fallbackSource={require('./default.png')} />
```

### Loading

4 variants: `spinner`, `top` (animated collapse/expand), `skeleton`, `inline`.

```tsx
import { Loading } from '@oxyhq/bloom/loading';

<Loading />
<Loading variant="spinner" text="Loading..." />
<Loading variant="top" showLoading={isRefreshing} />
<Loading variant="skeleton" lines={4} />
<Loading variant="inline" text="Saving..." />
```

Animation is platform-specific but the API and visuals are identical. On native, the spinner (used by `spinner`/`inline`) and the `top` collapse/expand are driven by `react-native-reanimated` (with `react-native-svg` for the spinner blades when available). On web, `Loading` resolves to a CSS-animated fork — a `@keyframes` rotation for the spinner and CSS transitions for the `top` variant — so it imports neither reanimated nor SVG and works in any web bundler (Vite, webpack, Metro-web) with no extra peers.

### Collapsible

```tsx
import { Collapsible } from '@oxyhq/bloom/collapsible';

<Collapsible title="Advanced Options" defaultOpen={false}>
  <Text>Hidden content here</Text>
</Collapsible>
```

### ErrorBoundary

```tsx
import { ErrorBoundary } from '@oxyhq/bloom/error-boundary';

<ErrorBoundary onError={(error) => logError(error)}>
  <App />
</ErrorBoundary>

<ErrorBoundary
  title="Oops!"
  message="Something broke."
  retryLabel="Retry"
  fallback={<CustomFallback />}
>
  <RiskyComponent />
</ErrorBoundary>
```

### PromptInput

AI chat input with attachments, fullscreen expand, and submit/stop control.

```tsx
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAttachments,
  PromptInputSubmitButton,
} from '@oxyhq/bloom/prompt-input';

// Simple mode — renders built-in layout
<PromptInput
  value={text}
  onValueChange={setText}
  onSubmit={handleSend}
  isLoading={isGenerating}
  onStop={handleStop}
  placeholder="Ask anything..."
/>

// Compound mode — full control over layout
<PromptInput value={text} onValueChange={setText} onSubmit={handleSend}>
  <PromptInputAttachments />
  <PromptInputTextarea placeholder="Type a message..." />
  <PromptInputActions>
    <MyAddButton />
    <PromptInputSubmitButton isLoading={isGenerating} onStop={handleStop} />
  </PromptInputActions>
</PromptInput>
```

## Sub-path exports

```ts
import { BloomThemeProvider, useTheme } from '@oxyhq/bloom/theme';
import { Dialog, BloomDialogProvider, alert, useDialogControl } from '@oxyhq/bloom/dialog';
import { BottomSheet, type BottomSheetRef } from '@oxyhq/bloom/bottom-sheet';
import { toast, ToastOutlet } from '@oxyhq/bloom/toast';
import { Button, IconButton } from '@oxyhq/bloom/button';
import { GroupedButtons } from '@oxyhq/bloom/grouped-buttons';
import { Divider } from '@oxyhq/bloom/divider';
import { RadioIndicator } from '@oxyhq/bloom/radio-indicator';
import { Avatar } from '@oxyhq/bloom/avatar';
import { Loading } from '@oxyhq/bloom/loading';
import { Collapsible } from '@oxyhq/bloom/collapsible';
import { ErrorBoundary } from '@oxyhq/bloom/error-boundary';
import { PromptInput, PromptInputTextarea } from '@oxyhq/bloom/prompt-input';
```

## Development

```sh
bun install
bun run build        # react-native-builder-bob
bun run typescript   # type-check
bun run test         # jest
bun run clean        # remove lib/
```

## License

AGPL-3.0-only -- The Oxy Foundation, Inc. See the [LICENSE](LICENSE) file for details.
