import React from 'react';
import { Text } from 'react-native';
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
import { resolveAiChatPalette } from '../ai-chat/shared';
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
      const p = resolveAiChatPalette(buildTheme('blue', mode));
      expect(new Set([p.full, p.secondary, p.tertiary]).size).toBe(3);
      // The card is the page in light mode and a lifted surface in dark.
      expect(p.primary === p.full).toBe(mode === 'light');
    }
  });
});
