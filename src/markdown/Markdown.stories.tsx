import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { Markdown } from './index';

const meta: Meta<typeof Markdown> = {
  title: 'Blocks/Markdown',
  component: Markdown,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    streaming: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Markdown>;

const SAMPLE = `# Release notes

Bloom now has a **Markdown** renderer. It reads *emphasis*, ~~strikethrough~~, \`inline code\` and [links](https://oxy.so).

## What changed

1. Headings, paragraphs and quotes
2. Lists that nest
   - with a hanging indent
   - and a second level
3. Fenced code, drawn by \`CodeBlock\`

- [x] Parser
- [x] Streaming
- [ ] Your feedback

> Raw HTML such as <b>this</b> is shown as text.

| Block | Reads |
| :--- | ---: |
| heading | \`#\` |
| quote | \`>\` |

---

\`\`\`ts
export function greet(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`
`;

function Frame({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 24, maxWidth: 640, backgroundColor: colors.background }}>
      {children}
    </View>
  );
}

export const Playground: Story = {
  args: { size: 'md', children: SAMPLE },
  render: (args) => (
    <Frame>
      <Markdown {...args} />
    </Frame>
  ),
};

/** Both ramps side by side. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <Markdown size="sm">{SAMPLE}</Markdown>
      <View style={{ height: 32 }} />
      <Markdown size="md">{SAMPLE}</Markdown>
    </Frame>
  ),
};

/** The text arrives a few characters at a time; nothing flickers back to raw markers. */
export const Streaming: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [length, setLength] = useState(0);
    useEffect(() => {
      if (length >= SAMPLE.length) return;
      const timer = setTimeout(() => setLength((n) => n + 3), 40);
      return () => clearTimeout(timer);
    }, [length]);
    return (
      <Frame>
        <Markdown streaming={length < SAMPLE.length}>{SAMPLE.slice(0, length)}</Markdown>
      </Frame>
    );
  },
};
