import React from 'react';
import { DISABLED_OPACITY } from '../styles/tokens';
import { act, fireEvent, render, within } from '@testing-library/react-native';

// The shared mocks stub neither `useFrameCallback` nor the SVG blur filter the
// native `ComposerLoader` (inside the composer) needs.
jest.mock('react-native-svg', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-svg');
  const R = jest.requireActual('react');
  const stub = (name: string) => {
    const C = R.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      R.createElement(name, { ref, ...props }, props.children as React.ReactNode),
    );
    C.displayName = name;
    return C;
  };
  return { ...actual, __esModule: true, default: actual.Svg, Filter: stub('Filter'), FeGaussianBlur: stub('FeGaussianBlur') };
});
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    ...actual,
    __esModule: true,
    useFrameCallback: () => ({ setActive: jest.fn(), isActive: false, callbackId: 0 }),
  };
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  AgentChat,
  AgentChatActions,
  AgentChatComposer,
  AgentChatHistory,
  AgentChatMessage,
} from '../agent-chat';
import type { AgentChatMessageData, AgentChatThread } from '../agent-chat';
import { formatAgo, relativeTime, resolveAgentChatPalette, shortModel } from '../agent-chat/shared';
import { resolveButtonRamps } from '../button/shared';
import { buildTheme } from '../theme/build-theme';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

function renderIn(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const NOW = Date.now();

const MESSAGES: AgentChatMessageData[] = [
  { id: 'u1', role: 'user', text: 'Write a product update', at: NOW },
  { id: 'a1', role: 'assistant', text: 'First line.\n\nSecond line.\n', at: NOW },
];

const THREADS: AgentChatThread[] = [
  { id: 't1', title: 'Product update', updatedAt: NOW - 2 * 60_000 },
  { id: 't2', title: 'Names', updatedAt: NOW - 34 * 60_000, unread: true },
];

describe('agent-chat formatting', () => {
  it('keeps the relative time ladders', () => {
    expect(formatAgo(NOW - 10_000, NOW)).toBe('just now');
    expect(formatAgo(NOW - 60_000, NOW)).toBe('1 minute ago');
    expect(formatAgo(NOW - 3 * 60_000, NOW)).toBe('3 minutes ago');
    expect(formatAgo(NOW - 2 * 3_600_000, NOW)).toBe('2 hours ago');
    expect(formatAgo(NOW - 3 * 86_400_000, NOW)).toBe('3 days ago');
    expect(relativeTime(NOW - 30_000, NOW)).toBe('now');
    expect(relativeTime(NOW - 34 * 60_000, NOW)).toBe('34m');
    expect(relativeTime(NOW - 5 * 3_600_000, NOW)).toBe('5h');
    expect(relativeTime(NOW - 3 * 86_400_000, NOW)).toBe('3d');
    expect(shortModel('openai/gpt-5-nano')).toBe('gpt-5-nano');
    expect(shortModel('claude')).toBe('claude');
  });

  it('resolves semantic tokens onto the ramps, light and dark', () => {
    const light = buildTheme('teal', 'light');
    const dark = buildTheme('teal', 'dark');
    const nl = resolveButtonRamps(light).neutral;
    const nd = resolveButtonRamps(dark).neutral;
    expect(resolveAgentChatPalette(light)).toMatchObject({
      chatSurface: nl[100],
      rowHover: nl[200],
      card: light.colors.card,
      separator: nl[200],
      textTertiary: nl[400],
    });
    expect(resolveAgentChatPalette(dark)).toMatchObject({
      chatSurface: nd[900],
      rowHover: nd[800],
      card: nd[800],
      separator: nd[800],
      textTertiary: nd[600],
    });
  });
});

describe('AgentChatMessage', () => {
  it('draws the user bubble geometry in longhands', () => {
    const { getByTestId } = renderIn(<AgentChatMessage testID="m" role="user" text="Hi" />);
    const style = resolvedStyle(getByTestId('m').props.style);
    expect(style).toMatchObject({
      alignSelf: 'flex-end',
      maxWidth: '75%',
      borderRadius: 16,
      paddingLeft: 12,
      paddingRight: 12,
      paddingTop: 11,
      paddingBottom: 11,
    });
    expect(style.paddingHorizontal).toBeUndefined();
  });

  it('splits an assistant reply into its non-empty lines', () => {
    const { getByText, queryByText } = renderIn(
      <AgentChatMessage role="assistant" text={'First line.\n\n  \nSecond line.'} />,
    );
    expect(getByText('First line.')).toBeTruthy();
    expect(getByText('Second line.')).toBeTruthy();
    expect(queryByText('')).toBeNull();
  });

  it('renders nothing for an empty message', () => {
    const { queryByTestId } = renderIn(<AgentChatMessage testID="m" role="assistant" text="" />);
    expect(queryByTestId('m')).toBeNull();
  });

  it('copies through the handler and swaps to "Copied"', async () => {
    const onCopy = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText } = renderIn(
      <AgentChatMessage role="assistant" text="Reply" onCopy={onCopy} at={NOW} />,
    );
    await act(async () => {
      pressHost(getByLabelText('Copy message'));
    });
    expect(onCopy).toHaveBeenCalledWith('Reply');
    expect(getByLabelText('Copied')).toBeTruthy();
  });

  it('hides and disables the action row while streaming (native: no hover)', () => {
    const onCopy = jest.fn();
    const { getByLabelText, rerender } = renderIn(
      <AgentChatMessage role="assistant" text="Reply" onCopy={onCopy} streaming />,
    );
    const row = () => getByLabelText('Copy message').parent!.parent!;
    const findRow = () => {
      let node = getByLabelText('Copy message');
      while (node && node.props.pointerEvents === undefined) node = node.parent!;
      return node;
    };
    expect(findRow().props.pointerEvents).toBe('none');
    expect(resolvedStyle(findRow().props.style).opacity).toBe(0);
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentChatMessage role="assistant" text="Reply" onCopy={onCopy} />
      </BloomThemeProvider>,
    );
    expect(findRow().props.pointerEvents).toBe('auto');
    expect(resolvedStyle(findRow().props.style).opacity).toBe(1);
    expect(row()).toBeTruthy();
  });

  it('shows the timestamp in caption-1 text-tertiary', () => {
    const theme = buildTheme('teal', 'light');
    const { getByText } = renderIn(
      <AgentChatMessage role="assistant" text="Reply" at={NOW - 3 * 60_000} onCopy={jest.fn()} />,
    );
    const style = resolvedStyle(getByText('3 minutes ago').props.style);
    expect(style).toMatchObject({ fontSize: 12, lineHeight: 16, marginLeft: 4 });
    expect(style.color).toBe(resolveAgentChatPalette(theme).textTertiary);
  });
});

describe('AgentChatComposer', () => {
  it('is a 52px full pill with 36px controls', () => {
    const { getByTestId, getByLabelText } = renderIn(<AgentChatComposer testID="c" />);
    let pill = getByLabelText('Add attachment');
    while (pill && resolvedStyle(pill.props.style)?.height !== 52) pill = pill.parent!;
    expect(resolvedStyle(pill.props.style)).toMatchObject({ height: 52, padding: 8, gap: 10, borderRadius: 9999 });
    expect(resolvedStyle(getByTestId('c-send').props.style)).toMatchObject({ width: 36, height: 36, opacity: DISABLED_OPACITY });
  });

  it('enables send once there is text, submits it and clears when uncontrolled', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = renderIn(<AgentChatComposer testID="c" onSubmit={onSubmit} />);
    fireEvent.changeText(getByTestId('c-field'), 'Hello');
    expect(resolvedStyle(getByTestId('c-send').props.style).opacity).toBe(1);
    pressHost(getByTestId('c-send'));
    expect(onSubmit).toHaveBeenCalledWith('Hello');
    expect(getByTestId('c-field').props.value).toBe('');
  });

  it('swaps send for stop while busy', () => {
    const onStop = jest.fn();
    const { getByLabelText, queryByTestId } = renderIn(
      <AgentChatComposer testID="c" busy onStop={onStop} />,
    );
    expect(queryByTestId('c-send')).toBeNull();
    pressHost(getByLabelText('Stop generating'));
    expect(onStop).toHaveBeenCalled();
  });

  it('reads the status row: provider, model and message count', () => {
    const { getByText, getByLabelText, rerender } = renderIn(
      <AgentChatComposer model="openai/gpt-5-nano" provider="OpenAI" messageCount={4} />,
    );
    expect(getByText('OpenAI')).toBeTruthy();
    expect(getByText('4 messages')).toBeTruthy();
    expect(getByLabelText('Answering with openai/gpt-5-nano')).toBeTruthy();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentChatComposer />
      </BloomThemeProvider>,
    );
    expect(getByText('Not configured')).toBeTruthy();
    expect(getByText('New chat')).toBeTruthy();
  });
});

describe('AgentChatActions', () => {
  it('shares the transcript and disables both controls with nothing open', async () => {
    const onShare = jest.fn().mockResolvedValue('copied');
    const { getByTestId, getByLabelText, rerender } = renderIn(
      <AgentChatActions testID="a" transcript="You: hi" onShare={onShare} />,
    );
    await act(async () => {
      pressHost(getByTestId('a-share'));
    });
    expect(onShare).toHaveBeenCalledWith('You: hi');
    expect(getByLabelText('Transcript copied')).toBeTruthy();
    expect(resolvedStyle(getByTestId('a-share').props.style)).toMatchObject({ width: 28, height: 28, borderRadius: 9999 });

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentChatActions testID="a" transcript="" disabled />
      </BloomThemeProvider>,
    );
    expect(getByTestId('a-share').props.accessibilityState).toMatchObject({ disabled: true });
    expect(resolvedStyle(getByTestId('a-more').props.style).opacity).toBe(DISABLED_OPACITY);
  });
});

describe('AgentChatHistory', () => {
  it('keeps the rail geometry: 260 wide, radius 24, padding 12, gap 24', () => {
    const { getByTestId } = renderIn(<AgentChatHistory testID="h" threads={THREADS} />);
    expect(resolvedStyle(getByTestId('h').props.style)).toMatchObject({
      width: 260,
      borderRadius: 24,
      padding: 12,
      gap: 24,
    });
  });

  it('lists threads with their age, marks unread and the active row', () => {
    const theme = buildTheme('teal', 'light');
    const palette = resolveAgentChatPalette(theme);
    const onSelect = jest.fn();
    const { getByTestId, getByText, getByLabelText } = renderIn(
      <AgentChatHistory testID="h" threads={THREADS} activeId="t1" onSelect={onSelect} />,
    );
    expect(getByText('2m')).toBeTruthy();
    expect(getByText('34m')).toBeTruthy();
    expect(getByLabelText('Unread, Names')).toBeTruthy();
    expect(resolvedStyle(getByTestId('h-thread-t1').props.style).backgroundColor).toBe(palette.rowHover);
    expect(resolvedStyle(getByTestId('h-thread-t2').props.style).backgroundColor).toBeUndefined();
    expect(resolvedStyle(getByText('Names').props.style).color).toBe(palette.text);
    expect(resolvedStyle(getByText('Product update').props.style).color).toBe(palette.textSecondary);
    pressHost(getByTestId('h-thread-t2-select'));
    expect(onSelect).toHaveBeenCalledWith('t2');
  });

  it('shows the empty line, and disables export with no chats', () => {
    const { getByText, getByTestId } = renderIn(
      <AgentChatHistory testID="h" threads={[]} onExport={jest.fn()} />,
    );
    expect(getByText('Chats you start show up here.')).toBeTruthy();
    expect(getByTestId('h-export').props.accessibilityLabel).toBe('No chats to export');
    expect(getByTestId('h-export').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('draws the footer rule as a top border in separator-border', () => {
    const theme = buildTheme('teal', 'dark');
    const { getByTestId } = renderIn(
      <AgentChatHistory testID="h" threads={THREADS} onExport={jest.fn()} />,
      'dark',
    );
    let footer = getByTestId('h-export');
    while (footer && resolvedStyle(footer.props.style)?.borderTopWidth === undefined) footer = footer.parent!;
    expect(resolvedStyle(footer.props.style)).toMatchObject({
      borderTopWidth: 1,
      borderTopColor: resolveAgentChatPalette(theme).separator,
      paddingTop: 12,
      paddingRight: 4,
    });
  });

  it('renames a thread from its menu: Enter commits the trimmed title', () => {
    const onRename = jest.fn();
    const { getByTestId, getByText } = renderIn(
      <AgentChatHistory testID="h" threads={THREADS} onRename={onRename} />,
    );
    fireEvent.press(getByTestId('h-thread-t1-menu'));
    fireEvent.press(getByText('Rename'));
    const field = getByTestId('h-thread-t1-rename');
    fireEvent.changeText(field, '  Launch notes  ');
    fireEvent(field, 'submitEditing');
    expect(onRename).toHaveBeenCalledWith('t1', 'Launch notes');
    expect(onRename).toHaveBeenCalledTimes(1);
  });
});

describe('AgentChat', () => {
  it('centres the empty state and submits a suggestion', () => {
    const onSubmit = jest.fn();
    const { getByText, getByLabelText } = renderIn(<AgentChat messages={[]} onSubmit={onSubmit} />);
    expect(getByText('What can I help with?')).toBeTruthy();
    pressHost(getByLabelText('Explain what this starter does'));
    expect(onSubmit).toHaveBeenCalledWith('Explain what this starter does');
  });

  it('shows "Thinking" while busy until the reply has text', () => {
    const { getByText, queryByText, rerender } = renderIn(
      <AgentChat messages={[MESSAGES[0]!]} status="submitted" />,
    );
    expect(getByText('Thinking')).toBeTruthy();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentChat messages={MESSAGES} status="streaming" />
      </BloomThemeProvider>,
    );
    expect(queryByText('Thinking')).toBeNull();
  });

  it('reports an error as an alert', () => {
    const { getByText } = renderIn(<AgentChat messages={[MESSAGES[0]!]} status="error" />);
    expect(getByText('Something went wrong. Check the server logs, then try again.').props.role).toBe('alert');
  });

  it('trims the composer text, refuses while busy, and titles the header from the active thread', () => {
    const onSubmit = jest.fn();
    const { getByTestId, rerender } = renderIn(
      <AgentChat testID="chat" messages={MESSAGES} threads={THREADS} activeThreadId="t2" showHistory onSubmit={onSubmit} />,
    );
    expect(within(getByTestId('chat-header')).getByText('Names')).toBeTruthy();
    fireEvent.changeText(getByTestId('chat-composer-field'), '  more please ');
    pressHost(getByTestId('chat-composer-send'));
    expect(onSubmit).toHaveBeenCalledWith('more please');
    expect(getByTestId('chat-composer-field').props.value).toBe('');

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentChat testID="chat" messages={MESSAGES} status="streaming" onSubmit={onSubmit} />
      </BloomThemeProvider>,
    );
    expect(getByTestId('chat-header')).toBeTruthy();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('hides the rail without threads, and disables it mid-stream', () => {
    const { queryByTestId, getByTestId, rerender } = renderIn(
      <AgentChat testID="chat" messages={MESSAGES} />,
    );
    expect(queryByTestId('chat-history')).toBeNull();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentChat testID="chat" messages={MESSAGES} status="streaming" threads={THREADS} showHistory />
      </BloomThemeProvider>,
    );
    expect(getByTestId('chat-history-new').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('replaces the whole card body with `emptyState`', () => {
    const { getByText, queryByTestId } = renderIn(
      <AgentChat testID="chat" messages={[]} emptyState={<></>} />,
    );
    expect(queryByTestId('chat-composer')).toBeNull();
    expect(() => getByText('What can I help with?')).toThrow();
  });
});
