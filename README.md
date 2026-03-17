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

- `@gorhom/bottom-sheet >= 5` (native Dialog)
- `react-native-reanimated >= 3` (native Dialog, Loading `top` variant)
- `react-native-gesture-handler >= 2` (native Dialog)
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

### Dialog

Platform-adaptive dialogs — bottom sheet on native, modal overlay on web.

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

On web, inject the CSS animations into your global styles:

```tsx
import { BLOOM_DIALOG_CSS } from '@oxyhq/bloom/dialog';

// In your HTML head or global CSS file:
<style>{BLOOM_DIALOG_CSS}</style>
```

### Prompt

Confirmation dialogs built on top of Dialog.

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

Or build custom prompts with compound components:

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
