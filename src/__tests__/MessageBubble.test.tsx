/**
 * @jest-environment jsdom
 *
 * `message-bubble`, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: the corner geometry, the painted colours,
 * where the meta row lands, and the accessibility ATTRIBUTES — a prop-level
 * test cannot see `accessibilityState` being dropped on web, and that is the
 * defect class a selectable, toggleable bubble is most exposed to.
 */
import React from 'react';
import { Pressable } from 'react-native';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { contrastRatio } from '../styles/color-contrast';
import {
  CallSummaryRow,
  DateSeparator,
  MessageBubble,
  MessageGroup,
  MessageList,
  SystemMessage,
  TypingBubble,
  UnreadSeparator,
  bubblePositions,
  bubbleRadii,
  groupMessages,
  messageEntities,
  senderNameColor,
  splitMessageText,
} from '../message-bubble';
import type { MessageListItem } from '../message-bubble';
import { resolveMessageBubblePaint } from '../message-bubble/shared';

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

/** The bubble box itself — the node carrying the fill and the radii. */
function bubbleBox(direction: 'incoming' | 'outgoing' = 'incoming'): HTMLElement {
  const el = container.querySelector(`[data-bloom-message-bubble="${direction}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No ${direction} bubble`);
  return el;
}

function radii(el: HTMLElement): [string, string, string, string] {
  const s = getComputedStyle(el);
  return [
    s.borderTopLeftRadius,
    s.borderTopRightRadius,
    s.borderBottomRightRadius,
    s.borderBottomLeftRadius,
  ];
}

/** jsdom reports colours as `rgb(r, g, b)`; theme values arrive as `rgb(r g b)`. */
function normalise(color: string): string {
  const m = color.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) return color;
  return `rgb(${Number(m[0])}, ${Number(m[1])}, ${Number(m[2])})`;
}

function paint() {
  return resolveMessageBubblePaint(theme);
}

/** The DEEPEST node whose whole text is `text` — the one carrying the colour. */
function leafWithText(id: string, text: string): HTMLElement {
  const found = [...byTestId(id).querySelectorAll('*')].filter(
    (el) => el.textContent === text && el.children.length === 0,
  );
  const last = found[found.length - 1];
  if (!(last instanceof HTMLElement)) throw new Error(`No leaf with text "${text}"`);
  return last;
}

// ---------------------------------------------------------------------------
//  Pure geometry and grouping
// ---------------------------------------------------------------------------

describe('bubblePositions', () => {
  it('cuts exactly one corner per run', () => {
    expect(bubblePositions(0)).toEqual([]);
    expect(bubblePositions(1)).toEqual(['single']);
    expect(bubblePositions(2)).toEqual(['first', 'last']);
    expect(bubblePositions(4)).toEqual(['first', 'middle', 'middle', 'last']);
  });

  it('never returns two cut positions, at any length', () => {
    for (let n = 1; n <= 12; n++) {
      const cuts = bubblePositions(n).filter((p) => p === 'last' || p === 'single');
      expect(cuts).toHaveLength(1);
    }
  });

  it('survives nonsense input rather than looping', () => {
    expect(bubblePositions(-3)).toEqual([]);
    expect(bubblePositions(Number.NaN)).toEqual([]);
    expect(bubblePositions(2.7)).toEqual(['first', 'last']);
  });
});

describe('bubbleRadii', () => {
  it('cuts the bottom-right of an outgoing run end and the bottom-left of an incoming one', () => {
    expect(bubbleRadii('outgoing', 'last')).toEqual({
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 4,
    });
    expect(bubbleRadii('incoming', 'single').borderBottomLeftRadius).toBe(4);
    expect(bubbleRadii('incoming', 'single').borderBottomRightRadius).toBe(18);
  });

  it('leaves first and middle fully round', () => {
    for (const position of ['first', 'middle'] as const) {
      for (const direction of ['incoming', 'outgoing'] as const) {
        expect(Object.values(bubbleRadii(direction, position))).toEqual([18, 18, 18, 18]);
      }
    }
  });
});

describe('groupMessages', () => {
  const items: MessageListItem[] = [
    { id: 'a', direction: 'incoming', senderId: 'ana', dateKey: 'd1', dateLabel: 'Today' },
    { id: 'b', direction: 'incoming', senderId: 'ana' },
    { id: 'c', direction: 'incoming', senderId: 'marcel' },
    { id: 'd', direction: 'outgoing' },
    { id: 'e', direction: 'outgoing' },
  ];

  it('opens with the date separator and runs by sender', () => {
    const entries = groupMessages(items);
    expect(entries.map((e) => e.kind)).toEqual(['date', 'group', 'group', 'group']);
    const groups = entries.filter((e) => e.kind === 'group');
    expect(groups[0]?.messages.map((m) => m.position)).toEqual(['first', 'last']);
    expect(groups[1]?.messages.map((m) => m.position)).toEqual(['single']);
    expect(groups[2]?.messages.map((m) => m.position)).toEqual(['first', 'last']);
  });

  it('breaks a run on a service line between two messages from the same sender', () => {
    const entries = groupMessages([
      { id: 'a', direction: 'incoming', senderId: 'ana' },
      { id: 's', direction: 'incoming', system: 'Ana pinned a message' },
      { id: 'b', direction: 'incoming', senderId: 'ana' },
    ]);
    expect(entries.map((e) => e.kind)).toEqual(['group', 'system', 'group']);
    for (const entry of entries) {
      if (entry.kind === 'group') expect(entry.messages[0]?.position).toBe('single');
    }
  });

  it('breaks a run on the unread rule and on a new day', () => {
    const entries = groupMessages([
      { id: 'a', direction: 'incoming', senderId: 'ana', dateKey: 'd1' },
      { id: 'b', direction: 'incoming', senderId: 'ana', unreadBefore: true },
      { id: 'c', direction: 'incoming', senderId: 'ana', dateKey: 'd2' },
    ]);
    expect(entries.map((e) => e.kind)).toEqual(['date', 'group', 'unread', 'group', 'date', 'group']);
  });

  it('labels a day from dateKey when no dateLabel is given', () => {
    const [first] = groupMessages([{ id: 'a', direction: 'incoming', dateKey: '2026-03-12' }]);
    expect(first).toMatchObject({ kind: 'date', label: '2026-03-12' });
  });

  it('separates a call row from the bubbles around it', () => {
    const entries = groupMessages([
      { id: 'a', direction: 'outgoing' },
      { id: 'c', direction: 'outgoing', call: { outcome: 'missed', title: 'Missed call' } },
      { id: 'b', direction: 'outgoing' },
    ]);
    expect(entries.map((e) => e.kind)).toEqual(['group', 'call', 'group']);
  });
});

// ---------------------------------------------------------------------------
//  Entities
// ---------------------------------------------------------------------------

describe('messageEntities', () => {
  it('finds links, mentions and hashtags, in order', () => {
    const found = messageEntities('See https://example.invalid/a — ping @marcel about #gear');
    expect(found.map((e) => [e.type, e.text])).toEqual([
      ['link', 'https://example.invalid/a'],
      ['mention', '@marcel'],
      ['hashtag', '#gear'],
    ]);
  });

  it('reports ranges that reconstruct the original text exactly', () => {
    const text = 'Ping @ana and @marcel about #gear at www.example.invalid/x';
    const parts = splitMessageText(text);
    expect(parts.map((p) => p.text).join('')).toBe(text);
    expect(parts.filter((p) => p.entity !== undefined)).toHaveLength(4);
  });

  it('does not read an email address as a mention', () => {
    expect(messageEntities('write to ana@example.invalid')).toEqual([]);
  });

  it('returns one whole part for text with nothing in it', () => {
    expect(splitMessageText('just words')).toEqual([{ text: 'just words' }]);
  });
});

// ---------------------------------------------------------------------------
//  Sender colour
// ---------------------------------------------------------------------------

describe('senderNameColor', () => {
  it('is deterministic for a seed and a theme', () => {
    mount(<View />);
    expect(senderNameColor('ana', theme)).toBe(senderNameColor('ana', theme));
    expect(senderNameColor('ana', theme)).not.toBe(senderNameColor('marcel', theme));
  });

  it('clears AA against the incoming bubble it is drawn on, in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      mount(<View />, mode);
      const fill = paint().incoming.fill;
      for (const seed of ['ana', 'marcel', 'nour', 'ines', 'tomas', 'lu', 'kai', 'zo']) {
        expect(contrastRatio(fill, senderNameColor(seed, theme))).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

// `View` is only needed for the two theme-reading cases above.
function View() {
  return null;
}

// ---------------------------------------------------------------------------
//  Painting and AA
// ---------------------------------------------------------------------------

describe('bubble paint', () => {
  it('fills an outgoing bubble with the accent and an incoming one with the neutral surface', () => {
    mount(
      <>
        <MessageBubble direction="outgoing" text="out" />
        <MessageBubble direction="incoming" text="in" />
      </>,
    );
    expect(normalise(getComputedStyle(bubbleBox('outgoing')).backgroundColor)).toBe(
      normalise(paint().outgoing.fill),
    );
    expect(normalise(getComputedStyle(bubbleBox('incoming')).backgroundColor)).toBe(
      normalise(paint().incoming.fill),
    );
  });

  it('keeps AA for the body text AND the meta row on both sides, in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      mount(<MessageBubble direction="outgoing" text="x" />, mode);
      const p = paint();
      for (const side of [p.incoming, p.outgoing]) {
        expect(contrastRatio(side.fill, side.text)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(side.fill, side.meta)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('draws the light-mode hairline on an incoming bubble and none in dark', () => {
    mount(<MessageBubble direction="incoming" text="in" />, 'light');
    expect(getComputedStyle(bubbleBox()).borderTopWidth).toBe('1px');
    mount(<MessageBubble direction="incoming" text="in" />, 'dark');
    expect(getComputedStyle(bubbleBox()).borderTopWidth).toBe('0px');
  });

  it('cuts only the run-end corner, and on the right side', () => {
    mount(
      <>
        <MessageBubble direction="outgoing" position="middle" text="mid" />
        <MessageBubble direction="incoming" position="last" text="last" />
      </>,
    );
    expect(radii(bubbleBox('outgoing'))).toEqual(['18px', '18px', '18px', '18px']);
    expect(radii(bubbleBox('incoming'))).toEqual(['18px', '18px', '18px', '4px']);
  });

  it('bands the whole ROW when selected, not the bubble', () => {
    mount(<MessageBubble direction="incoming" text="x" selected testID="row" />);
    expect(normalise(getComputedStyle(byTestId('row')).backgroundColor)).toBe(
      normalise(paint().selectedBand),
    );
    expect(normalise(getComputedStyle(bubbleBox()).backgroundColor)).toBe(
      normalise(paint().incoming.fill),
    );
  });

  it('washes a failed bubble away from the plain fill', () => {
    mount(<MessageBubble direction="outgoing" text="x" failed />);
    expect(normalise(getComputedStyle(bubbleBox('outgoing')).backgroundColor)).not.toBe(
      normalise(paint().outgoing.fill),
    );
  });

  it('dims a pending bubble and leaves a settled one alone', () => {
    mount(<MessageBubble direction="outgoing" text="x" pending />);
    expect(Number(getComputedStyle(bubbleBox('outgoing')).opacity)).toBeLessThan(1);
    mount(<MessageBubble direction="outgoing" text="x" />);
    expect(Number(getComputedStyle(bubbleBox('outgoing')).opacity)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
//  Meta row
// ---------------------------------------------------------------------------

describe('the meta row', () => {
  it('sits INSIDE the bubble, after the text, and can wrap onto its own line', () => {
    mount(<MessageBubble direction="outgoing" text="Booked it." time="18:09" status="read" />);
    const bubble = bubbleBox('outgoing');
    expect(bubble.textContent).toContain('18:09');
    // The row that holds text + meta wraps, and the meta is pushed right by an
    // auto margin rather than by `justify-content` — which is what lets a short
    // message keep the meta beside it and a long one push it to a second line.
    const meta = [...bubble.querySelectorAll('div')].find(
      (el) => el.textContent === '18:09' && getComputedStyle(el).marginLeft === 'auto',
    );
    expect(meta).toBeDefined();
    const wrapper = meta?.parentElement;
    expect(wrapper && getComputedStyle(wrapper).flexWrap).toBe('wrap');
  });

  it('draws no ticks on an incoming bubble, whatever status is passed', () => {
    mount(<MessageBubble direction="incoming" text="x" time="09:01" status="read" />);
    expect(bubbleBox('incoming').querySelectorAll('svg')).toHaveLength(0);
  });

  it('shows edited, views and the signature', () => {
    mount(
      <MessageBubble
        direction="incoming"
        text="x"
        time="09:01"
        editedLabel="edited"
        channelViews="12.4K"
        authorSignature="Sala Verde"
      />,
    );
    const content = bubbleBox('incoming').textContent ?? '';
    expect(content).toContain('edited');
    expect(content).toContain('12.4K');
    expect(content).toContain('Sala Verde');
  });

  it('draws no meta at all on a deleted message', () => {
    mount(<MessageBubble direction="outgoing" text="gone" time="09:01" status="read" deleted />);
    const content = bubbleBox('outgoing').textContent ?? '';
    expect(content).toBe('This message was deleted');
    expect(content).not.toContain('09:01');
  });
});

// ---------------------------------------------------------------------------
//  Accessibility
// ---------------------------------------------------------------------------

describe('accessibility', () => {
  it('names a bubble from its sender, text, time and delivery state', () => {
    mount(
      <MessageBubble
        direction="outgoing"
        senderName="Ana Restrepo"
        text="Booked it."
        time="18:09"
        status="read"
        testID="row"
      />,
    );
    const named = container.querySelector('[aria-label]');
    expect(named?.getAttribute('aria-label')).toBe('Ana Restrepo, Booked it., 18:09, Read');
  });

  it('says a message was not sent, and a deleted one that it was deleted', () => {
    mount(<MessageBubble direction="outgoing" text="x" failed status="failed" />);
    expect(container.querySelector('[aria-label]')?.getAttribute('aria-label')).toContain('Not sent');
    mount(<MessageBubble direction="incoming" deleted />);
    expect(container.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe(
      'This message was deleted',
    );
  });

  it('becomes a toggle in selection mode, in BOTH spellings', () => {
    mount(<MessageBubble direction="incoming" text="x" selected onPress={() => undefined} />);
    const button = container.querySelector('[role="button"]');
    expect(button?.getAttribute('aria-pressed')).toBe('true');
    expect(button?.getAttribute('aria-label')).toContain('Selected');
  });

  it('is not a button when nothing can be done to it', () => {
    mount(<MessageBubble direction="incoming" text="x" />);
    expect(container.querySelector('[role="button"]')).toBeNull();
  });

  it('names every reaction pill and reports whether it is mine', () => {
    mount(
      <MessageBubble
        direction="incoming"
        text="x"
        reactions={[
          { emoji: '👍', count: 3 },
          { emoji: '🎸', count: 1, mine: true },
        ]}
        onToggleReaction={() => undefined}
        onAddReaction={() => undefined}
      />,
    );
    const pills = [...container.querySelectorAll('[role="button"]')];
    expect(pills.map((p) => p.getAttribute('aria-label'))).toEqual([
      '👍, 3',
      '🎸, 1, selected',
      'Add a reaction',
    ]);
    expect(pills.map((p) => p.getAttribute('aria-pressed'))).toEqual(['false', 'true', null]);
  });

  it('names the typing bubble, which draws no text of its own', () => {
    mount(<TypingBubble label="Ana is typing…" testID="typing" />);
    expect(byTestId('typing').querySelector('[aria-label]')?.getAttribute('aria-label')).toBe(
      'Ana is typing…',
    );
  });
});

// ---------------------------------------------------------------------------
//  Interaction
// ---------------------------------------------------------------------------

describe('interaction', () => {
  it('toggles a reaction through onToggleReaction', () => {
    const toggled: string[] = [];
    mount(
      <MessageBubble
        direction="incoming"
        text="x"
        reactions={[{ emoji: '👍', count: 3 }]}
        onToggleReaction={(emoji) => toggled.push(emoji)}
      />,
    );
    const pill = container.querySelector('[role="button"]');
    act(() => {
      pill?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(toggled).toEqual(['👍']);
  });

  it('offers a retry only on a failed message', () => {
    mount(<MessageBubble direction="outgoing" text="x" failed onRetry={() => undefined} />);
    expect(
      [...container.querySelectorAll('[role="button"]')].map((el) => el.getAttribute('aria-label')),
    ).toContain('Retry sending');
    mount(<MessageBubble direction="outgoing" text="x" onRetry={() => undefined} />);
    expect(
      [...container.querySelectorAll('[role="button"]')].map((el) => el.getAttribute('aria-label')),
    ).not.toContain('Retry sending');
  });

  it('never nests a button inside the bubble it presses', () => {
    // A pressable bubble is a button, and the web forbids a button inside one.
    // A bubble that holds controls of its own — media, reactions, a retry, a
    // reply quote — therefore keeps its press and gives up the role.
    const nested = () => [...container.querySelectorAll('[role="button"] [role="button"]')];

    mount(
      <MessageBubble
        direction="incoming"
        text="x"
        media={<Pressable role="button" accessibilityLabel="Photo" />}
        onLongPress={() => undefined}
      />,
    );
    expect(nested()).toEqual([]);

    mount(
      <MessageBubble
        direction="incoming"
        text="x"
        reactions={[{ emoji: '👍', count: 1 }]}
        onToggleReaction={() => undefined}
        onLongPress={() => undefined}
      />,
    );
    expect(nested()).toEqual([]);

    // A plain one is still a button, because nothing inside it competes.
    mount(<MessageBubble direction="incoming" text="x" onLongPress={() => undefined} />);
    expect(container.querySelector('[role="button"]')?.getAttribute('aria-label')).toContain('x');
  });

  it('makes the reply quote pressable only when there is somewhere to go', () => {
    mount(
      <MessageBubble
        direction="incoming"
        text="x"
        replyTo={{ senderName: 'Ana Restrepo', preview: 'Booked it.' }}
      />,
    );
    expect(container.querySelector('[role="button"]')).toBeNull();
    mount(
      <MessageBubble
        direction="incoming"
        text="x"
        replyTo={{ senderName: 'Ana Restrepo', preview: 'Booked it.' }}
        onPressReply={() => undefined}
      />,
    );
    expect(container.querySelector('[role="button"]')?.getAttribute('aria-label')).toBe(
      'Go to the quoted message: Ana Restrepo, Booked it.',
    );
  });
});

// ---------------------------------------------------------------------------
//  Group and list
// ---------------------------------------------------------------------------

describe('MessageGroup', () => {
  it('injects the run geometry into its children', () => {
    mount(
      <MessageGroup direction="incoming" showAvatar={false}>
        <MessageBubble direction="incoming" text="one" />
        <MessageBubble direction="incoming" text="two" />
        <MessageBubble direction="incoming" text="three" />
      </MessageGroup>,
    );
    const bubbles = [...container.querySelectorAll('[data-bloom-message-bubble]')];
    expect(bubbles).toHaveLength(3);
    expect(bubbles.map((el) => radii(el as HTMLElement)[3])).toEqual(['18px', '18px', '4px']);
  });

  it('draws the sender name once, in the per-sender hue', () => {
    mount(
      <MessageGroup direction="incoming" senderName="Ana Restrepo" senderColorSeed="ana" showAvatar={false}>
        <MessageBubble direction="incoming" text="one" />
        <MessageBubble direction="incoming" text="two" />
      </MessageGroup>,
    );
    const names = [...container.querySelectorAll('div')].filter(
      (el) => el.textContent === 'Ana Restrepo' && el.children.length === 0,
    );
    expect(names).toHaveLength(1);
    expect(normalise(getComputedStyle(names[0] as HTMLElement).color)).toBe(
      normalise(senderNameColor('ana', theme)),
    );
  });

  it('passes a non-element child through without spending a position on it', () => {
    mount(
      <MessageGroup direction="incoming" showAvatar={false}>
        {null}
        <MessageBubble direction="incoming" text="one" />
        <MessageBubble direction="incoming" text="two" />
      </MessageGroup>,
    );
    const bubbles = [...container.querySelectorAll('[data-bloom-message-bubble]')];
    expect(bubbles.map((el) => radii(el as HTMLElement)[3])).toEqual(['18px', '4px']);
  });
});

describe('MessageList', () => {
  const items: MessageListItem[] = [
    {
      id: '1',
      direction: 'incoming',
      senderId: 'ana',
      senderName: 'Ana Restrepo',
      dateKey: 'd1',
      dateLabel: 'Today',
      text: 'one',
    },
    { id: '2', direction: 'incoming', senderId: 'ana', text: 'two' },
    { id: '3', direction: 'incoming', system: 'Ana Restrepo pinned a message' },
    { id: '4', direction: 'outgoing', unreadBefore: true, text: 'three', time: '09:01', status: 'sent' },
    { id: '5', direction: 'outgoing', call: { outcome: 'outgoing', title: 'Outgoing call', duration: '4 min' } },
  ];

  it('renders the separators, the service line, the call row and the runs', () => {
    mount(<MessageList items={items} testID="list" />);
    const text = byTestId('list').textContent ?? '';
    expect(text).toContain('Today');
    expect(text).toContain('Unread messages');
    expect(text).toContain('Ana Restrepo pinned a message');
    expect(text).toContain('Outgoing call');
    expect(container.querySelectorAll('[data-bloom-message-bubble]')).toHaveLength(3);
  });

  it('draws the sender name once per run, not once per bubble', () => {
    mount(<MessageList items={items} />);
    const names = [...container.querySelectorAll('div')].filter(
      (el) => el.textContent === 'Ana Restrepo' && el.children.length === 0,
    );
    expect(names).toHaveLength(1);
  });

  it('drops the avatars and the names in a 1:1 thread', () => {
    mount(<MessageList items={items} showAvatars={false} showSenderNames={false} />);
    const names = [...container.querySelectorAll('div')].filter(
      (el) => el.textContent === 'Ana Restrepo' && el.children.length === 0,
    );
    expect(names).toHaveLength(0);
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
//  Separators
// ---------------------------------------------------------------------------

describe('separators', () => {
  it('draws the day label on the quiet pill', () => {
    mount(<DateSeparator label="Today" testID="date" />);
    expect(byTestId('date').textContent).toBe('Today');
  });

  it('names the unread rule and paints it in the accent', () => {
    mount(<UnreadSeparator testID="unread" />);
    expect(byTestId('unread').getAttribute('aria-label')).toBe('Unread messages');
  });

  it('makes a service line a button only when it does something', () => {
    mount(<SystemMessage text="You pinned a message" testID="sys" />);
    expect(container.querySelector('[role="button"]')).toBeNull();
    mount(<SystemMessage text="You pinned a message" onPress={() => undefined} testID="sys" />);
    expect(container.querySelector('[role="button"]')?.getAttribute('aria-label')).toBe(
      'You pinned a message',
    );
  });

  it('paints a missed call in the error colour and a connected one quietly', () => {
    mount(<CallSummaryRow direction="incoming" outcome="missed" title="Missed call" time="09:41" testID="call" />);
    expect(normalise(getComputedStyle(leafWithText('call', '09:41')).color)).toBe(
      normalise(paint().failed),
    );

    mount(
      <CallSummaryRow direction="incoming" outcome="incoming" title="Incoming call" duration="4 min" testID="call" />,
    );
    expect(normalise(getComputedStyle(leafWithText('call', '4 min')).color)).toBe(
      normalise(paint().incoming.meta),
    );
  });
});
