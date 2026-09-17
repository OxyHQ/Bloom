import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { RiCodeSLine, RiFileCodeLine, RiFolder3Line, RiTerminalBoxLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { TaskList } from './index';
import type { TaskListTask } from './types';

const meta: Meta<typeof TaskList> = {
  title: 'Blocks/Task List',
  component: TaskList,
};

export default meta;

type Story = StoryObj<typeof TaskList>;

/** Paints the theme background, so the dark globals read as a dark page. */
function Frame({ children, testID }: { children: React.ReactNode; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ padding: 40, width: 560, gap: 40, backgroundColor: colors.background }}>
      {children}
    </View>
  );
}

/** A file-type glyph for a chip, in icon-secondary. */
function FileGlyph() {
  const fill = resolveButtonRamps(useTheme()).neutral[500];
  return <RiFileCodeLine width={14} height={14} fill={fill} />;
}

/** Demo data: a coding agent migrating components. */
const TASKS: TaskListTask[] = [
  {
    title: 'Found project files',
    runningTitle: 'Finding project files',
    icon: RiFolder3Line,
    steps: [
      { label: 'Scanning 52 files' },
      { label: 'Reading', chips: [{ label: 'package.json' }, { label: 'tsconfig.json', icon: <FileGlyph /> }] },
    ],
  },
  {
    title: 'Updated components',
    runningTitle: 'Updating components',
    icon: RiCodeSLine,
    steps: [
      { label: 'Migrating Button to resolved tokens' },
      { label: 'Editing', chips: [{ label: 'Button.tsx' }, { label: 'Chip.tsx' }, { label: 'Badge.tsx' }] },
      { label: 'Removed 3 legacy theme imports' },
    ],
  },
  {
    title: 'Checks passed',
    runningTitle: 'Running checks',
    icon: RiTerminalBoxLine,
    steps: [{ label: 'Type checking the workspace' }, { label: 'All 193 suites passed' }],
  },
];

/** Every unit revealed and settled. Press a header to collapse it. */
export const Settled: Story = {
  render: () => (
    <Frame testID="settled">
      <TaskList testID="tl" tasks={TASKS} revealed={99} />
    </Frame>
  ),
};

/** The streaming demo on a fixed pacing: running titles shimmer, then swap to their settled titles. */
export const Streaming: Story = {
  render: function Render() {
    const [run, setRun] = useState(0);
    return (
      <Frame testID="streaming">
        <TaskList key={run} testID="tl" tasks={TASKS} />
        <View style={{ flexDirection: 'row' }}>
          <Button size="small" variant="secondary" onPress={() => setRun((n) => n + 1)}>
            Replay
          </Button>
        </View>
      </Frame>
    );
  },
};

/** Driven by `revealed`: step through units one at a time. */
export const Controlled: Story = {
  render: function Render() {
    const [revealed, setRevealed] = useState(4);
    return (
      <Frame testID="controlled">
        <TaskList testID="tl" tasks={TASKS} revealed={revealed} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button size="small" variant="secondary" onPress={() => setRevealed((n) => Math.max(0, n - 1))}>
            Back
          </Button>
          <Button size="small" variant="secondary" onPress={() => setRevealed((n) => n + 1)}>
            Next unit
          </Button>
        </View>
      </Frame>
    );
  },
};

/** `collapseOnComplete`: `true` tidies each task as it lands, `"all"` closes them together at the end. */
export const CollapseOnComplete: Story = {
  render: function Render() {
    const [run, setRun] = useState(0);
    return (
      <Frame testID="collapse">
        <TaskList key={`each-${run}`} testID="tl-each" tasks={TASKS} stepInterval={450} collapseOnComplete />
        <TaskList key={`all-${run}`} testID="tl-all" tasks={TASKS} stepInterval={450} collapseOnComplete="all" />
        <View style={{ flexDirection: 'row' }}>
          <Button size="small" variant="secondary" onPress={() => setRun((n) => n + 1)}>
            Replay
          </Button>
        </View>
      </Frame>
    );
  },
};

/** Paused (`run={false}`), a custom indicator label, and no indicator at all. */
export const Working: Story = {
  render: function Render() {
    const [run, setRun] = useState(false);
    return (
      <Frame testID="working">
        <TaskList testID="tl-paused" tasks={TASKS} run={run} working="Planning the migration" />
        <TaskList testID="tl-quiet" tasks={TASKS} revealed={3} working={false} />
        <View style={{ flexDirection: 'row' }}>
          <Button size="small" variant="secondary" onPress={() => setRun((r) => !r)}>
            {run ? 'Pause' : 'Run'}
          </Button>
        </View>
      </Frame>
    );
  },
};

/** Reduced motion: every unit lands settled, no shimmer, no swaps. */
export const ReducedMotion: Story = {
  render: () => (
    <Frame testID="reduced">
      <TaskList testID="tl" tasks={TASKS} reduce />
    </Frame>
  ),
};
