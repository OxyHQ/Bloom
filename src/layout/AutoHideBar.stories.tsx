import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Button } from '../button';
import { RiArrowLeftLine, RiArrowRightLine, RiRefreshLine } from '../icons';
import { Text } from '../typography';
import { AutoHideBar } from './AutoHideBar';
import { ScrollArea } from './ScrollArea';
import { Toolbar } from './Toolbar';

const PARAGRAPHS = Array.from(
  { length: 30 },
  (_, i) =>
    `Paragraph ${i + 1}. Scroll down and the bar steps aside to a strip naming the page; scroll up, press the strip or rest on it to bring the bar back.`,
);

function Demo({ peek = true }: { peek?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const last = useRef(0);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y <= 0) setCollapsed(false);
    else if (Math.abs(y - last.current) > 8) setCollapsed(y > last.current);
    last.current = y;
  };
  return (
    <View
      style={{ width: 640, maxWidth: '100%', height: 420, borderRadius: 10, overflow: 'hidden' }}
    >
      <AutoHideBar
        collapsed={collapsed}
        onReveal={() => setCollapsed(false)}
        peek={peek}
        summary="example.com"
        bar={
          <Toolbar size="sm">
            <Button iconOnly leadingIcon={RiArrowLeftLine} accessibilityLabel="Back" />
            <Button iconOnly leadingIcon={RiArrowRightLine} accessibilityLabel="Forward" />
            <Button iconOnly leadingIcon={RiRefreshLine} accessibilityLabel="Reload" />
            <Text>example.com / A long article</Text>
          </Toolbar>
        }
      >
        <ScrollArea
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          {PARAGRAPHS.map((text) => (
            <Text key={text}>{text}</Text>
          ))}
        </ScrollArea>
      </AutoHideBar>
    </View>
  );
}

const meta = {
  id: 'layout-auto-hide-bar',
  title: 'Composition/Layout/Auto-hide Bar',
  component: Demo,
  args: { peek: true },
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof Demo>;

/** Scrolling down collapses the bar; the body is laid out once and slides. */
export const ScrollToHide: Story = {};

/** Without peek, only a press on the strip brings the bar back. */
export const PressOnly: Story = { args: { peek: false } };
