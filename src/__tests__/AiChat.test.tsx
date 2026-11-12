import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type React from 'react';
import { useContext } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { BottomBarSlotContext } from '../layout/bottom-bar-slot';
import { ResizeHandle } from '../layout/ResizeHandle';
import { SurfaceLevelProvider, useSurfaceFill } from '../styles/surface-levels';
import * as Native from 'react-native';
import { Text, View } from 'react-native';
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
  AiChatHeader,
  AiChatImageGeneration,
  AiChatLinkChip,
  AiChatMessageLine,
  AiChatMobileHeader,
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
import { resolvedStyle, classNamesOn } from './support/rendered-style';
import { buildTheme } from '../theme/build-theme';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomScope } from '../appearance';
import { TYPE_SCALE } from '../typography';
import { PortalOutlet, PortalProvider } from '../portal';
import { pressHost } from './support/press-host';
import { mockWindowSize } from './support/window-size';

function renderIn(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(<BloomThemeProvider mode={mode}>{ui}</BloomThemeProvider>);
}

/** With an outlet, for a context panel presented as a floating side sheet. */
function renderWithPortal(ui: React.ReactElement) {
  return renderIn(
    <PortalProvider>
      {ui}
      <PortalOutlet />
    </PortalProvider>,
  );
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

  it('keeps authored message block geometry independent from BloomScope', () => {
    const subject = (size?: 'xs' | 'lg') => {
      const content = (
        <>
          <AiChatMessageLine tone="secondary">status</AiChatMessageLine>
          <AiChatBulletList>
            <AiChatBullet>
              <AiChatStrong>Important</AiChatStrong>
            </AiChatBullet>
          </AiChatBulletList>
          <AiChatLinkChip>resource</AiChatLinkChip>
        </>
      );
      return (
        <BloomThemeProvider mode="light">
          {size ? <BloomScope size={size}>{content}</BloomScope> : content}
        </BloomThemeProvider>
      );
    };
    const view = render(subject());
    const geometry = () => {
      const bulletList = view.UNSAFE_root.findAll((node) => {
        const style = resolvedStyle(node.props.style);
        return style.paddingLeft === 21 && style.gap === 8;
      })[0];
      const bullet = view.UNSAFE_root.findAll((node) => {
        const style = resolvedStyle(node.props.style);
        return style.width === 5 && style.height === 5 && style.borderRadius === 2.5;
      })[0];
      if (!bulletList || !bullet) throw new Error('AiChat message list geometry is missing');
      const link = view.getByLabelText('resource');
      const linkGlyph = link.findAll((node) => {
        const style = resolvedStyle(node.props.style);
        return style.width === 16 && style.height === 16;
      })[0];
      if (!linkGlyph) throw new Error('AiChat link glyph geometry is missing');
      return {
        list: resolvedStyle(bulletList.props.style),
        bullet: resolvedStyle(bullet.props.style),
        link: resolvedStyle(link.props.style),
        linkGlyph: resolvedStyle(linkGlyph.props.style),
        message: resolvedStyle(view.getByText('status').props.style),
        strong: resolvedStyle(view.getByText('Important').props.style),
      };
    };
    const initial = geometry();
    expect(initial.list).toMatchObject({ paddingLeft: 21, gap: 8 });
    expect(initial.bullet).toMatchObject({ width: 5, height: 5, borderRadius: 2.5 });
    expect(initial.link).toMatchObject({ paddingLeft: 4, paddingTop: 3, borderRadius: 8 });
    expect(initial.linkGlyph).toMatchObject({ width: 16, height: 16 });
    expect(initial.message).toMatchObject(TYPE_SCALE['body-regular']);
    expect(initial.strong).toMatchObject(TYPE_SCALE['body-medium']);
    view.rerender(subject('xs'));
    expect(geometry()).toEqual(initial);
    view.rerender(subject('lg'));
    expect(geometry()).toEqual(initial);
  });

  it('keeps authored user and assistant turn layouts independent from BloomScope', () => {
    const subject = (size?: 'xs' | 'lg') => {
      const messages = (
        <>
          <AiChatUserMessage testID="turn-user" animate={false}>
            <Text>question</Text>
          </AiChatUserMessage>
          <AiChatAssistantMessage testID="turn-assistant" animate={false} feedback={false}>
            <Text>answer</Text>
          </AiChatAssistantMessage>
        </>
      );
      return (
        <BloomThemeProvider mode="light">
          {size ? <BloomScope size={size}>{messages}</BloomScope> : messages}
        </BloomThemeProvider>
      );
    };
    const view = render(subject());
    const geometry = () => ({
      user: resolvedStyle(view.getByTestId('turn-user').props.style),
      bubble: resolvedStyle(view.getByTestId('turn-user-bubble').props.style),
      assistant: resolvedStyle(view.getByTestId('turn-assistant').props.style),
    });
    const initial = geometry();
    expect(initial.user).toMatchObject({ width: '100%', alignItems: 'flex-end' });
    expect(initial.bubble).toMatchObject({
      maxWidth: '50%',
      borderRadius: 16,
      paddingLeft: 12,
      paddingRight: 12,
      paddingTop: 11,
      paddingBottom: 11,
    });
    expect(initial.assistant).toMatchObject({ width: '100%', flexDirection: 'column', gap: 8 });
    view.rerender(subject('xs'));
    expect(geometry()).toEqual(initial);
    view.rerender(subject('lg'));
    expect(geometry()).toEqual(initial);
  });
});

describe('AiChatFeedbackRow', () => {
  it('keeps its authored action recipe independent from BloomScope', () => {
    const subject = (size?: 'xs' | 'lg') => (
      <BloomThemeProvider>
        {size ? (
          <BloomScope size={size}>
            <AiChatFeedbackRow testID="feedback" onCopy={() => false} />
          </BloomScope>
        ) : (
          <AiChatFeedbackRow testID="feedback" onCopy={() => false} />
        )}
      </BloomThemeProvider>
    );
    const screen = render(subject());
    const geometry = () => {
      const row = resolvedStyle(screen.getByTestId('feedback').props.style);
      const like = screen.getByTestId('feedback-like');
      const action = resolvedStyle(like.props.style);
      const glyph = like.find((node) => node.props.width === 16 && node.props.height === 16);
      return {
        rowGap: row.gap,
        padding: [action.paddingVertical, action.paddingHorizontal],
        glyph: [glyph?.props.width, glyph?.props.height],
      };
    };
    const normal = geometry();
    expect(normal).toEqual({ rowGap: 2, padding: [8, 8], glyph: [16, 16] });
    screen.rerender(subject('xs'));
    expect(geometry()).toEqual(normal);
    screen.rerender(subject('lg'));
    expect(geometry()).toEqual(normal);
  });

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
    utils
      .UNSAFE_getAllByType(SwapGlyph)
      .some((glyph) => glyph.props.shown && glyph.findAllByType(RiCheckLine).length > 0);

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
    const utils = renderIn(
      <AiChatFeedbackRow
        onCopy={() => new Promise<boolean | void>((resolve) => (settle = resolve))}
      />,
    );
    pressHost(utils.getByLabelText('Copy response'));
    expect(copied(utils)).toBe(false);
    await act(async () => {
      settle(true);
    });
    expect(copied(utils)).toBe(true);
  });

  it('never confirms an async copy that resolves false or rejects', async () => {
    let settle: (ok: boolean) => void = () => {};
    const refused = renderIn(
      <AiChatFeedbackRow onCopy={() => new Promise<boolean>((resolve) => (settle = resolve))} />,
    );
    pressHost(refused.getByLabelText('Copy response'));
    await act(async () => {
      settle(false);
    });
    expect(copied(refused)).toBe(false);

    let fail: (reason: unknown) => void = () => {};
    const rejected = renderIn(
      <AiChatFeedbackRow onCopy={() => new Promise<void>((_, reject) => (fail = reject))} />,
    );
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
            {
              key: 'speak',
              label: 'Read aloud',
              icon: RiVolumeUpLine,
              onPress: onSpeak,
              active: true,
            },
            { key: 'regenerate', label: 'Regenerate', icon: RiRefreshLine, onPress: onRegenerate },
          ],
        }}
      >
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
      <AiChatFeedbackRow
        actions={[{ key: 'r', label: 'Regenerate', icon: RiRefreshLine, onPress, disabled: true }]}
      />,
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
        ]}
      >
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

  it('styles the actual user bubble and recalculates its width after column layout', () => {
    const bubbleStyle = jest.fn((width: number) => ({
      maxWidth: Math.max(0, width - 112),
      borderRadius: 24,
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 12,
      paddingBottom: 12,
      marginInlineEnd: 0,
    }));
    const screen = renderIn(
      <AiChatUserMessage testID="ask" animate={false} bubbleStyle={bubbleStyle}>
        hello
      </AiChatUserMessage>,
    );
    fireEvent(screen.getByTestId('ask'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 600, height: 60 } },
    });
    expect(resolvedStyle(screen.getByTestId('ask-bubble').props.style)).toMatchObject({
      maxWidth: 488,
      borderRadius: 24,
      paddingLeft: 16,
      paddingTop: 12,
      marginInlineEnd: 0,
    });
    fireEvent(screen.getByTestId('ask'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 60 } },
    });
    expect(resolvedStyle(screen.getByTestId('ask-bubble').props.style).maxWidth).toBe(278);
  });

  it('renders no actions row for a user turn without actions', () => {
    const { queryByTestId } = renderIn(<AiChatUserMessage testID="ask">hello</AiChatUserMessage>);
    expect(queryByTestId('ask-actions')).toBeNull();
  });

  it('hides a user turn actions only behind a pointer, never from focus', () => {
    const css = AI_CHAT_WEB_CSS.replace(/\s+/g, ' ');
    expect(css).toMatch(
      /@media \(hover: hover\) \{ \[data-bloom-ai-chat-turn\] \[data-bloom-ai-chat-turn-actions\] \{ opacity: 0;/,
    );
    expect(css).toContain(
      '[data-bloom-ai-chat-turn]:focus-within [data-bloom-ai-chat-turn-actions]',
    );
  });
});

describe('AiChatImageGeneration', () => {
  it('keeps its fixed artwork canvas independent from the control-size scope', () => {
    const screen = renderIn(
      <BloomScope size="xs">
        <AiChatImageGeneration
          testID="generation"
          source={{ uri: 'x.png' }}
          alt="A player"
          ready={false}
        />
      </BloomScope>,
    );
    const geometry = () => {
      const canvas = screen.UNSAFE_root.findAll((node) => {
        const style = resolvedStyle(node.props.style);
        return style.width === 200 && style.height === 250;
      });
      return [
        ...new Set(
          canvas.map((node) => {
            const style = resolvedStyle(node.props.style);
            return `${style.width}x${style.height}`;
          }),
        ),
      ];
    };
    expect(geometry()).toContain('200x250');
    const compact = geometry();
    screen.rerender(
      <BloomThemeProvider>
        <BloomScope size="lg">
          <AiChatImageGeneration
            testID="generation"
            source={{ uri: 'x.png' }}
            alt="A player"
            ready={false}
          />
        </BloomScope>
      </BloomThemeProvider>,
    );
    expect(geometry()).toEqual(compact);
  });

  it('counts down, lands after `duration` and fires onGenerated once', () => {
    jest.useFakeTimers();
    const onGenerated = jest.fn();
    const { getAllByLabelText, getByLabelText, queryByText, getByText } = renderIn(
      <AiChatImageGeneration
        source={{ uri: 'x.png' }}
        alt="A player"
        duration={2000}
        onGenerated={onGenerated}
      />,
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
    const { queryByText } = renderIn(
      <AiChatImageGeneration source={{ uri: 'x.png' }} alt="A player" ready={false} />,
    );
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(queryByText('Image generated')).toBeNull();
    jest.useRealTimers();
  });
});

describe('AiChatCodePanel', () => {
  it('keeps panel width and code typography fixed while actions delegate size to Bloom scope', () => {
    const subject = (size?: 'xs' | 'lg') => {
      const panel = (
        <AiChatCodePanel testID="code-panel" code="const x = 1" changeCount={1} browser={null} />
      );
      return (
        <BloomThemeProvider>
          {size ? <BloomScope size={size}>{panel}</BloomScope> : panel}
        </BloomThemeProvider>
      );
    };
    const screen = render(subject());
    const geometry = () => {
      const width = resolvedStyle(screen.getByTestId('code-panel').props.style).width;
      const action = resolvedStyle(screen.getByLabelText('Open terminal').props.style).height;
      const code = resolvedStyle(screen.getByText('const x = 1').props.style);
      return { width, action, code: [code.fontSize, code.lineHeight] };
    };
    expect(geometry()).toEqual({ width: 410, action: 34, code: [13, 23] });
    const normal = geometry();
    screen.rerender(subject('xs'));
    expect(geometry()).toEqual({ ...normal, action: 24 });
    screen.rerender(subject('lg'));
    expect(geometry()).toEqual(normal);
  });

  it('draws its title and tabs in a PageHeader that grows with the system font', () => {
    const { getByLabelText, getByText } = renderIn(
      <AiChatCodePanel code="x" changeCount={1} additions={1} />,
    );
    expect(getByLabelText('Panel view')).toBeTruthy();
    let header = getByText('Code').parent;
    while (header && resolvedStyle(header.props.style).minHeight === undefined)
      header = header.parent;
    if (!header) throw new Error('no PageHeader row');
    expect(resolvedStyle(header.props.style).height).toBeUndefined();
  });

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
    const withUndo = renderIn(
      <AiChatCodePanel code="x" changeCount={1} additions={1} onUndo={onUndo} />,
    );
    fireEvent.press(withUndo.getByLabelText('Undo changes'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('drops the Browser tab for `browser={null}`, even when asked to show it', () => {
    const { getByText, queryByText } = renderIn(
      <AiChatCodePanel
        code="const a = 1;"
        changeCount={1}
        tab="browser"
        browser={null}
        actions={[]}
      />,
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
    expect(columns.map((c) => c.map((g) => g.id))).toEqual([
      ['tall'],
      ['square'],
      ['wide', 'next'],
    ]);
    const order = Object.fromEntries(columns.flat().map((g) => [g.id, g.order]));
    expect(order).toEqual({ tall: 0, square: 1, wide: 2, next: 3 });
  });

  it('pins a generated image first and lifts a pressed tile into the enlarged row', () => {
    const generated: AiChatGeneration[] = [{ id: 'fresh', prompt: 'Fresh', aspectRatio: 1 }];
    const { getAllByLabelText, getByLabelText, queryByLabelText } = renderIn(
      <AiChatGalleryPanel generations={WALL} generated={generated} />,
    );
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

  it("draws a tile's download and more actions only with their handlers", () => {
    const without = renderIn(<AiChatGalleryPanel generations={WALL} />);
    expect(without.queryByLabelText('Download A wide one')).toBeNull();
    expect(without.queryByLabelText('More actions for A wide one')).toBeNull();
    without.unmount();
    const onDownload = jest.fn();
    const onMore = jest.fn();
    const withActions = renderIn(
      <AiChatGalleryPanel generations={WALL} onDownload={onDownload} onMore={onMore} />,
    );
    fireEvent.press(withActions.getByLabelText('Download A wide one'));
    fireEvent.press(withActions.getByLabelText('More actions for A wide one'));
    expect(onDownload).toHaveBeenCalledWith(expect.objectContaining({ id: 'wide' }));
    expect(onMore).toHaveBeenCalledWith(expect.objectContaining({ id: 'wide' }));
  });

  it('drops the Styles tab for `stylePresets={null}`, even when asked to show it', () => {
    const { getAllByText, queryByText, getByLabelText } = renderIn(
      <AiChatGalleryPanel generations={WALL} tab="styles" stylePresets={null} />,
    );
    expect(queryByText('Styles')).toBeNull();
    expect(queryByText('Style presets')).toBeNull();
    // The panel's title and its one remaining tab.
    expect(getAllByText('Gallery')).toHaveLength(2);
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
      <AiChatContainer
        testID="chat"
        title="t"
        composer={null}
        background={
          <View style={{ position: 'absolute', top: -200, height: 2000 }}>
            <Text>wallpaper</Text>
          </View>
        }
      >
        <AiChatThread>turns</AiChatThread>
      </AiChatContainer>,
    );
    // The layer is a slot, not an escape hatch: the surface is still painted.
    expect(painted.getByText('wallpaper')).toBeTruthy();
    expect(resolvedStyle(painted.getByTestId('chat-underlay').props.style)).toMatchObject({
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
    });
    expect(painted.getByTestId('chat-underlay').props.pointerEvents).toBe('none');
    expect(resolvedStyle(painted.getByTestId('chat').props.style).backgroundColor).toBe(
      surfaceColor,
    );

    const bare = renderIn(
      <AiChatContainer testID="chat" title="t" composer={null} surface={false}>
        <AiChatThread>turns</AiChatThread>
      </AiChatContainer>,
    );
    expect(resolvedStyle(bare.getByTestId('chat').props.style).backgroundColor).toBe('transparent');
    // Not a card, so no radius of its own: the host's shape (a sheet, a panel) rounds it.
    expect(resolvedStyle(bare.getByTestId('chat').props.style).borderRadius).toBeUndefined();
    // The containing AppShell panel supplies corners for either surface mode.
    expect(resolvedStyle(painted.getByTestId('chat').props.style).borderRadius).toBeUndefined();
  });
});

describe('AiChatShell', () => {
  it('opens the context panel as a side sheet over the retained conversation', () => {
    // Below `xl` the context panel floats as a side sheet named by `panelLabel`;
    // the conversation stays mounted beneath it rather than being replaced.
    const { getByLabelText, getByText } = renderWithPortal(
      <AiChatShell sidebar={null} panel={() => <Text>Panel body</Text>} panelLabel="Code">
        <AiChatMobileHeader title="Agentic chat" />
      </AiChatShell>,
    );
    expect(getByText('Agentic chat')).toBeTruthy();
    pressHost(getByLabelText('Open code'));
    expect(getByLabelText('Code')).toBeTruthy();
    expect(getByText('Panel body')).toBeTruthy();
    expect(getByText('Agentic chat', { includeHiddenElements: true })).toBeTruthy();
    expect(getByLabelText('Dismiss Code', { includeHiddenElements: true })).toBeTruthy();
  });

  it('lets the panel turn its divider off: the conversation track is resizable only for a resizable panel', () => {
    // The divider is the conversation track's end edge, so the panel's own flag decides it. The
    // layout engine draws it from a measured, wide window, which the native test renderer lacks.
    const source = readFileSync(join(__dirname, '..', 'ai-chat', 'AiChatShell.tsx'), 'utf8');
    expect(source).toMatch(/panelResizable = true/);
    expect(source).toMatch(/resizable: !!panel && panelResizable/);
  });

  it('floats the panel below a breakpoint the host chooses, `xl` by default', () => {
    // Where the panel leaves the row for a dialog is the context track's `floating.below`; the
    // layout engine reads it from a measured, wide window, which the native test renderer lacks.
    const source = readFileSync(join(__dirname, '..', 'ai-chat', 'AiChatShell.tsx'), 'utf8');
    expect(source).toMatch(/panelFloatingBelow = 'xl'/);
    expect(source).toMatch(/below: panelFloatingBelow/);
  });

  it('hands a function sidebar the resolved props, so the shell owns its collapse', () => {
    const seen: Array<{ collapsed?: boolean; onCollapsedChange?: (c: boolean) => void }> = [];
    renderWithPortal(
      <AiChatShell
        sidebar={(props) => {
          seen.push(props);
          return <Text>nav</Text>;
        }}
        panel={() => null}
      >
        <Text>Conversation</Text>
      </AiChatShell>,
    );
    // Whatever the layout draws (the rail or the drawer), the sidebar was asked for with the
    // shell's resolved props, not drawn as a ready-made node.
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[seen.length - 1]).toHaveProperty('variant');
  });

  it("keeps a node sidebar expanded: it cannot take the shell's collapse", () => {
    const source = readFileSync(join(__dirname, '..', 'ai-chat', 'AiChatShell.tsx'), 'utf8');
    expect(source).toMatch(/const ownsCollapse = typeof sidebar === 'function'/);
    expect(source).toMatch(/collapsed: false, collapseDisabled: true/);
  });

  it("centres a header's own title node between the shell's buttons", () => {
    const { getByLabelText, getByText, getByTestId } = renderWithPortal(
      <AiChatShell
        sidebar={null}
        mobileSidebar={<Text>nav</Text>}
        panel={() => null}
        panelLabel="Code"
      >
        <AiChatHeader testID="header">
          <Text>Alia + Sindi</Text>
        </AiChatHeader>
      </AiChatShell>,
    );
    expect(getByText('Alia + Sindi')).toBeTruthy();
    expect(classNamesOn(getByTestId('header-bar').props.style)).toContain('min-h-14 py-2');
    expect(getByLabelText('Open navigation')).toBeTruthy();
    fireEvent.press(getByLabelText('Open code'));
    expect(getByLabelText('Code')).toBeTruthy();
  });

  it('keeps header chrome fixed while shell actions follow their delegated control scale', () => {
    const subject = (size?: 'xs' | 'lg') => {
      const shell = (
        <AiChatShell sidebar={null} mobileSidebar={<Text>nav</Text>} panel={() => null}>
          <AiChatHeader testID="header">
            <Text>Alia</Text>
          </AiChatHeader>
        </AiChatShell>
      );
      return size ? <BloomScope size={size}>{shell}</BloomScope> : shell;
    };
    const screen = renderWithPortal(subject());
    const geometry = () => ({
      header: classNamesOn(screen.getByTestId('header-bar').props.style),
      navigation: resolvedStyle(screen.getByLabelText('Open navigation').props.style).height,
      panel: resolvedStyle(screen.getByLabelText('Open code').props.style).height,
    });
    const normal = geometry();
    expect(normal.header).toContain('min-h-14 py-2');
    expect(normal.navigation).toBe(34);
    expect(normal.panel).toBe(34);
    screen.rerender(
      <BloomThemeProvider>
        <PortalProvider>
          {subject('xs')}
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
    expect(geometry()).toEqual({ ...normal, navigation: 24, panel: 24 });
    screen.rerender(
      <BloomThemeProvider>
        <PortalProvider>
          {subject('lg')}
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
    expect(geometry()).toEqual(normal);
  });

  it('draws a header with its title alone outside a shell', () => {
    const { getByText, queryByLabelText } = renderIn(
      <AiChatHeader>
        <Text>Alia</Text>
      </AiChatHeader>,
    );
    expect(getByText('Alia')).toBeTruthy();
    expect(queryByLabelText('Open navigation')).toBeNull();
  });

  it('lets the conversation PageHeader grow with the system font', () => {
    // The context panel's header is its own (`AiChatCodePanel`, a gallery): the
    // shell no longer draws one around it.
    const { getByTestId } = renderIn(
      <AiChatShell sidebar={null} panel={() => null} panelLabel="Code">
        <AiChatMobileHeader testID="header" title="Agentic chat" />
      </AiChatShell>,
    );
    expect(classNamesOn(getByTestId('header-bar').props.style)).toContain('min-h-14 py-2');
    expect(resolvedStyle(getByTestId('header').props.style).height).toBeUndefined();
  });

  it('names the resize separator', () => {
    const { getByLabelText } = renderIn(<ResizeHandle onResize={() => {}} />);
    expect(getByLabelText('Resize panels').props.role).toBe('separator');
  });

  it('preserves the collapsed sidebar preference in its compatibility context', () => {
    // The context preserves the host preference while AppShell owns track sizing.
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

  it('reports navigation presentation while opening and closing the shared drawer', () => {
    let openNav = () => {};
    let closeNav = () => {};
    const seen: boolean[] = [];
    function Probe() {
      const shell = useAiChatShell();
      seen.push(!!shell?.navPresented);
      if (shell) {
        openNav = shell.openNav;
        closeNav = shell.closeNav;
      }
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
    act(() => closeNav());
    expect(seen[seen.length - 1]).toBe(false);
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
    const screen = renderIn(
      <AiChatContainer header={<Text>Application header</Text>} composer={<Text>Compose</Text>}>
        <Text>Thread</Text>
      </AiChatContainer>,
    );
    expect(screen.getByText('Application header')).toBeTruthy();
    expect(screen.queryByLabelText('Chat location')).toBeNull();
    expect(screen.queryByLabelText('Share chat')).toBeNull();
    expect(screen.queryByLabelText('More options')).toBeNull();
    expect(screen.getByText('Thread')).toBeTruthy();
    expect(screen.getByText('Compose')).toBeTruthy();
  });
  it('keeps a supplied breadcrumb and renders only available actions', () => {
    const onMore = jest.fn();
    const screen = renderIn(
      <AiChatContainer title="A conversation" onMore={onMore}>
        <Text>Thread</Text>
      </AiChatContainer>,
    );
    expect(screen.getByText('A conversation')).toBeTruthy();
    expect(screen.queryByLabelText('Share chat')).toBeNull();
    pressHost(screen.getByLabelText('More options'));
    expect(onMore).toHaveBeenCalledTimes(1);
  });
});

describe('AiChatShell sidebar width ownership', () => {
  it.each([undefined, 72])(
    'uses the shared sidebar region width with an explicit collapsed override (%s)',
    (width) => {
      const dimensions = mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 });
      try {
        const { getByTestId } = renderIn(
          <AiChatShell
            sidebarCollapsed
            collapsedSidebarWidth={width}
            sidebar={<View testID="sized-sidebar" style={{ width: 66 }} />}
          >
            <Text>Chat</Text>
          </AiChatShell>,
        );
        const navigation = getByTestId('ai-chat-shell-navigation');
        const sizedRegions = navigation.findAll(
          (node) =>
            typeof node.type === 'string' &&
            resolvedStyle(node.props.style).width === (width ?? 80),
        );
        // The compatibility adapter's complete sidebar receives the width
        // through the shared slot, without creating a navigation panel.
        expect(sizedRegions).toHaveLength(1);
        expect(resolvedStyle(getByTestId('sized-sidebar').props.style).width).toBe(66);
      } finally {
        dimensions.mockRestore();
      }
    },
  );
});

describe('AiChatShell sidebar surface', () => {
  const surfaceOf = (props?: { sidebarSurface?: 'plain' | 'card' | 'docked' }) => {
    let seen: string | undefined;
    const dimensions = mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 });
    try {
      renderIn(
        <AiChatShell
          {...props}
          sidebar={(shell) => {
            seen = shell.surface;
            return <View />;
          }}
        >
          <Text>Chat</Text>
        </AiChatShell>,
      );
    } finally {
      dimensions.mockRestore();
    }
    return seen;
  };

  it('is plain unless the host declares another, and hands the sidebar the one it lays out by', () => {
    expect(surfaceOf()).toBe('plain');
    expect(surfaceOf({ sidebarSurface: 'card' })).toBe('card');
  });

  it('hands the sidebar the scrollbar edge the host asked for, and none by default', () => {
    const sideOf = (sidebarScrollbarSide?: 'start' | 'end') => {
      let seen: string | undefined = 'unset';
      const dimensions = mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 });
      try {
        renderIn(
          <AiChatShell
            sidebarScrollbarSide={sidebarScrollbarSide}
            sidebar={(shell) => {
              seen = shell.scrollbarSide;
              return <View />;
            }}
          >
            <Text>Chat</Text>
          </AiChatShell>,
        );
      } finally {
        dimensions.mockRestore();
      }
      return seen;
    };
    expect(sideOf()).toBeUndefined();
    expect(sideOf('start')).toBe('start');
  });
});

describe('AiChatContainer composed actions', () => {
  it('renders custom actions instead of default glyphs without requiring a title', () => {
    const screen = renderIn(
      <AiChatContainer actions={<Text>Chat menu</Text>} onMore={jest.fn()} onShare={jest.fn()}>
        <Text>Thread</Text>
      </AiChatContainer>,
    );
    expect(screen.getByText('Chat menu')).toBeTruthy();
    expect(screen.queryByLabelText('More options')).toBeNull();
    expect(screen.queryByLabelText('Share chat')).toBeNull();
    expect(screen.queryByLabelText('Chat location')).toBeNull();
  });
});

describe('AiChatShell safe area ownership', () => {
  const insets = { top: 47, right: 24, bottom: 34, left: 16 };
  const originalOS = Native.Platform.OS;
  afterEach(() => {
    Native.Platform.OS = originalOS;
  });
  function Reader() {
    const original = useContext(SafeAreaInsetsContext);
    const bottom = useContext(BottomBarSlotContext);
    return <Text testID="inset-reader">{JSON.stringify({ original, bottom })}</Text>;
  }
  it.each(['ios', 'android'] as const)(
    'owns native safe-area edges once while preserving descendant insets on %s',
    (os) => {
      Native.Platform.OS = os;
      const tree = renderIn(
        <SafeAreaInsetsContext.Provider value={insets}>
          <AiChatShell
            sidebar={null}
            safeArea
            testID="safe-shell"
            navOpen
            mobileSidebar={<Reader />}
            panelOpen
            panel={() => <Text>Panel</Text>}
          >
            <Text>Conversation</Text>
          </AiChatShell>
        </SafeAreaInsetsContext.Provider>,
      );
      const styles = tree.UNSAFE_getAllByType(View).map((node) => resolvedStyle(node.props.style));
      expect(styles).toContainEqual(
        expect.objectContaining({
          paddingTop: 47,
          paddingRight: 24,
          paddingBottom: 34,
          paddingLeft: 16,
        }),
      );
      expect(tree.getByTestId('inset-reader').props.children).toBe(
        JSON.stringify({ original: insets, bottom: 34 }),
      );
      // The shell owns the device edges ONCE: neither the navigation drawer nor
      // a panel may pad by the top inset a second time.
      expect(styles.filter((style) => style.paddingTop === insets.top)).toHaveLength(1);
    },
  );
  it.each(['ios', 'web'] as const)('preserves default geometry and web behavior on %s', (os) => {
    Native.Platform.OS = os;
    const tree = renderIn(
      <SafeAreaInsetsContext.Provider value={insets}>
        <BottomBarSlotContext.Provider value={9}>
          <AiChatShell sidebar={null} safeArea={os === 'web'} testID="safe-shell">
            <Reader />
          </AiChatShell>
        </BottomBarSlotContext.Provider>
      </SafeAreaInsetsContext.Provider>,
    );
    const shell = tree.getByTestId('safe-shell');
    // Web compositor chrome has a stable outer column; the zero-padding frame
    // lives on its inner row. Both layers must remain free of device insets.
    const styles = [shell, ...shell.findAllByType(View)].map((node) =>
      resolvedStyle(node.props.style),
    );
    expect(styles).toContainEqual(expect.objectContaining({ padding: 0 }));
    expect(styles.some((style) => style.paddingTop === insets.top)).toBe(false);
    expect(styles.some((style) => style.paddingBottom === insets.bottom)).toBe(false);
    expect(tree.getByTestId('inset-reader').props.children).toBe(
      JSON.stringify({ original: insets, bottom: 9 }),
    );
  });
});

describe('AiChatContainer published surface', () => {
  function FillReader() {
    return <Text testID="fill-reader">{useSurfaceFill()}</Text>;
  }
  it.each([false, true])(
    'publishes the painted container fill with floatingChrome=%s',
    (floatingChrome) => {
      const tree = renderIn(
        <AiChatContainer floatingChrome={floatingChrome} testID="painted">
          <FillReader />
        </AiChatContainer>,
      );
      expect(tree.getByTestId('fill-reader').props.children).toBe(
        resolvedStyle(tree.getByTestId('painted').props.style).backgroundColor,
      );
    },
  );
  it('transparent containers inherit the ambient fill, while explicit fills are published', () => {
    const tree = renderIn(
      <SurfaceLevelProvider level={1} fill="#123456">
        <AiChatContainer surface={false}>
          <FillReader />
        </AiChatContainer>
      </SurfaceLevelProvider>,
    );
    expect(tree.getByTestId('fill-reader').props.children).toBe('#123456');
    tree.rerender(
      <BloomThemeProvider>
        <AiChatContainer style={{ backgroundColor: '#654321' }}>
          <FillReader />
        </AiChatContainer>
      </BloomThemeProvider>,
    );
    expect(tree.getByTestId('fill-reader').props.children).toBe('#654321');
  });
});
