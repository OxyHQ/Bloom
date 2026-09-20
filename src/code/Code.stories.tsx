import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Code, CodeBlock, CodeLines, Pre } from './index';
import { Text } from '../typography';

const meta: Meta = {
  parameters: { controls: { disable: true } },
  title: 'Base/Code',
};

export default meta;

type Story = StoryObj;

const TOGGLE = `const nextTheme = theme === "dark" ? "light" : "dark";

document.documentElement.classList.toggle(
  "dark",
  nextTheme === "dark",
);
localStorage.setItem("app:theme", nextTheme);`;

const COMPONENT = `import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

// Full screen: floating sidebar, header and KPI cards.
export const metadata: Metadata = {
  title: "Home Dashboard",
  description: "A complete admin dashboard screen with a customers data table and an earnings chart.",
};

const MAX_WIDTH = 1560;

export default function DashboardPage({ wide = true }: { wide?: boolean }) {
  return <DashboardShell className="h-full w-full" maxWidth={wide ? MAX_WIDTH : 1200} />;
}`;

/**
 * `Code` is INLINE monospace — an identifier, a flag, a key inside a sentence.
 * It renders a real `<code>` element on web and a monospace `Text` on native,
 * so a screen reader and a browser's find-in-page both treat it as text rather
 * than as decoration.
 */
export const Inline: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 420, gap: 12 }}>
      <Text>
        Pass <Code>variant="outlined"</Code> to draw the border, and{' '}
        <Code>radius</Code> to pick the rung.
      </Text>
      <Text>
        The token is <Code>--primary</Code>; reference it as <Code>var(--primary)</Code>.
      </Text>
    </View>
  ),
};

/**
 * `CodeBlock` — the code card: language chip, file name, diff counts and a
 * copy button over numbered, highlighted lines that scroll sideways.
 */
export const Block: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 560 }}>
      <CodeBlock code={TOGGLE} language="tsx" filename="theme-toggle.tsx" additions={156} deletions={23} highlight={['nextTheme']} />
    </View>
  ),
};

/** A narrow card: long lines scroll instead of reflowing; `wrap` soft-wraps them instead. */
export const LongLines: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 380, gap: 16 }}>
      <CodeBlock code={COMPONENT} language="tsx" filename="page.tsx" />
      <CodeBlock code={COMPONENT} language="tsx" filename="page.tsx (wrap)" wrap />
    </View>
  ),
};

/** No header content, no chrome above the code. A language the highlighter does not know renders plain. */
export const Plain: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 420, gap: 16 }}>
      <CodeBlock code={`bun add @oxy.so/bloom\nbun run build`} copyable={false} lineNumbers={false} />
      <CodeBlock code={`[package]\nname = "bloom"\nversion = "1.0.0"`} language="toml" filename="Cargo.toml" />
    </View>
  ),
};

/**
 * `Pre` is the card without a header. It keeps its own line breaks and
 * indentation and scrolls horizontally rather than wrapping, because a wrapped
 * command is a command someone will copy wrong.
 */
export const Preformatted: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 420, gap: 16 }}>
      <Pre>{`bun add @oxy.so/bloom
bun run build
bun run test`}</Pre>
      <Pre>{`bunx storybook dev -p 6006 --no-open --quiet # one very long line that should not wrap`}</Pre>
      <Pre language="ts" lineNumbers>{`export const answer: number = 42;`}</Pre>
    </View>
  ),
};

/** `CodeLines` bare, at the panel size (`md`, 13/23), soft-wrapping. */
export const Lines: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 400 }}>
      <CodeLines code={COMPONENT} language="tsx" size="md" wrap />
    </View>
  ),
};
