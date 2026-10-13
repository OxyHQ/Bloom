import type React from 'react';
import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiSearchLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { ToolCall, ToolCallList } from './index';

const meta: Meta<typeof ToolCall> = {
  title: 'Blocks/Tool Call',
  component: ToolCall,
};

export default meta;

type Story = StoryObj<typeof ToolCall>;

/** Paints the theme background, so the dark globals read as a dark page. */
function Frame({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 40, width: 520, maxWidth: '100%', backgroundColor: colors.background }}>
      {children}
    </View>
  );
}

export const Statuses: Story = {
  render: () => (
    <Frame>
      <ToolCallList accessibilityLabel="Tool calls">
        <ToolCall
          name="web_search"
          label="Searching the web"
          status="running"
          detail="bloom ui kit release notes"
          icon={RiSearchLine}
        />
        <ToolCall
          name="read_file"
          label="Read file"
          status="done"
          detail="src/index.ts"
          durationMs={420}
        />
        <ToolCall
          name="run_tests"
          label="Run tests"
          status="error"
          error="2 tests failed: ToolCall press, ToolCall expand"
          durationMs={4200}
        />
      </ToolCallList>
    </Frame>
  ),
};

export const Pressable: Story = {
  render: () => {
    const [opened, setOpened] = useState(0);
    return (
      <Frame>
        <ToolCall
          name="web_search"
          label="Searching the web"
          status="done"
          detail={`Opened ${opened} times`}
          durationMs={1840}
          onPress={() => setOpened((n) => n + 1)}
        />
      </Frame>
    );
  },
};

export const Expandable: Story = {
  render: () => {
    const { colors } = useTheme();
    return (
      <Frame>
        <ToolCall
          name="fetch_url"
          label="Fetched page"
          status="done"
          detail="oxy.so"
          defaultExpanded
        >
          <Text style={{ color: colors.textSecondary }}>The inline result body.</Text>
        </ToolCall>
      </Frame>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <Frame>
      <ToolCallList>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <ToolCall key={size} name="read_file" status="done" detail={size} size={size} />
        ))}
      </ToolCallList>
    </Frame>
  ),
};
