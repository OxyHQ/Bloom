import { useArgs } from 'storybook/preview-api';
import { View, TextInput, Text } from 'react-native';
import { useState, Profiler } from 'react';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { Button } from '../button/index.web';
import { CompactComposer } from '../chat-composer/CompactComposer.web';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomBar } from './BottomBar.web';
import { Fab } from '../fab/index.web';
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
function Demo(props: Partial<React.ComponentProps<typeof BottomBar>>) {
  return (
    <View style={{ height: 220, width: 390, maxWidth: '100%', justifyContent: 'flex-end' }}>
      <BottomBar
        items={[
          { name: 'home', label: 'Home', icon: <Icons.RiHomeLine /> },
          { name: 'search', label: 'Explore', icon: <Icons.RiSearchLine /> },
        ]}
        value="home"
        onValueChange={() => {}}
        action={<Fab icon={Icons.RiAddLine} accessibilityLabel="Create" />}
        {...props}
      />
    </View>
  );
}
export const Default: Story = {
  parameters: {
    controls: { include: ['value', 'blur', 'maxWidth', 'actionBehavior', 'actionPlacement'] },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return <Demo {...args} onValueChange={(value) => updateArgs({ value })} />;
  },
};
export const ActionOnly: Story = {
  parameters: { controls: { include: ['blur'] } },
  render: (args) => <Demo {...args} items={[]} />,
};

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
          action={<Fab icon={Icons.RiAddLine} accessibilityLabel="Create" />}
        />
      </View>
    );
  },
};

/** The optional screen-edge band is separate from the translucent capsule. */
export const WithBlurBand: Story = { args: { blur: true }, render: (args) => <Demo {...args} /> };

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

/** A natural-height action changes while its navigation footprint is released. */
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
        onValueChange={() => {}}
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
            onSubmit={() => {}}
            onExpand={() => {}}
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
