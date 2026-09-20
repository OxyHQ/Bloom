import React from 'react';
import { Text as RNText } from 'react-native';
import { act, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { TaskList } from '../task-list';
import type { TaskListTask } from '../task-list';
import { resolveTaskListPalette } from '../task-list/TaskList';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

jest.mock('../styles/adopt-style-sheet', () => ({ adoptStyleSheet: jest.fn(), dropStyleSheet: jest.fn() }));

const TASKS: TaskListTask[] = [
  {
    title: 'Found project files',
    runningTitle: 'Finding project files',
    steps: [
      { label: 'Scanning 52 files' },
      { label: 'Reading', chips: [{ label: 'package.json' }, { label: 'tsconfig.json', icon: <RNText>i</RNText> }] },
    ],
  },
  { title: 'Checks passed', runningTitle: 'Running checks', steps: [{ label: 'Type checking' }] },
];
// Units: task 0 = 0 (header), 1, 2; task 1 = 3 (header), 4. Rows = 5.

function renderList(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const hidden = { includeHiddenElements: true } as const;

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

/** The visible (entering) title of a task header. */
function titleOf(header: ReactTestInstance): string {
  const texts = header.findAll(
    (node) =>
      typeof node.type === 'string' &&
      String(node.type) === 'Text' &&
      typeof node.props.children === 'string' &&
      node.parent?.props['aria-hidden'] !== true,
  );
  return texts.map((node) => node.props.children as string).join('|');
}

describe('TaskList', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses canonical roles in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = buildTheme('teal', mode);
      expect(resolveTaskListPalette(theme)).toMatchObject({
        textSecondary: theme.colors.textSecondary,
        iconTertiary: theme.colors.textTertiary,
        chipSurface: theme.colors.backgroundSecondary,
        chipSurfaceHover: theme.colors.backgroundTertiary,
        chipBorder: theme.colors.borderLight,
        chipBorderHover: theme.colors.border,
      });
    }
  });

  it('reveals a header a tick ahead of its steps, and swaps the running title once they land', () => {
    jest.useFakeTimers();
    const onComplete = jest.fn();
    const { getByTestId, queryByTestId } = renderList(
      <TaskList testID="tl" tasks={TASKS} onComplete={onComplete} reduce />,
    );
    advance(320);
    expect(titleOf(getByTestId('tl-task-0-header', hidden))).toBe('Finding project files');
    expect(queryByTestId('tl-task-0-step-0')).toBeNull();
    expect(getByTestId('tl-working', hidden)).toBeTruthy();
    advance(850);
    expect(getByTestId('tl-task-0-step-0', hidden)).toBeTruthy();
    advance(850);
    expect(getByTestId('tl-task-0-step-1', hidden)).toBeTruthy();
    expect(titleOf(getByTestId('tl-task-0-header', hidden))).toBe('Found project files');
    advance(850);
    expect(titleOf(getByTestId('tl-task-1-header', hidden))).toBe('Running checks');
    advance(850);
    advance(849);
    expect(onComplete).not.toHaveBeenCalled();
    advance(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(titleOf(getByTestId('tl-task-1-header', hidden))).toBe('Checks passed');
    expect(queryByTestId('tl-working')).toBeNull();
  });

  it('ends the guide on the last REVEALED step, not the last in the data', () => {
    const trunks = (root: ReactTestInstance) =>
      root.findAll((node) => typeof node.type === 'string' && node.props.testID === 'agent-log-row-trunk').length;
    const { getByTestId, rerender } = renderList(<TaskList testID="tl" tasks={TASKS} revealed={2} reduce />);
    // One step shown: it is the last, so no trunk below its corner.
    expect(trunks(getByTestId('tl-task-0', hidden))).toBe(0);
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <TaskList testID="tl" tasks={TASKS} revealed={3} reduce />
      </BloomThemeProvider>,
    );
    expect(trunks(getByTestId('tl-task-0', hidden))).toBe(1);
  });

  it('collapseOnComplete: true closes each task as it lands, "all" waits for the whole log', () => {
    const expanded = (root: ReturnType<typeof renderList>, index: number) =>
      root.getByTestId(`tl-task-${index}-header`, hidden).props['aria-expanded'];
    const each = renderList(<TaskList testID="tl" tasks={TASKS} revealed={4} collapseOnComplete reduce />);
    expect(expanded(each, 0)).toBe(false);
    expect(expanded(each, 1)).toBe(true);
    each.unmount();

    const all = renderList(<TaskList testID="tl" tasks={TASKS} revealed={4} collapseOnComplete="all" reduce />);
    expect(expanded(all, 0)).toBe(true);
    all.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <TaskList testID="tl" tasks={TASKS} revealed={5} collapseOnComplete="all" reduce />
      </BloomThemeProvider>,
    );
    expect(expanded(all, 0)).toBe(false);
    expect(expanded(all, 1)).toBe(false);
  });

  it('a press overrides collapseOnComplete from then on', () => {
    const { getByTestId } = renderList(
      <TaskList testID="tl" tasks={TASKS} revealed={5} collapseOnComplete reduce />,
    );
    const header = getByTestId('tl-task-0-header', hidden);
    expect(header.props['aria-expanded']).toBe(false);
    expect(header.props.accessibilityState).toEqual({ expanded: false });
    pressHost(header);
    expect(getByTestId('tl-task-0-header', hidden).props['aria-expanded']).toBe(true);
    pressHost(getByTestId('tl-task-0-header', hidden));
    expect(getByTestId('tl-task-0-header', hidden).props['aria-expanded']).toBe(false);
  });

  it('keeps the header and chip geometry, borders by longhand', () => {
    const { getByTestId } = renderList(<TaskList testID="tl" tasks={TASKS} revealed={5} reduce />);
    const header = resolvedStyle(getByTestId('tl-task-0-header', hidden).props.style);
    expect(header).toMatchObject({ gap: 8, borderRadius: 6, paddingTop: 2, paddingBottom: 2 });

    const chips = getByTestId('tl-task-0-step-1', hidden).findAll(
      (node) => typeof node.type === 'string' && resolvedStyle(node.props.style).borderRadius === 6,
    );
    expect(chips).toHaveLength(2);
    const plain = resolvedStyle(chips[0]!.props.style);
    expect(plain).toMatchObject({
      marginLeft: 3,
      marginRight: 2,
      paddingTop: 2,
      paddingBottom: 2,
      paddingRight: 6,
      paddingLeft: 6,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      gap: 4,
      transform: [{ translateY: -1 }],
    });
    expect(plain.borderWidth).toBeUndefined();
    expect(plain.padding).toBeUndefined();
    // A chip with an icon tucks its left padding to 4.
    expect(resolvedStyle(chips[1]!.props.style).paddingLeft).toBe(4);
  });

  it('the tasks sit 5px apart and the steps list is indented 8, 2 below the header', () => {
    const { getByTestId } = renderList(<TaskList testID="tl" tasks={TASKS} revealed={5} reduce />);
    expect(resolvedStyle(getByTestId('tl', hidden).props.style).gap).toBe(5);
    const list = getByTestId('tl-task-0', hidden).findAll(
      (node) => typeof node.type === 'string' && node.props.role === 'list',
    )[0]!;
    expect(resolvedStyle(list.props.style)).toMatchObject({ marginTop: 2, marginLeft: 8 });
    expect(list.props['aria-live']).toBe('polite');
  });

  it('working={false} drops the indicator; a label replaces it', () => {
    const quiet = renderList(<TaskList testID="tl" tasks={TASKS} revealed={2} working={false} reduce />);
    expect(quiet.queryByTestId('tl-working')).toBeNull();
    quiet.unmount();
    const labelled = renderList(<TaskList testID="tl" tasks={TASKS} revealed={2} working="Planning" reduce />);
    expect(labelled.getByText('Planning', hidden)).toBeTruthy();
  });
});
