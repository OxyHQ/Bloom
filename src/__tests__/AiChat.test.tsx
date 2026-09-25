import React from 'react';
import * as Native from 'react-native';
import { Text, View, StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    ...actual,
    __esModule: true,
    useFrameCallback: () => ({ setActive: jest.fn(), isActive: false, callbackId: 0 }),
  };
});

import {
  AiChatAssistantMessage,
  AiChatBullet,
  AiChatBulletList,
  AiChatCodePanel,
  AiChatContainer,
  AiChatFeedbackRow,
  AiChatGalleryPanel,
  AiChatImageGeneration,
  AiChatLinkChip,
  AiChatMessageLine,
  AiChatMobileHeader,
  AiChatResizeHandle,
  AiChatShell,
  AiChatStrong,
  AiChatThread,
  AiChatUserMessage,
  useAiChatShell,
} from '../ai-chat';
import type { AiChatGeneration } from '../ai-chat';
import { distributeGenerations } from '../ai-chat/AiChatGalleryPanelBase';
import { AI_CHAT_WEB_CSS, resolveAiChatPalette } from '../ai-chat/shared';
import { SwapGlyph } from '../ai-chat/AiChatControls';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { DISABLED_OPACITY } from '../styles/tokens';
import { RiPencilLine } from '../icons/remix/RiPencilLine';
import { RiRefreshLine } from '../icons/remix/RiRefreshLine';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';
import { resolvedStyle } from './support/rendered-style';
import { buildTheme } from '../theme/build-theme';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { pressHost } from './support/press-host';

function renderIn(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(<BloomThemeProvider mode={mode}>{ui}</BloomThemeProvider>);
}

const WALL: AiChatGeneration[] = [
  { id: 'tall', prompt: 'A tall one', aspectRatio: 0.5 },
  { id: 'square', prompt: 'A square one', aspectRatio: 1 },
  { id: 'wide', prompt: 'A wide one', aspectRatio: 2 },
  { id: 'next', prompt: 'The next one', aspectRatio: 1 },
];

describe('AiChat messages', () => {
  it('renders the user card and a reply built from lines, bullets, a strong run and a link chip', () => {
    const { getByText } = renderIn(
      <>
        <AiChatUserMessage>
          <AiChatMessageLine>
            see <AiChatLinkChip>figma.com/file</AiChatLinkChip> please
          </AiChatMessageLine>
        </AiChatUserMessage>
        <AiChatAssistantMessage>
          <AiChatMessageLine tone="secondary">Worked for 5m</AiChatMessageLine>
          <AiChatBulletList>
            <AiChatBullet>
              <AiChatStrong>New pages</AiChatStrong> are live
            </AiChatBullet>
          </AiChatBulletList>
        </AiChatAssistantMessage>
      </>,
    );
    expect(getByText('figma.com/file')).toBeTruthy();
    expect(getByText('Worked for 5m')).toBeTruthy();
    expect(getByText('New pages')).toBeTruthy();
  });

  it('wraps a bare string turn in a paragraph line', () => {
    const { getByText } = renderIn(<AiChatUserMessage>just text</AiChatUserMessage>);
    expect(getByText('just text')).toBeTruthy();
  });

  it('puts the feedback row under a reply unless `feedback` is off', () => {
    const on = renderIn(<AiChatAssistantMessage>Reply</AiChatAssistantMessage>);
    expect(on.getByLabelText('Good response')).toBeTruthy();
    const off = renderIn(<AiChatAssistantMessage feedback={false}>Reply</AiChatAssistantMessage>);
    expect(off.queryByLabelText('Good response')).toBeNull();
  });
});

describe('AiChatFeedbackRow', () => {
  it('calls each handler from its own button', () => {
    jest.useFakeTimers();
    const onLike = jest.fn();
    const onDislike = jest.fn();
    const onCopy = jest.fn();
    const { getByLabelText } = renderIn(
      <AiChatFeedbackRow onLike={onLike} onDislike={onDislike} onCopy={onCopy} />,
    );
    pressHost(getByLabelText('Good response'));
    pressHost(getByLabelText('Bad response'));
    pressHost(getByLabelText('Copy response'));
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(onDislike).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
    // The confirmation resets itself without a second press.
    act(() => {
      jest.advanceTimersByTime(1700);
    });
    pressHost(getByLabelText('Copy response'));
    expect(onCopy).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});

describe('AiChatFeedbackRow copy confirmation', () => {
  // The check glyph's swap is the confirmation (the native tooltip needs a
  // measured anchor jest never gives it, so its "Copied!" never mounts here).
  const copied = (utils: ReturnType<typeof renderIn>) =>
    utils.UNSAFE_getAllByType(SwapGlyph).some((glyph) => glyph.props.shown && glyph.findAllByType(RiCheckLine).length > 0);

  afterEach(() => {
    jest.useRealTimers();
  });

  it('confirms a sync copy at once, as before', () => {
    const utils = renderIn(<AiChatFeedbackRow onCopy={() => {}} />);
    expect(copied(utils)).toBe(false);
    pressHost(utils.getByLabelText('Copy response'));
    expect(copied(utils)).toBe(true);
  });

  it('does not confirm a copy that returned false or threw', () => {
    const refused = renderIn(<AiChatFeedbackRow onCopy={() => false} />);
    pressHost(refused.getByLabelText('Copy response'));
    expect(copied(refused)).toBe(false);
    const threw = renderIn(
      <AiChatFeedbackRow
        onCopy={() => {
          throw new Error('denied');
        }}
      />,
    );
    pressHost(threw.getByLabelText('Copy response'));
    expect(copied(threw)).toBe(false);
  });

  it('waits for an async copy, and confirms only when it resolves true or nothing', async () => {
    let settle: (ok: boolean | void) => void = () => {};
    const utils = renderIn(<AiChatFeedbackRow onCopy={() => new Promise<boolean | void>((resolve) => (settle = resolve))} />);
    pressHost(utils.getByLabelText('Copy response'));
    expect(copied(utils)).toBe(false);
    await act(async () => {
      settle(true);
    });
    expect(copied(utils)).toBe(true);
  });

  it('never confirms an async copy that resolves false or rejects', async () => {
    let settle: (ok: boolean) => void = () => {};
    const refused = renderIn(<AiChatFeedbackRow onCopy={() => new Promise<boolean>((resolve) => (settle = resolve))} />);
    pressHost(refused.getByLabelText('Copy response'));
    await act(async () => {
      settle(false);
    });
    expect(copied(refused)).toBe(false);

    let fail: (reason: unknown) => void = () => {};
    const rejected = renderIn(<AiChatFeedbackRow onCopy={() => new Promise<void>((_, reject) => (fail = reject))} />);
    pressHost(rejected.getByLabelText('Copy response'));
    await act(async () => {
      fail(new Error('clipboard blocked'));
    });
    expect(copied(rejected)).toBe(false);
  });
});

describe('turn actions', () => {
  it('draws extra feedback actions after copy and calls each', () => {
    const onSpeak = jest.fn();
    const onRegenerate = jest.fn();
    const { getByLabelText, getByTestId } = renderIn(
      <AiChatAssistantMessage
        testID="reply"
        feedbackProps={{
          actions: [
            { key: 'speak', label: 'Read aloud', icon: RiVolumeUpLine, onPress: onSpeak, active: true },
            { key: 'regenerate', label: 'Regenerate', icon: RiRefreshLine, onPress: onRegenerate },
          ],
        }}>
        Reply
      </AiChatAssistantMessage>,
    );
    pressHost(getByLabelText('Read aloud'));
    pressHost(getByLabelText('Regenerate'));
    expect(onSpeak).toHaveBeenCalledTimes(1);
    expect(onRegenerate).toHaveBeenCalledTimes(1);
    expect(getByTestId('reply-feedback-speak')).toBeTruthy();
    // A toggle carries its state for native; a plain action carries none.
    expect(getByLabelText('Read aloud').props.accessibilityState).toMatchObject({ selected: true });
    expect(getByLabelText('Regenerate').props.accessibilityState).not.toHaveProperty('selected');
  });

  it('a disabled action is announced disabled and ignores presses', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderIn(
      <AiChatFeedbackRow actions={[{ key: 'r', label: 'Regenerate', icon: RiRefreshLine, onPress, disabled: true }]} />,
    );
    const button = getByLabelText('Regenerate');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    // The jest Pressable ignores `disabled`; the prop is what the real ones read.
    expect(button.props.disabled).toBe(true);
    expect(button.props['aria-disabled']).toBe(true);
    expect(resolvedStyle(button.props.style).opacity).toBe(DISABLED_OPACITY);
  });

  it('puts the user turn actions under its card, reachable without hover', () => {
    const onCopy = jest.fn();
    const onEdit = jest.fn();
    const { getByLabelText, getByTestId } = renderIn(
      <AiChatUserMessage
        testID="ask"
        actions={[
          { key: 'copy', label: 'Copy message', icon: RiFileCopyLine, onPress: onCopy },
          { key: 'edit', label: 'Edit message', icon: RiPencilLine, onPress: onEdit },
        ]}>
        hello
      </AiChatUserMessage>,
    );
    // No hover gate in the tree: the row is rendered, visible and named.
    expect(resolvedStyle(getByTestId('ask-actions').props.style).opacity ?? 1).toBe(1);
    pressHost(getByLabelText('Copy message'));
    pressHost(getByLabelText('Edit message'));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders no actions row for a user turn without actions', () => {
    const { queryByTestId } = renderIn(<AiChatUserMessage testID="ask">hello</AiChatUserMessage>);
    expect(queryByTestId('ask-actions')).toBeNull();
  });

  it('hides a user turn actions only behind a pointer, never from focus', () => {
    const css = AI_CHAT_WEB_CSS.replace(/\s+/g, ' ');
    expect(css).toMatch(/@media \(hover: hover\) \{ \[data-bloom-ai-chat-turn\] \[data-bloom-ai-chat-turn-actions\] \{ opacity: 0;/);
    expect(css).toContain('[data-bloom-ai-chat-turn]:focus-within [data-bloom-ai-chat-turn-actions]');
  });
});

describe('AiChatImageGeneration', () => {
  it('counts down, lands after `duration` and fires onGenerated once', () => {
    jest.useFakeTimers();
    const onGenerated = jest.fn();
    const { getAllByLabelText, getByLabelText, queryByText, getByText } = renderIn(
      <AiChatImageGeneration source={{ uri: 'x.png' }} alt="A player" duration={2000} onGenerated={onGenerated} />,
    );
    expect(getAllByLabelText('Generating image').length).toBeGreaterThan(0);
    expect(queryByText('Image generated')).toBeNull();
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    expect(getByText('Image generated')).toBeTruthy();
    expect(getByLabelText('Generated image: A player')).toBeTruthy();
    expect(onGenerated).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('holds while controlled `ready` is false', () => {
    jest.useFakeTimers();
    const { queryByText } = renderIn(<AiChatImageGeneration source={{ uri: 'x.png' }} alt="A player" ready={false} />);
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(queryByText('Image generated')).toBeNull();
    jest.useRealTimers();
  });
});

describe('AiChatCodePanel', () => {
  it('shows the summary, the changed file and every line of the code, and switches to the browser tab', () => {
    const { getByText, getAllByText, queryByText } = renderIn(
      <AiChatCodePanel
        code={'const a = 1;\nconst b = 2;'}
        language="ts"
        changeCount={12}
        additions={156}
        deletions={23}
        changedFiles={[{ path: 'app/button.tsx', additions: 74, status: 'New' }]}
      />,
    );
    expect(getByText('12 Uncomitted changes')).toBeTruthy();
    expect(getByText('+156')).toBeTruthy();
    expect(getByText('New')).toBeTruthy();
    expect(getAllByText('2').length).toBeGreaterThan(0);
    expect(getAllByText('const').length).toBe(2);
    fireEvent.press(getByText('Browser'));
    expect(getByText('Browser preview')).toBeTruthy();
    expect(queryByText('12 Uncomitted changes')).toBeNull();
  });

  it('draws the undo glyph only with `onUndo`, and pressing it undoes', () => {
    const onUndo = jest.fn();
    const without = renderIn(<AiChatCodePanel code="x" changeCount={1} additions={1} />);
    expect(without.queryByLabelText('Undo changes')).toBeNull();
    without.unmount();
    const withUndo = renderIn(<AiChatCodePanel code="x" changeCount={1} additions={1} onUndo={onUndo} />);
    fireEvent.press(withUndo.getByLabelText('Undo changes'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('drops the Browser tab for `browser={null}`, even when asked to show it', () => {
    const { getByText, queryByText } = renderIn(
      <AiChatCodePanel code="const a = 1;" changeCount={1} tab="browser" browser={null} actions={[]} />,
    );
    expect(queryByText('Browser')).toBeNull();
    expect(queryByText('Browser preview')).toBeNull();
    expect(getByText('Changes')).toBeTruthy();
    expect(getByText('1 Uncomitted changes')).toBeTruthy();
  });
});

describe('AiChatGalleryPanel', () => {
  it('balances the wall into shortest-first columns with a top-left → bottom-right cascade', () => {
    const columns = distributeGenerations(WALL, 3);
    expect(columns.map((c) => c.map((g) => g.id))).toEqual([['tall'], ['square'], ['wide', 'next']]);
    const order = Object.fromEntries(columns.flat().map((g) => [g.id, g.order]));
    expect(order).toEqual({ tall: 0, square: 1, wide: 2, next: 3 });
  });

  it('pins a generated image first and lifts a pressed tile into the enlarged row', () => {
    const generated: AiChatGeneration[] = [{ id: 'fresh', prompt: 'Fresh', aspectRatio: 1 }];
    const { getAllByLabelText, getByLabelText, queryByLabelText } = renderIn(<AiChatGalleryPanel generations={WALL} generated={generated} />);
    expect(getByLabelText('Enlarge Fresh')).toBeTruthy();
    const tile = getByLabelText('Enlarge A wide one');
    expect(tile.props['aria-expanded']).toBe(false);
    pressHost(tile);
    expect(queryByLabelText('Enlarge A wide one')).toBeNull();
    const minimize = getAllByLabelText('Minimize A wide one');
    // The tile itself and its scrim action.
    expect(minimize).toHaveLength(2);
    expect(minimize[0]!.props['aria-expanded']).toBe(true);
  });

  it('draws a tile\'s download and more actions only with their handlers', () => {
    const without = renderIn(<AiChatGalleryPanel generations={WALL} />);
    expect(without.queryByLabelText('Download A wide one')).toBeNull();
    expect(without.queryByLabelText('More actions for A wide one')).toBeNull();
    without.unmount();
    const onDownload = jest.fn();
    const onMore = jest.fn();
    const withActions = renderIn(<AiChatGalleryPanel generations={WALL} onDownload={onDownload} onMore={onMore} />);
    fireEvent.press(withActions.getByLabelText('Download A wide one'));
    fireEvent.press(withActions.getByLabelText('More actions for A wide one'));
    expect(onDownload).toHaveBeenCalledWith(expect.objectContaining({ id: 'wide' }));
    expect(onMore).toHaveBeenCalledWith(expect.objectContaining({ id: 'wide' }));
  });

  it('drops the Styles tab for `stylePresets={null}`, even when asked to show it', () => {
    const { getByText, queryByText, getByLabelText } = renderIn(
      <AiChatGalleryPanel generations={WALL} tab="styles" stylePresets={null} />,
    );
    expect(queryByText('Styles')).toBeNull();
    expect(queryByText('Style presets')).toBeNull();
    expect(getByText('Gallery')).toBeTruthy();
    expect(getByLabelText('Enlarge A wide one')).toBeTruthy();
  });
});

describe('AiChatContainer', () => {
  it('draws the breadcrumb, the thread, and AgentThinking only while working', () => {
    const { getByText, queryByText, rerender } = renderIn(
      <AiChatContainer project="vibl" title="coding scenario" composer={null}>
        <AiChatThread>
          <AiChatUserMessage>hello</AiChatUserMessage>
        </AiChatThread>
      </AiChatContainer>,
    );
    expect(getByText('vibl')).toBeTruthy();
    expect(getByText('coding scenario')).toBeTruthy();
    expect(queryByText('Thinking')).toBeNull();
    rerender(
      <BloomThemeProvider mode="light">
        <AiChatContainer project="vibl" title="coding scenario" working composer={null}>
          <AiChatThread>
            <AiChatUserMessage>hello</AiChatUserMessage>
          </AiChatThread>
        </AiChatContainer>
      </BloomThemeProvider>,
    );
    expect(getByText('Thinking')).toBeTruthy();
  });
});

describe('AiChatContainer host slots', () => {
  it('draws the title alone when the chat belongs to no project', () => {
    const { getByText, queryByText } = renderIn(
      <AiChatContainer title="coding scenario" composer={null}>
        <AiChatThread>
          <AiChatUserMessage>hello</AiChatUserMessage>
        </AiChatThread>
      </AiChatContainer>,
    );
    expect(getByText('coding scenario')).toBeTruthy();
    expect(queryByText('vibl')).toBeNull();
  });

  it('renders the background layer and drops its own paint on request', () => {
    const plain = renderIn(
      <AiChatContainer testID="chat" title="t" composer={null}>
        <AiChatThread>turns</AiChatThread>
      </AiChatContainer>,
    );
    const surfaceColor = resolvedStyle(plain.getByTestId('chat').props.style).backgroundColor;
    expect(surfaceColor).not.toBe('transparent');

    const painted = renderIn(
      <AiChatContainer testID="chat" title="t" composer={null} background={<Text>wallpaper</Text>}>
        <AiChatThread>turns</AiChatThread>
      </AiChatContainer>,
    );
    // The layer is a slot, not an escape hatch: the surface is still painted.
    expect(painted.getByText('wallpaper')).toBeTruthy();
    expect(resolvedStyle(painted.getByTestId('chat').props.style).backgroundColor).toBe(surfaceColor);

    const bare = renderIn(
      <AiChatContainer testID="chat" title="t" composer={null} surface={false}>
        <AiChatThread>turns</AiChatThread>
      </AiChatContainer>,
    );
    expect(resolvedStyle(bare.getByTestId('chat').props.style).backgroundColor).toBe('transparent');
  });
});

describe('AiChatShell', () => {
  it('shows the mobile header below xl and opens the panel drawer from it', () => {
    const { getByLabelText, getByText } = renderIn(
      <AiChatShell sidebar={null} panel={() => null} panelLabel="Code">
        <AiChatMobileHeader title="Agentic chat" />
      </AiChatShell>,
    );
    // The test renderer's window is 750 wide: compact, and the sidebar is a drawer.
    expect(getByText('Agentic chat')).toBeTruthy();
    const open = getByLabelText('Open code');
    fireEvent.press(open);
    expect(getByText('Code')).toBeTruthy();
  });

  it('names the resize separator', () => {
    const { getByLabelText } = renderIn(<AiChatResizeHandle onResize={() => {}} />);
    expect(getByLabelText('Resize panels').props.role).toBe('separator');
  });

  it('narrows the in-flow sidebar to a rail, and takes a width', () => {
    // The test renderer's window is 750 wide — below `lg`, where the sidebar is
    // a drawer — so the in-flow column is asserted through the collapsed state
    // the shell publishes instead.
    const seen: Array<{ collapsed: boolean; presented: boolean }> = [];
    function Probe() {
      const shell = useAiChatShell();
      seen.push({ collapsed: !!shell?.sidebarCollapsed, presented: !!shell?.navPresented });
      return null;
    }
    renderIn(
      <AiChatShell sidebar={null} sidebarCollapsed collapsedSidebarWidth={56}>
        <Probe />
      </AiChatShell>,
    );
    expect(seen[0]).toEqual({ collapsed: true, presented: false });
  });

  it('reports the nav as presented only while the drawer is open', () => {
    let openNav = () => {};
    const seen: boolean[] = [];
    function Probe() {
      const shell = useAiChatShell();
      seen.push(!!shell?.navPresented);
      if (shell) openNav = shell.openNav;
      return null;
    }
    renderIn(
      <AiChatShell sidebar={null} mobileSidebar={<AiChatMobileHeader title="nav" />}>
        <Probe />
      </AiChatShell>,
    );
    expect(seen[seen.length - 1]).toBe(false);
    act(() => openNav());
    expect(seen[seen.length - 1]).toBe(true);
  });

  it('renders nothing for the mobile header outside a shell', () => {
    const { queryByText } = renderIn(<AiChatMobileHeader title="Alone" />);
    expect(queryByText('Alone')).toBeNull();
  });
});

describe('palette', () => {
  it('resolves distinct surfaces in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = buildTheme('blue', mode);
      const p = resolveAiChatPalette(theme);
      expect(new Set([p.full, p.secondary, p.tertiary]).size).toBe(3);
      expect(p).toMatchObject({
        full: theme.colors.background,
        primary: theme.colors.card,
        secondary: theme.colors.backgroundSecondary,
        tertiary: theme.colors.backgroundTertiary,
        textSecondary: theme.colors.textSecondary,
        linkChipBackground: theme.colors.primarySubtle,
        linkChipText: theme.colors.primarySubtleForeground,
      });
    }
  });
});


describe('AiChatContainer application header', () => {
  it('supports a header without a duplicate breadcrumb or dead actions', () => {
    const screen = renderIn(<AiChatContainer header={<Text>Application header</Text>} composer={<Text>Compose</Text>}><Text>Thread</Text></AiChatContainer>);
    expect(screen.getByText('Application header')).toBeTruthy();
    expect(screen.queryByLabelText('Chat location')).toBeNull();
    expect(screen.queryByLabelText('Share chat')).toBeNull();
    expect(screen.queryByLabelText('More options')).toBeNull();
    expect(screen.getByText('Thread')).toBeTruthy();
    expect(screen.getByText('Compose')).toBeTruthy();
  });
  it('keeps a supplied breadcrumb and renders only available actions', () => {
    const onMore = jest.fn();
    const screen = renderIn(<AiChatContainer title="A conversation" onMore={onMore}><Text>Thread</Text></AiChatContainer>);
    expect(screen.getByText('A conversation')).toBeTruthy();
    expect(screen.queryByLabelText('Share chat')).toBeNull();
    pressHost(screen.getByLabelText('More options'));
    expect(onMore).toHaveBeenCalledTimes(1);
  });
});

describe('AiChatShell sidebar width ownership', () => {
  it.each([undefined, 72])('lets the sidebar own its collapsed width unless overridden (%s)', (width) => {
    const dimensions = jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    try {
      const { getByTestId } = renderIn(<AiChatShell sidebarCollapsed collapsedSidebarWidth={width} sidebar={<View testID="sized-sidebar" style={{ width: 66 }} />}><Text>Chat</Text></AiChatShell>);
      let column = getByTestId('sized-sidebar').parent;
      while (column && StyleSheet.flatten(column.props.style)?.zIndex !== 10) column = column.parent;
      expect(column).not.toBeNull();
      const style = StyleSheet.flatten(column!.props.style);
      expect(style.width).toBe(width);
      expect(style.overflow).not.toBe('hidden');
    } finally { dimensions.mockRestore(); }
  });
});

describe('AiChatContainer composed actions', () => {
  it('renders custom actions instead of default glyphs without requiring a title', () => {
    const screen = renderIn(<AiChatContainer actions={<Text>Chat menu</Text>} onMore={jest.fn()} onShare={jest.fn()}><Text>Thread</Text></AiChatContainer>);
    expect(screen.getByText('Chat menu')).toBeTruthy();
    expect(screen.queryByLabelText('More options')).toBeNull();
    expect(screen.queryByLabelText('Share chat')).toBeNull();
    expect(screen.queryByLabelText('Chat location')).toBeNull();
  });
});
