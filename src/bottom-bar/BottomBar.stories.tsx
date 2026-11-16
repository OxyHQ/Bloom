import { fn } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { View, TextInput, Text } from 'react-native';
import { useState, Profiler } from 'react';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { Button } from '../button/index.web';
import { CompactComposer } from '../chat-composer/CompactComposer.web';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomBar } from './BottomBar.web';
import { Fab } from '../fab/index.web';
import { AppShell } from '../app-shell';
import { Screen, ScreenScrollView } from '../screen';
import { PageHeader } from '../page-header';
import { List } from '../list';
import * as Icons from '../icons';
const meta: Meta<typeof BottomBar> = {
  id: 'base-bottom-bar',
  title: 'Composition/Navigation/Bottom Bar',
  component: BottomBar,
  args: { value: 'home', actionBehavior: 'hide', actionPlacement: 'auto' },
  argTypes: {
    actionPlacement: { control: 'select', options: ['auto', 'beside', 'above'] },
    value: { control: 'select', options: ['home', 'search'] },
    blur: { control: 'boolean' },
    maxWidth: { control: 'number' },
    actionBehavior: { control: 'select', options: ['hide', 'visible'] },
  },
};
export default meta;
type Story = StoryObj<typeof BottomBar>;
/** A route delegates header, scrolling and bottom placement to the real shell. */
function Demo(props: Partial<React.ComponentProps<typeof BottomBar>>) {
  const [destination, setDestination] = useState('home');
  const [created, setCreated] = useState(0);
  const value = props.onValueChange ? (props.value ?? destination) : destination;
  const title = value === 'search' ? 'Explore' : 'Home';
  return (
    <AppShell scroll="fixed" header={null}>
      <Screen
        testID="bottom-bar-screen"
        header={<PageHeader title={title} onBack={null} />}
        bottomBar={
          <BottomBar
            {...props}
            testID="demo-bottom-bar"
            items={
              props.items ?? [
                { name: 'home', label: 'Home', icon: <Icons.RiHomeLine /> },
                { name: 'search', label: 'Explore', icon: <Icons.RiSearchLine /> },
              ]
            }
            value={value}
            onValueChange={(next) => {
              setDestination(next);
              props.onValueChange?.(next);
            }}
            action={
              <Fab
                icon={Icons.RiAddLine}
                accessibilityLabel="Create"
                onPress={() => setCreated((count) => count + 1)}
              />
            }
          />
        }
      >
        <ScreenScrollView testID="bottom-bar-content">
          <List
            items={[
              ...Array.from({ length: created }, (_, index) => ({
                id: `draft-${index}`,
                title: `Draft ${index + 1}`,
                supporting: 'New item',
              })),
              ...Array.from({ length: 24 }, (_, index) => ({
                id: `${value}-${index}`,
                title:
                  value === 'search'
                    ? `Discover collection ${index + 1}`
                    : `Saved note ${index + 1}`,
                supporting: value === 'search' ? 'Ideas to explore' : 'Your latest notes',
              })),
            ]}
          />
        </ScreenScrollView>
      </Screen>
    </AppShell>
  );
}
export const Default: Story = {
  parameters: {
    layout: 'fullscreen',
    controls: { include: ['value', 'blur', 'maxWidth', 'actionBehavior', 'actionPlacement'] },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <Demo {...args} onValueChange={(value) => updateArgs({ value })} />;
  },
};
export const ActionOnly: Story = {
  parameters: { layout: 'fullscreen', controls: { include: ['blur'] } },
  render: (args) => <Demo {...args} items={[]} />,
};

/** Intrinsic 300px stress specimen used independently of a screen host. */
export const NarrowWithAction: Story = {
  render: function NarrowWithAction(args) {
    const [, updateArgs] = useArgs();
    return (
      <View style={{ width: 300, maxWidth: '100%', height: 240, justifyContent: 'flex-end' }}>
        <BottomBar
          {...args}
          testID="narrow-bottom-bar"
          items={[
            { name: 'home', label: 'Home', icon: <Icons.RiHomeLine /> },
            { name: 'search', label: 'Explore', icon: <Icons.RiSearchLine /> },
            { name: 'saved', label: 'Saved', icon: <Icons.RiBookmarkLine /> },
            { name: 'profile', label: 'Profile', icon: <Icons.RiUserLine /> },
          ]}
          onValueChange={(value) => updateArgs({ value })}
          action={
            <Fab
              icon={Icons.RiAddLine}
              accessibilityLabel="Create"
              onPress={fn().mockName('Create action')}
            />
          }
        />
      </View>
    );
  },
};

/** The optional screen-edge band is separate from the translucent capsule. */
export const WithBlurBand: Story = {
  parameters: { layout: 'fullscreen' },
  args: { blur: true },
  render: (args) => <Demo {...args} />,
};

/** Measurement/commit-count fixture for verify-bottom-bar-dock.mjs, not an app screen. */
function DockedEditorDemo({ deferred = false }: { deferred?: boolean }) {
  const [ready, setReady] = useState(!deferred);
  const progress = useSharedValue(0);
  const target = useSharedValue(0);
  const [value, setValue] = useState('search');
  const [held, setHeld] = useState('');
  const editorHeight = useSharedValue(44);
  const editorStyle = useAnimatedStyle(() => ({ height: editorHeight.value }), [editorHeight]);
  const [compact, setCompact] = useState(false);
  return (
    <View style={{ width: '100%', maxWidth: 560, height: 700, justifyContent: 'flex-end' }}>
      <Button
        testID="dock-toggle"
        onPress={() => {
          target.value = target.value ? 0 : 1;
          progress.value = withTiming(target.value, { duration: 280 });
        }}
      >
        Toggle navigation
      </Button>
      <Button
        testID="dock-height"
        onPress={() => {
          editorHeight.value = withTiming(editorHeight.value < 80 ? 104 : 44, { duration: 280 });
        }}
      >
        Resize editor
      </Button>
      <Button testID="dock-compact" onPress={() => setCompact(!compact)}>
        Compact only
      </Button>
      <Button testID="dock-ready" onPress={() => setReady(!ready)}>
        Load editor
      </Button>
      <Button
        testID="dock-grow-long"
        onPress={() => {
          editorHeight.value = withTiming(300, { duration: 280 });
        }}
      >
        Expand long editor
      </Button>
      <Text testID="dock-long-press">{held}</Text>
      <Profiler
        id="dock"
        onRender={() => {
          const probe = document.querySelector('[data-testid="dock-editor"]');
          if (probe)
            (probe as HTMLElement).dataset.commits = String(
              Number((probe as HTMLElement).dataset.commits ?? 0) + 1,
            );
        }}
      >
        <BottomBar
          navigationVisibility={compact ? 'compact' : 'always'}
          testID="dock-bar"
          items={[
            { name: 'home', label: 'Home', icon: <Icons.RiHomeLine /> },
            { name: 'search', label: 'Explore', icon: <Icons.RiSearchLine /> },
            { name: 'saved', label: 'Saved', icon: <Icons.RiBookmarkLine /> },
            { name: 'profile', label: 'Profile', icon: <Icons.RiUserLine /> },
          ]}
          value={value}
          onValueChange={setValue}
          onValueLongPress={setHeld}
          actionBehavior="dock"
          minimizeProgress={progress}
          action={
            ready ? (
              <Animated.View style={editorStyle}>
                <TextInput
                  testID="dock-editor"
                  accessibilityLabel="Reply"
                  placeholder="Post your reply"
                  style={{
                    height: '100%',
                    borderRadius: 22,
                    borderWidth: 1,
                    paddingHorizontal: 14,
                    width: '100%',
                  }}
                />
              </Animated.View>
            ) : undefined
          }
        />
      </Profiler>
    </View>
  );
}
export const DockedEditor: Story = { render: () => <DockedEditorDemo /> };
export const DeferredDockedEditor: Story = { render: () => <DockedEditorDemo deferred /> };

/** Focus/motion fixture for verify-dock-focus-motion.mjs; the bounded host is intentional. */
function FocusedComposerDemo() {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');
  const progress = useSharedValue(0);
  return (
    <View style={{ height: 700, width: 390, maxWidth: '100%', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button testID="focus-dock-outside">Outside</Button>
        <Button
          testID="focus-dock-fold"
          onPress={() => {
            progress.value = 1;
          }}
        >
          Fold
        </Button>
        <Button
          testID="focus-dock-unfold"
          onPress={() => {
            progress.value = 0;
          }}
        >
          Unfold
        </Button>
      </View>
      <BottomBar
        testID="focus-dock"
        value="home"
        onValueChange={fn().mockName('onValueChange')}
        actionBehavior="dock"
        navigationVisibility={focused ? 'never' : 'always'}
        minimizeProgress={progress}
        horizontalInset={8}
        items={[
          { name: 'home', label: 'Home', icon: <Icons.RiHomeLine /> },
          { name: 'search', label: 'Explore', icon: <Icons.RiSearchLine /> },
        ]}
        action={
          <CompactComposer
            value={text}
            onChangeText={setText}
            maxLength={250}
            onSubmit={fn().mockName('onSubmit')}
            onExpand={fn().mockName('onExpand')}
            onFocusChange={setFocused}
            avatar={<View style={{ width: 32, height: 32 }} />}
            testID="focus-composer"
          />
        }
      />
    </View>
  );
}
export const FocusedComposer: Story = { render: () => <FocusedComposerDemo /> };
