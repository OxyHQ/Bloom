# Bloom

Shared UI component library for the Oxy ecosystem. Built for React Native + Expo + Web.

## Install

```sh
npm install @oxyhq/bloom
```

### Peer dependencies

Required:

- `react >= 18`
- `react-native >= 0.73`
- `react-native-safe-area-context >= 5`

Optional:

- `@gorhom/bottom-sheet >= 5` (native `Dialog` and `Prompt`) — also requires wrapping the app root with `BottomSheetModalProvider`, see [Dialog](#dialog).
- `react-native-reanimated >= 3` (native `Dialog`, `BottomSheet`, Loading `top` variant)
- `react-native-gesture-handler >= 2` (native `Dialog`, `BottomSheet`) — also requires wrapping the app root with `GestureHandlerRootView`, see [Dialog](#dialog).
- `react-native-svg >= 13` (Avatar `squircle` shape)

## Usage

### Theme

Wrap your app with `BloomThemeProvider`. It accepts controlled `mode` and `colorPreset` props — persist them however you like (AsyncStorage, Zustand, etc.).

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

### Modal components: Dialog, Prompt, BottomSheet

Bloom ships three components for modal/sheet presentation. Pick the one that matches your use case:

| Component | Native | Web | Use when |
|-----------|--------|-----|----------|
| `Dialog` | Bottom sheet (Gorhom), dynamic height | Centered modal | You need a modal container with arbitrary content — forms, pickers, custom layouts |
| `Prompt` | 40%-height bottom sheet (Gorhom) | Centered 320px modal | You need a confirmation dialog with title, description, and action buttons |
| `BottomSheet` | Draggable sheet (Bloom's own, no Gorhom) | Same pattern via RN `Modal` | You need a bottom sheet without the Gorhom dependency, or with custom snap/scroll/keyboard control |

`Prompt` is built on top of `Dialog` (so the provider requirements are the same). `BottomSheet` is a separate, standalone implementation.

### Dialog

Platform-adaptive dialogs — bottom sheet on native, centered modal overlay on web.

> **Required providers (native).** `Dialog` (and therefore `Prompt`) uses `@gorhom/bottom-sheet` on Android/iOS. Your app root **must** be wrapped with `GestureHandlerRootView` from `react-native-gesture-handler` and `BottomSheetModalProvider` from `@gorhom/bottom-sheet`. Without these, the dialog will silently fail to render.

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { BloomThemeProvider } from '@oxyhq/bloom/theme';

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BloomThemeProvider mode="system" colorPreset="oxy">
        <BottomSheetModalProvider>
          <App />
        </BottomSheetModalProvider>
      </BloomThemeProvider>
    </GestureHandlerRootView>
  );
}
```

Basic usage:

```tsx
import * as Dialog from '@oxyhq/bloom/dialog';

function MyComponent() {
  const control = Dialog.useDialogControl();

  return (
    <>
      <Button onPress={() => control.open()}>Open</Button>

      <Dialog.Outer control={control} onClose={() => console.log('closed')}>
        <Dialog.Handle />
        <Dialog.Inner label="My Dialog">
          <Text>Dialog content</Text>
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  );
}
```

`Dialog.Outer` props:

- `control` — from `useDialogControl()`.
- `onClose?` — fires after the dialog has finished closing.
- `testID?`
- `webOptions?: { alignCenter?: boolean }` — center the dialog vertically on web instead of anchoring near the top.
- `preventExpansion?: boolean` — on native, snaps the bottom sheet to a fixed `'40%'` height instead of dynamic sizing.

On native, the sheet uses `enablePanDownToClose`, `enableDismissOnClose`, dynamic sizing, and is constrained to a max width of 500px on tablets.

On web, inject the CSS animations into your global styles once:

```tsx
import { BLOOM_DIALOG_CSS } from '@oxyhq/bloom/dialog';

// In your HTML head or global CSS file:
<style>{BLOOM_DIALOG_CSS}</style>
```

### Prompt

Confirmation dialogs built on top of `Dialog`. On native, constrained to a 40% bottom sheet (Gorhom); on web, a centered 320px modal. Same provider requirements as [Dialog](#dialog).

`Prompt.Action` auto-closes the dialog after `onPress` by default. Pass `shouldCloseOnPress={false}` to keep it open (e.g. while an async operation is in flight).

`Prompt.Basic` — one-shot confirm dialog:

```tsx
import * as Prompt from '@oxyhq/bloom/prompt';

function DeleteButton() {
  const control = Prompt.usePromptControl();

  return (
    <>
      <Button onPress={() => control.open()}>Delete</Button>

      <Prompt.Basic
        control={control}
        title="Delete item?"
        description="This action cannot be undone."
        confirmButtonCta="Delete"
        confirmButtonColor="negative"
        onConfirm={() => handleDelete()}
      />
    </>
  );
}
```

`Prompt.Basic` props:

- `control` — from `usePromptControl()`.
- `title: string`
- `description?: string`
- `confirmButtonCta?: string` — defaults to `'Confirm'`.
- `cancelButtonCta?: string` — defaults to `'Cancel'`.
- `confirmButtonColor?: ActionColor` — defaults to `'primary'`.
- `onConfirm: (e) => void`
- `showCancel?: boolean` — defaults to `true`.

Or compose with the compound components:

```tsx
<Prompt.Outer control={control}>
  <Prompt.Content>
    <Prompt.TitleText>Are you sure?</Prompt.TitleText>
    <Prompt.DescriptionText>This is permanent.</Prompt.DescriptionText>
  </Prompt.Content>
  <Prompt.Actions>
    <Prompt.Action cta="Confirm" color="negative" onPress={handleConfirm} />
    <Prompt.Cancel />
  </Prompt.Actions>
</Prompt.Outer>
```

Exports: `usePromptControl`, `Outer`, `Content`, `TitleText`, `DescriptionText`, `Actions`, `Action`, `Cancel`, `Basic`.

`ActionColor`: `'primary' | 'primary_subtle' | 'secondary' | 'negative' | 'negative_subtle'`.

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
- `backgroundComponent?` — custom background renderer.
- `backdropComponent?` — custom backdrop renderer.
- `style?`

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
import * as Dialog from '@oxyhq/bloom/dialog';
import * as Prompt from '@oxyhq/bloom/prompt';
import { BottomSheet, type BottomSheetRef } from '@oxyhq/bloom/bottom-sheet';
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
npm install
npm run build        # react-native-builder-bob
npm run typescript   # type-check
npm run clean        # remove lib/
```

## License

MIT
