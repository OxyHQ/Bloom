import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { Text } from '../typography';
import { ScrollArea } from './ScrollArea';
import type { ScrollAreaScrollbar } from './types';

const meta: Meta<typeof ScrollArea> = {
  title: 'Base/Scroll Area',
  component: ScrollArea,
  args: { scrollbar: 'scroll', size: 'sm' },
  argTypes: {
    scrollbar: { control: 'inline-radio', options: ['scroll', 'hover', 'always', 'never'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
};
export default meta;

type Story = StoryObj<typeof ScrollArea>;

const LINES = Array.from(
  { length: 40 },
  (_, i) => `Line ${i + 1}: the bar floats over this text, and the text never moves for it.`,
);

/** The content keeps its full width whether the bar is shown or not. */
export const Default: Story = {
  render: (args) => (
    <ScrollArea {...args} style={{ height: 260, width: 360 }} contentContainerClassName="gap-2 p-4">
      {LINES.map((line) => (
        <Text key={line} variant="body-regular">
          {line}
        </Text>
      ))}
    </ScrollArea>
  ),
};

/** `scroll` shows it while scrolling, `hover` over the area, `always` whenever it can scroll. */
export const Modes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, padding: 16 }}>
      {(['scroll', 'hover', 'always', 'never'] as ScrollAreaScrollbar[]).map((mode) => (
        <View key={mode} style={{ gap: 8 }}>
          <Text variant="body-2-medium">{mode}</Text>
          <ScrollArea
            scrollbar={mode}
            style={{ height: 200, width: 200 }}
            contentContainerClassName="gap-2 p-3"
          >
            {LINES.slice(0, 20).map((line) => (
              <Text key={line} variant="body-2-regular">
                {line}
              </Text>
            ))}
          </ScrollArea>
        </View>
      ))}
    </View>
  ),
};

export const Horizontal: Story = {
  render: (args) => (
    <ScrollArea {...args} horizontal style={{ height: 120, width: 360 }}>
      <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
        {Array.from({ length: 14 }, (_, i) => (
          <View
            key={i}
            style={{ width: 96, height: 72, borderRadius: 16, backgroundColor: '#8885' }}
          />
        ))}
      </View>
    </ScrollArea>
  ),
};

export const Sizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, padding: 16 }}>
      {(['sm', 'md'] as const).map((size) => (
        <ScrollArea
          key={size}
          size={size}
          scrollbar="always"
          style={{ height: 200, width: 220 }}
          contentContainerClassName="gap-2 p-3"
        >
          {LINES.slice(0, 20).map((line) => (
            <Text key={line} variant="body-2-regular">
              {size}: {line}
            </Text>
          ))}
        </ScrollArea>
      ))}
    </View>
  ),
};
