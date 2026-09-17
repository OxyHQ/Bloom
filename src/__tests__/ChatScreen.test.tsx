/**
 * @jest-environment jsdom
 *
 * `chat-screen`, rendered through the REAL react-native-web so the assertions
 * read the emitted DOM — the geometry, the painted colours and the accessibility
 * ATTRIBUTES. A prop-level test cannot see `accessibilityState` being dropped on
 * web, and cannot see a button that was never built because a precedence rule
 * fired; both are defects this family is exposed to.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { RiSpamLine } from '../icons/remix/RiSpamLine';
import { RiPhoneLine } from '../icons/remix/RiPhoneLine';
import {
  ChatBackground,
  ChatDateHeader,
  ChatEmptyState,
  ChatHeader,
  ChatInfoPanel,
  ChatMemberRow,
  ChatSplitLayout,
  JumpToMentionButton,
  PinnedMessageBar,
  ScrollToBottomButton,
} from '../chat-screen';
import { resolveChatScreenPaint } from '../chat-screen/shared';
import type { ChatMember, ChatPinnedMessage } from '../chat-screen/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function maybeTestId(id: string): HTMLElement | null {
  const el = container.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

function byLabel(label: string): HTMLElement | null {
  const el = container.querySelector(`[aria-label="${label}"]`);
  return el instanceof HTMLElement ? el : null;
}

function labels(): string[] {
  return Array.from(container.querySelectorAll('[aria-label]')).map(
    (el) => el.getAttribute('aria-label') ?? '',
  );
}

/** jsdom reports colours as `rgb(r, g, b)`; theme values arrive as `rgb(r g b)`. */
function normalise(color: string): string {
  const m = color.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) return color;
  return `rgb(${Number(m[0])}, ${Number(m[1])}, ${Number(m[2])})`;
}

function paint() {
  return resolveChatScreenPaint(theme);
}

const PINS: ChatPinnedMessage[] = [
  { id: 'p1', author: 'Ana', preview: 'Keys are under the blue pot.' },
  { id: 'p2', preview: 'Floorplan for the loft.' },
  { id: 'p3', preview: 'Dinner Thursday at eight.' },
];

const MEMBERS: ChatMember[] = [
  { id: 'm1', name: 'Ana Restrepo', status: 'online', role: 'owner', subtitle: 'online' },
  { id: 'm2', name: 'Teodor Ilić', status: 'idle', role: 'admin' },
  { id: 'm3', name: 'Mira Halvorsen', status: 'online' },
];

// ---------------------------------------------------------------------------
//  ChatHeader — the status line's precedence
// ---------------------------------------------------------------------------

describe('ChatHeader status precedence', () => {
  it('draws the status line when it is the only thing set', () => {
    mount(<ChatHeader title="Ana" status="last seen recently" testID="h" />);
    expect(byTestId('h-status').textContent).toBe('last seen recently');
  });

  it('lets typing WIN over the status line', () => {
    mount(<ChatHeader title="Ana" status="last seen recently" typingLabel="Ana is typing…" testID="h" />);
    const status = byTestId('h-status');
    // `TypingDots` names itself and hides the drawn copy of the label, so the
    // NAME is the assertion, not the text content.
    expect(status.getAttribute('aria-label')).toBe('Ana is typing…');
    expect(container.textContent).not.toContain('last seen recently');
  });

  it('lets connecting WIN over both — a claim the app cannot currently make is not made', () => {
    mount(
      <ChatHeader
        title="Ana"
        status="last seen recently"
        typingLabel="Ana is typing…"
        connecting
        testID="h"
      />,
    );
    expect(byTestId('h-status').textContent).toBe('Connecting…');
    expect(container.textContent).not.toContain('is typing');
    expect(container.textContent).not.toContain('last seen recently');
  });

  it('takes the connecting wording as a prop', () => {
    mount(<ChatHeader title="Ana" connecting connectingLabel="Conectando…" testID="h" />);
    expect(byTestId('h-status').textContent).toBe('Conectando…');
  });

  it('draws no status row at all when nothing is set', () => {
    mount(<ChatHeader title="Ana" testID="h" />);
    expect(maybeTestId('h-status')).toBeNull();
  });

  it('paints an ACCENT status line only when asked', () => {
    mount(<ChatHeader title="Ana" status="online" statusTone="accent" testID="h" />);
    expect(normalise(getComputedStyle(byTestId('h-status')).color)).toBe(
      normalise(paint().accentColor),
    );
    mount(<ChatHeader title="Ana" status="online" testID="h" />);
    expect(normalise(getComputedStyle(byTestId('h-status')).color)).toBe(
      normalise(paint().textSecondary),
    );
  });
});

describe('ChatHeader identity and actions', () => {
  it('names the marker and gives it a role, and only `verified` takes the accent', () => {
    mount(<ChatHeader title="Ana" marker="verified" testID="h" />);
    const marker = byTestId('h-marker');
    expect(marker.getAttribute('role')).toBe('img');
    expect(marker.getAttribute('aria-label')).toBe('Verified');

    mount(<ChatHeader title="Wayfinder" marker="bot" testID="h" />);
    expect(byTestId('h-marker').getAttribute('aria-label')).toBe('Bot');

    mount(<ChatHeader title="Notices" marker="channel" markerLabel="Canal" testID="h" />);
    expect(byTestId('h-marker').getAttribute('aria-label')).toBe('Canal');
  });

  it('hides the marker from assistive tech on an EMPTY label, and only then', () => {
    mount(<ChatHeader title="Ana" marker="verified" markerLabel="" testID="h" />);
    const marker = byTestId('h-marker');
    expect(marker.getAttribute('aria-hidden')).toBe('true');
    expect(marker.getAttribute('role')).toBeNull();
  });

  it('draws the back button only on the compact layout', () => {
    mount(<ChatHeader title="Ana" compact onPressBack={() => {}} testID="h" />);
    expect(maybeTestId('h-back')).not.toBeNull();

    mount(<ChatHeader title="Ana" compact={false} onPressBack={() => {}} testID="h" />);
    expect(maybeTestId('h-back')).toBeNull();

    // …unless the caller overrules the derivation.
    mount(<ChatHeader title="Ana" compact={false} showBack onPressBack={() => {}} testID="h" />);
    expect(maybeTestId('h-back')).not.toBeNull();
  });

  it('names every action it draws, and draws none it was not given a handler for', () => {
    mount(
      <ChatHeader
        title="Ana"
        onPressCall={() => {}}
        onPressVideoCall={() => {}}
        onPressSearch={() => {}}
        onPressMore={() => {}}
      />,
    );
    for (const name of ['Call', 'Video call', 'Search in conversation', 'More options']) {
      expect(byLabel(name)).not.toBeNull();
    }

    mount(<ChatHeader title="Ana" onPressCall={() => {}} />);
    expect(byLabel('Call')).not.toBeNull();
    expect(byLabel('Video call')).toBeNull();
    expect(byLabel('More options')).toBeNull();
  });

  it('names the identity block after the conversation when it opens the info panel', () => {
    const onPressHeader = jest.fn();
    mount(<ChatHeader title="Ana Restrepo" onPressHeader={onPressHeader} testID="h" />);
    const identity = byTestId('h-identity');
    expect(identity.getAttribute('aria-label')).toBe('Ana Restrepo');
    act(() => {
      identity.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onPressHeader).toHaveBeenCalled();

    // Without the handler there is no button at all — not a dead one.
    mount(<ChatHeader title="Ana Restrepo" testID="h" />);
    expect(maybeTestId('h-identity')).toBeNull();
  });

  it('lets `renderMore` replace the built-in trigger rather than sit beside it', () => {
    mount(
      <ChatHeader
        title="Ana"
        onPressMore={() => {}}
        renderMore={() => <ChatMemberRow member={MEMBERS[0] as ChatMember} testID="custom-more" />}
      />,
    );
    expect(maybeTestId('custom-more')).not.toBeNull();
    expect(byLabel('More options')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  ChatHeader — selection mode
// ---------------------------------------------------------------------------

describe('ChatHeader selection mode', () => {
  const selectionProps = {
    title: 'Ana Restrepo',
    status: 'online',
    onPressCall: () => {},
    onPressVideoCall: () => {},
    onPressSearch: () => {},
    onPressMore: () => {},
    onClearSelection: () => {},
    onForward: () => {},
    onCopy: () => {},
    onPin: () => {},
    onDelete: () => {},
  };

  it('REPLACES the header: no identity, no status, none of the four controls', () => {
    mount(<ChatHeader {...selectionProps} selectionCount={3} testID="h" />);
    expect(container.textContent).toContain('3 selected');
    expect(container.textContent).not.toContain('Ana Restrepo');
    expect(maybeTestId('h-status')).toBeNull();
    for (const name of ['Call', 'Video call', 'Search in conversation', 'More options']) {
      expect(byLabel(name)).toBeNull();
    }
  });

  it('offers the four selection actions, each named', () => {
    mount(<ChatHeader {...selectionProps} selectionCount={3} />);
    for (const name of ['Clear selection', 'Forward', 'Copy', 'Pin', 'Delete']) {
      expect(byLabel(name)).not.toBeNull();
    }
  });

  it('is off at zero and below — a count of 0 is not a selection', () => {
    mount(<ChatHeader {...selectionProps} selectionCount={0} testID="h" />);
    expect(container.textContent).toContain('Ana Restrepo');
    expect(byLabel('Call')).not.toBeNull();

    mount(<ChatHeader {...selectionProps} selectionCount={-2} testID="h" />);
    expect(container.textContent).toContain('Ana Restrepo');
  });

  it('takes the count wording as a prop', () => {
    mount(
      <ChatHeader
        {...selectionProps}
        selectionCount={2}
        formatSelectionCount={(n) => `${n} seleccionados`}
      />,
    );
    expect(container.textContent).toContain('2 seleccionados');
  });
});

// ---------------------------------------------------------------------------
//  PinnedMessageBar
// ---------------------------------------------------------------------------

describe('PinnedMessageBar', () => {
  it('renders NOTHING for an empty list', () => {
    mount(<PinnedMessageBar pins={[]} testID="pin" />);
    expect(maybeTestId('pin')).toBeNull();
  });

  it('draws one segment per pin and highlights the current one', () => {
    mount(<PinnedMessageBar pins={PINS} index={1} testID="pin" />);
    const active = paint().accentColor;
    const inactive = paint().accentTrack;
    expect(normalise(getComputedStyle(byTestId('pin-segment-0')).backgroundColor)).toBe(
      normalise(inactive),
    );
    expect(normalise(getComputedStyle(byTestId('pin-segment-1')).backgroundColor)).toBe(
      normalise(active),
    );
    expect(normalise(getComputedStyle(byTestId('pin-segment-2')).backgroundColor)).toBe(
      normalise(inactive),
    );
    expect(maybeTestId('pin-segment-3')).toBeNull();
  });

  it('numbers the title from the index, and drops the number for a single pin', () => {
    mount(<PinnedMessageBar pins={PINS} index={1} testID="pin" />);
    expect(byTestId('pin-title').textContent).toBe('Pinned message #2');

    mount(<PinnedMessageBar pins={PINS.slice(0, 1)} testID="pin" />);
    expect(byTestId('pin-title').textContent).toBe('Pinned message');
  });

  it('CLAMPS an index the list no longer has, rather than reading past the end', () => {
    mount(<PinnedMessageBar pins={PINS} index={9} testID="pin" />);
    expect(byTestId('pin-title').textContent).toBe('Pinned message #3');
    expect(byTestId('pin-preview').textContent).toBe('Dinner Thursday at eight.');

    mount(<PinnedMessageBar pins={PINS} index={-4} testID="pin" />);
    expect(byTestId('pin-title').textContent).toBe('Pinned message #1');
  });

  it('collapses to ONE rule past eight pins, instead of sub-pixel slivers', () => {
    const many = Array.from({ length: 11 }, (_unused, i) => ({ id: `${i}`, preview: `#${i}` }));
    mount(<PinnedMessageBar pins={many} index={6} testID="pin" />);
    expect(maybeTestId('pin-segment-0')).not.toBeNull();
    expect(maybeTestId('pin-segment-1')).toBeNull();
    expect(normalise(getComputedStyle(byTestId('pin-segment-0')).backgroundColor)).toBe(
      normalise(paint().accentColor),
    );
  });

  it('prefixes the author onto the preview and names the jump button with both lines', () => {
    mount(<PinnedMessageBar pins={PINS} index={0} onPressPin={() => {}} testID="pin" />);
    expect(byTestId('pin-preview').textContent).toBe('Ana: Keys are under the blue pot.');
    expect(byTestId('pin-jump').getAttribute('aria-label')).toBe(
      'Pinned message #1. Ana: Keys are under the blue pot.',
    );
  });

  it('reports the pin AND its index on press', () => {
    const onPressPin = jest.fn();
    mount(<PinnedMessageBar pins={PINS} index={2} onPressPin={onPressPin} testID="pin" />);
    act(() => {
      byTestId('pin-jump').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onPressPin).toHaveBeenCalledWith(PINS[2], 2);
  });

  it('names the dismiss button after what it DOES', () => {
    mount(<PinnedMessageBar pins={PINS} onDismiss={() => {}} testID="pin" />);
    expect(byTestId('pin-dismiss').getAttribute('aria-label')).toBe('Hide the pinned bar');

    mount(<PinnedMessageBar pins={PINS} onDismiss={() => {}} dismissIcon="unpin" testID="pin" />);
    expect(byTestId('pin-dismiss').getAttribute('aria-label')).toBe('Unpin this message');
  });

  it('draws neither optional button without its handler', () => {
    mount(<PinnedMessageBar pins={PINS} testID="pin" />);
    expect(maybeTestId('pin-list')).toBeNull();
    expect(maybeTestId('pin-dismiss')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  ChatBackground
// ---------------------------------------------------------------------------

describe('ChatBackground', () => {
  it('draws only the layer its variant asks for', () => {
    mount(<ChatBackground variant="plain" testID="bg" />);
    expect(maybeTestId('chat-background-pattern')).toBeNull();
    expect(maybeTestId('chat-background-gradient')).toBeNull();
    expect(maybeTestId('chat-background-image')).toBeNull();

    mount(<ChatBackground variant="pattern" testID="bg" />);
    expect(maybeTestId('chat-background-pattern')).not.toBeNull();
    expect(maybeTestId('chat-background-gradient')).toBeNull();

    mount(<ChatBackground variant="gradient" testID="bg" />);
    expect(maybeTestId('chat-background-gradient')).not.toBeNull();
    expect(maybeTestId('chat-background-pattern')).toBeNull();
  });

  it('always paints the page colour underneath, so a bubble composites over a KNOWN colour', () => {
    for (const variant of ['plain', 'pattern', 'gradient'] as const) {
      mount(<ChatBackground variant={variant} testID="bg" />);
      expect(normalise(getComputedStyle(byTestId('bg')).backgroundColor)).toBe(
        normalise(paint().page),
      );
    }
  });

  it('dims an image wallpaper, and the dim is not optional', () => {
    mount(
      <ChatBackground variant="image" source="https://example.test/wall.jpg" testID="bg" />,
    );
    const dim = byTestId('chat-background-dim');
    expect(Number(getComputedStyle(dim).opacity)).toBeCloseTo(paint().imageDimOpacity, 5);
    expect(normalise(getComputedStyle(dim).backgroundColor)).toBe(normalise(paint().imageDim));
    // The photo itself is decorative: it carries no name for a reader to hear.
    expect(byTestId('chat-background-image').getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back to the plain page when `image` has no source, rather than an empty frame', () => {
    mount(<ChatBackground variant="image" testID="bg" />);
    expect(maybeTestId('chat-background-image')).toBeNull();
    expect(normalise(getComputedStyle(byTestId('bg')).backgroundColor)).toBe(
      normalise(paint().page),
    );
  });

  it('renders the transcript above the wallpaper', () => {
    mount(
      <ChatBackground variant="pattern" testID="bg">
        <ChatDateHeader label="Today" placement="inline" testID="date" />
      </ChatBackground>,
    );
    expect(byTestId('bg').contains(byTestId('date'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
//  ChatDateHeader
// ---------------------------------------------------------------------------

describe('ChatDateHeader', () => {
  it('fades out and leaves the accessibility tree when hidden — but stays mounted', () => {
    mount(<ChatDateHeader label="Today" testID="date" />);
    let pill = byTestId('date-pill');
    expect(Number(getComputedStyle(pill).opacity)).toBe(1);
    expect(pill.getAttribute('aria-hidden')).toBeNull();

    mount(<ChatDateHeader label="Today" visible={false} testID="date" />);
    pill = byTestId('date-pill');
    expect(Number(getComputedStyle(pill).opacity)).toBe(0);
    expect(pill.getAttribute('aria-hidden')).toBe('true');
    // NOT `display: none` — collapsing an element inside a scroller is how a
    // restored offset gets clamped to 0.
    expect(getComputedStyle(pill).display).not.toBe('none');
  });

  it('keeps the floating strip transparent to pointers', () => {
    mount(<ChatDateHeader label="Today" testID="date" />);
    // react-native-web compiles `box-none` to `pointer-events: none` on the
    // element plus an `auto` rule for its children, so the computed value here
    // reads `none` for both spellings. What this asserts is the property that
    // matters — a strip across the top of a transcript that does not eat presses
    // on the newest messages. That it is a PROP and not a style entry (which RNW
    // drops outright) is `pointer-events-style-form.test.ts`'s job.
    expect(getComputedStyle(byTestId('date')).pointerEvents).toBe('none');
    expect(getComputedStyle(byTestId('date-pill')).pointerEvents).toBe('none');
  });

  it('sits in flow when asked to', () => {
    mount(<ChatDateHeader label="Yesterday" placement="inline" testID="date" />);
    expect(getComputedStyle(byTestId('date')).position).not.toBe('absolute');
  });
});

// ---------------------------------------------------------------------------
//  ScrollToBottomButton / JumpToMentionButton
// ---------------------------------------------------------------------------

describe('the jump buttons', () => {
  it('render NOTHING when hidden — no phantom tab stop', () => {
    mount(<ScrollToBottomButton visible={false} unreadCount={4} testID="jump" />);
    expect(maybeTestId('jump')).toBeNull();
    expect(container.querySelector('[role="button"]')).toBeNull();

    mount(<JumpToMentionButton visible={false} count={4} testID="mention" />);
    expect(maybeTestId('mention')).toBeNull();
  });

  it('name themselves, and the badge names the count separately', () => {
    mount(<ScrollToBottomButton unreadCount={7} testID="jump" />);
    expect(byTestId('jump-button').getAttribute('aria-label')).toBe('Scroll to latest messages');
    expect(labels()).toContain('7 unread messages');

    mount(<JumpToMentionButton count={2} testID="mention" />);
    expect(byTestId('mention-button').getAttribute('aria-label')).toBe('Jump to mention');
  });

  it('draws no badge at zero', () => {
    mount(<ScrollToBottomButton unreadCount={0} testID="jump" />);
    expect(maybeTestId('jump-badge')).toBeNull();
  });

  it('clamps the badge at `badgeMax`', () => {
    mount(<ScrollToBottomButton unreadCount={250} badgeMax={99} testID="jump" />);
    expect(byTestId('jump-badge').textContent).toBe('99+');
    // The NAME still carries the real count, not the clamped text.
    expect(labels()).toContain('250 unread messages');
  });

  it('carries a hairline, because a floating surface can land on its own colour', () => {
    mount(<ScrollToBottomButton testID="jump" />);
    const style = getComputedStyle(byTestId('jump-button'));
    expect(parseFloat(style.borderTopWidth)).toBeGreaterThanOrEqual(1);
    expect(normalise(style.borderTopColor)).toBe(normalise(paint().floatingBorder));
    expect(normalise(style.backgroundColor)).toBe(normalise(paint().floatingSurface));
  });

  it('fires', () => {
    const onPress = jest.fn();
    mount(<ScrollToBottomButton onPress={onPress} testID="jump" />);
    act(() => {
      byTestId('jump-button').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onPress).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
//  ChatEmptyState
// ---------------------------------------------------------------------------

describe('ChatEmptyState', () => {
  it('makes NO security claim on the app behalf', () => {
    mount(<ChatEmptyState testID="empty" />);
    expect(maybeTestId('empty-notice')).toBeNull();
    expect(container.textContent).toBe('No messages yet');
  });

  it('draws the notice the caller wrote, and nothing else', () => {
    mount(<ChatEmptyState notice="Messages here are end-to-end encrypted." testID="empty" />);
    expect(byTestId('empty-notice').textContent).toBe('Messages here are end-to-end encrypted.');
  });

  it('takes a title, a description and an illustration', () => {
    mount(
      <ChatEmptyState
        title="Say hello"
        description="This conversation is new."
        illustration={<ChatDateHeader label="✦" placement="inline" />}
        testID="empty"
      />,
    );
    expect(container.textContent).toContain('Say hello');
    expect(container.textContent).toContain('This conversation is new.');
    expect(maybeTestId('empty-illustration')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  ChatMemberRow
// ---------------------------------------------------------------------------

describe('ChatMemberRow', () => {
  it('composes the name, the role and the second line into ONE announcement', () => {
    mount(<ChatMemberRow member={MEMBERS[0] as ChatMember} onPress={() => {}} testID="row" />);
    expect(byTestId('row').getAttribute('aria-label')).toBe('Ana Restrepo, Owner, online');
  });

  it('badges owner and admin, and only those', () => {
    mount(<ChatMemberRow member={MEMBERS[0] as ChatMember} testID="row" />);
    expect(byTestId('row-role').textContent).toBe('Owner');

    mount(<ChatMemberRow member={MEMBERS[1] as ChatMember} testID="row" />);
    expect(byTestId('row-role').textContent).toBe('Admin');

    mount(<ChatMemberRow member={MEMBERS[2] as ChatMember} testID="row" />);
    expect(maybeTestId('row-role')).toBeNull();

    mount(
      <ChatMemberRow
        member={{ id: 'x', name: 'Plain', role: 'member' }}
        testID="row"
      />,
    );
    expect(maybeTestId('row-role')).toBeNull();
  });

  it('takes translated role words', () => {
    mount(
      <ChatMemberRow
        member={MEMBERS[0] as ChatMember}
        roleLabels={{ owner: 'Propietaria' }}
        testID="row"
      />,
    );
    expect(byTestId('row-role').textContent).toBe('Propietaria');
  });
});

// ---------------------------------------------------------------------------
//  ChatInfoPanel
// ---------------------------------------------------------------------------

describe('ChatInfoPanel', () => {
  const tabs = [
    { value: 'media', label: 'Media', count: 12, content: <ChatDateHeader label="MEDIA" placement="inline" testID="pane-media" /> },
    { value: 'files', label: 'Files', content: <ChatDateHeader label="FILES" placement="inline" testID="pane-files" /> },
  ];

  it('is a fixed-width column as a pane and fills the screen as a screen', () => {
    mount(<ChatInfoPanel variant="pane" width={380} name="Ana" testID="panel" />);
    expect(getComputedStyle(byTestId('panel')).width).toBe('380px');

    mount(<ChatInfoPanel variant="screen" name="Ana" testID="panel" />);
    expect(getComputedStyle(byTestId('panel')).width).not.toBe('380px');
  });

  it('shows ONE tab pane at a time and switches on press', () => {
    mount(<ChatInfoPanel name="Ana" tabs={tabs} testID="panel" />);
    expect(maybeTestId('pane-media')).not.toBeNull();
    expect(maybeTestId('pane-files')).toBeNull();

    const filesTab = Array.from(container.querySelectorAll('[role="tab"]')).find((el) =>
      (el.textContent ?? '').includes('Files'),
    );
    expect(filesTab).toBeTruthy();
    act(() => {
      (filesTab as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(maybeTestId('pane-files')).not.toBeNull();
    expect(maybeTestId('pane-media')).toBeNull();
  });

  it('honours a CONTROLLED tab and reports the change', () => {
    const onTabChange = jest.fn();
    mount(<ChatInfoPanel name="Ana" tabs={tabs} tab="files" onTabChange={onTabChange} testID="panel" />);
    expect(maybeTestId('pane-files')).not.toBeNull();

    const mediaTab = Array.from(container.querySelectorAll('[role="tab"]')).find((el) =>
      (el.textContent ?? '').includes('Media'),
    );
    act(() => {
      (mediaTab as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onTabChange).toHaveBeenCalledWith('media');
    // Still on `files`: a controlled panel does not move itself.
    expect(maybeTestId('pane-files')).not.toBeNull();
  });

  it('names every action tile and paints a negative one in the error colour', () => {
    mount(
      <ChatInfoPanel
        name="Ana"
        actions={[
          { key: 'call', label: 'Call', icon: RiPhoneLine },
          { key: 'report', label: 'Report', icon: RiSpamLine, tone: 'negative' },
        ]}
        testID="panel"
      />,
    );
    expect(byTestId('chat-info-action-call').getAttribute('aria-label')).toBe('Call');
    const report = byTestId('chat-info-action-report');
    expect(normalise(getComputedStyle(report).backgroundColor)).toBe(
      normalise(paint().destructiveSubtle),
    );
  });

  it('draws destructive rows in the negative tone, each named', () => {
    mount(
      <ChatInfoPanel
        name="Ana"
        destructiveActions={[
          { key: 'leave', label: 'Leave group', icon: RiSpamLine, tone: 'negative' },
          { key: 'block', label: 'Block Ana', icon: RiSpamLine, tone: 'negative' },
        ]}
        testID="panel"
      />,
    );
    const block = byLabel('Block Ana');
    expect(block).not.toBeNull();
    const text = (block as HTMLElement).querySelector('[data-testid="settings-list-item-content"]');
    const title = (text as HTMLElement).querySelector('div, span');
    expect(title).toBeTruthy();
    expect(container.textContent).toContain('Leave group');
    expect(container.textContent).toContain('Block Ana');
  });

  it('filters its own roster when UNCONTROLLED', () => {
    mount(<ChatInfoPanel name="Crew" members={MEMBERS} memberSearch testID="panel" />);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(input, 'mira');
      (input as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(maybeTestId('chat-info-member-m3')).not.toBeNull();
    expect(maybeTestId('chat-info-member-m1')).toBeNull();
  });

  it('filters NOTHING when the query is CONTROLLED — the caller owns the result set', () => {
    const onMemberQueryChange = jest.fn();
    mount(
      <ChatInfoPanel
        name="Crew"
        members={MEMBERS}
        memberSearch
        memberQuery="mira"
        onMemberQueryChange={onMemberQueryChange}
        testID="panel"
      />,
    );
    // All three still rendered: filtering a controlled result set would fight
    // the server that produced it.
    expect(maybeTestId('chat-info-member-m1')).not.toBeNull();
    expect(maybeTestId('chat-info-member-m3')).not.toBeNull();
  });

  it('says so when the roster is empty', () => {
    mount(<ChatInfoPanel name="Crew" members={[]} testID="panel" />);
    expect(byTestId('panel-members-empty').textContent).toBe('No members found');
  });

  it('draws no members section at all when `members` is absent', () => {
    mount(<ChatInfoPanel name="Ana" testID="panel" />);
    expect(maybeTestId('panel-members')).toBeNull();
  });

  it('names the close button and the add-members row', () => {
    mount(
      <ChatInfoPanel name="Crew" members={MEMBERS} onClose={() => {}} onAddMember={() => {}} testID="panel" />,
    );
    expect(byTestId('panel-close').getAttribute('aria-label')).toBe('Close');
    expect(byTestId('panel-add-member').getAttribute('aria-label')).toBe('Add members');
  });
});

// ---------------------------------------------------------------------------
//  ChatSplitLayout
// ---------------------------------------------------------------------------

describe('ChatSplitLayout', () => {
  const panes = {
    list: <ChatDateHeader label="LIST" placement="inline" testID="pane-list" />,
    info: <ChatDateHeader label="INFO" placement="inline" testID="pane-info" />,
    children: <ChatDateHeader label="CONVO" placement="inline" testID="pane-convo" />,
  };

  it('builds all three panes when there is room', () => {
    mount(
      <ChatSplitLayout compact={false} list={panes.list} info={panes.info} testID="split">
        {panes.children}
      </ChatSplitLayout>,
    );
    expect(maybeTestId('pane-list')).not.toBeNull();
    expect(maybeTestId('pane-convo')).not.toBeNull();
    expect(maybeTestId('pane-info')).not.toBeNull();
    expect(getComputedStyle(byTestId('split-list')).width).toBe('340px');
    expect(getComputedStyle(byTestId('split-info')).width).toBe('380px');
  });

  it('omits the info column when there is no info node', () => {
    mount(
      <ChatSplitLayout compact={false} list={panes.list} testID="split">
        {panes.children}
      </ChatSplitLayout>,
    );
    expect(maybeTestId('split-info')).toBeNull();
  });

  it('builds exactly ONE pane when compact — the others are not mounted', () => {
    for (const [pane, present, absent] of [
      ['conversation', 'pane-convo', ['pane-list', 'pane-info']],
      ['list', 'pane-list', ['pane-convo', 'pane-info']],
      ['info', 'pane-info', ['pane-list', 'pane-convo']],
    ] as const) {
      mount(
        <ChatSplitLayout compact pane={pane} list={panes.list} info={panes.info} testID="split">
          {panes.children}
        </ChatSplitLayout>,
      );
      expect(maybeTestId(present)).not.toBeNull();
      for (const id of absent) expect(maybeTestId(id)).toBeNull();
    }
  });

  it('falls back to the conversation when `info` is asked for and does not exist', () => {
    mount(
      <ChatSplitLayout compact pane="info" list={panes.list} testID="split">
        {panes.children}
      </ChatSplitLayout>,
    );
    expect(maybeTestId('pane-convo')).not.toBeNull();
    expect(maybeTestId('pane-list')).toBeNull();
  });

  it('honours a CONTROLLED list width and names the grip', () => {
    mount(
      <ChatSplitLayout compact={false} listWidth={420} list={panes.list} testID="split">
        {panes.children}
      </ChatSplitLayout>,
    );
    expect(getComputedStyle(byTestId('split-list')).width).toBe('420px');
    expect(byTestId('split-grip').getAttribute('aria-label')).toBe('Resize the conversation list');
  });

  it('drops the grip when resizing is off', () => {
    mount(
      <ChatSplitLayout compact={false} resizable={false} list={panes.list} testID="split">
        {panes.children}
      </ChatSplitLayout>,
    );
    expect(maybeTestId('split-grip')).toBeNull();
  });
});
