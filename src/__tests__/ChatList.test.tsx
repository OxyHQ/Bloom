/**
 * @jest-environment jsdom
 *
 * `chat-list`, rendered through the REAL react-native-web so the assertions read
 * the emitted DOM: the row geometry, the painted colours and the accessibility
 * ATTRIBUTES. A prop-level test cannot see `accessibilityState` being dropped on
 * web, and it cannot see a `role="tab"` that announces no selection — which is
 * the defect class a list of tabs, links and badges is most exposed to.
 *
 * The pure helpers (`highlightRuns`, `sortStories`, `groupSearchResults`,
 * `composeChatRowName`) are asserted directly: they are where the ORDER and the
 * offsets live, and a rendered string cannot tell a stable sort from a lucky one.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  ArchivedRow,
  ChatFolderTabs,
  ChatList,
  ChatListItem,
  ChatSearchResults,
  GroupAvatar,
  HighlightedText,
  StoriesRow,
  groupSearchResults,
  highlightRuns,
  sortStories,
} from '../chat-list';
import {
  CHAT_ROW_GEOMETRY,
  DEFAULT_ITEM_LABELS,
  composeChatRowName,
  previewSummary,
  resolveChatListPaint,
} from '../chat-list/shared';
import type { ChatSearchResult, ChatSummary, ChatSwipeActions } from '../chat-list/types';

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

function maybe(id: string): HTMLElement | null {
  const el = container.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

/** jsdom reports colours as `rgb(r, g, b)`; theme values arrive as `rgb(r g b)`. */
function normalise(color: string): string {
  const m = color.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) return color;
  return `rgb(${Number(m[0])}, ${Number(m[1])}, ${Number(m[2])})`;
}

const paint = () => resolveChatListPaint(theme);

const SWIPE: ChatSwipeActions = {
  left: [{ key: 'archive', label: 'Archive', icon: RiArchiveLine, tone: 'accent' }],
  right: [{ key: 'delete', label: 'Delete', icon: RiDeleteBinLine, tone: 'negative' }],
};

// ---------------------------------------------------------------------------
//  Pure helpers
// ---------------------------------------------------------------------------

describe('highlightRuns', () => {
  it('returns one unmatched run for an empty or whitespace query', () => {
    expect(highlightRuns('Mirela', '')).toEqual([{ text: 'Mirela', match: false }]);
    expect(highlightRuns('Mirela', '   ')).toEqual([{ text: 'Mirela', match: false }]);
  });

  it('marks EVERY occurrence, ignoring case', () => {
    expect(highlightRuns('flat, Flat, FLAT', 'flat').filter((run) => run.match)).toHaveLength(3);
  });

  it('folds accents but slices the ORIGINAL text', () => {
    // The whole reason the offsets are mapped rather than assumed: folding drops
    // a combining mark, so "jose" is 4 folded characters over 4 source ones here
    // but the match must still come back spelled "José".
    const runs = highlightRuns('José Ferrer', 'jose');
    expect(runs.find((run) => run.match)?.text).toBe('José');
    expect(runs.map((run) => run.text).join('')).toBe('José Ferrer');
  });

  it('always concatenates back to the input', () => {
    for (const [text, query] of [
      ['Flat 4B', 'fl'],
      ['Flat 4B', 'B'],
      ['Flat 4B', 'zzz'],
      ['', 'a'],
    ] as const) {
      expect(highlightRuns(text, query).map((run) => run.text).join('')).toBe(text);
    }
  });
});

describe('sortStories', () => {
  it('puts unseen first and is STABLE inside each half', () => {
    const order = sortStories([
      { id: 'a', name: 'A', state: 'seen' },
      { id: 'b', name: 'B', state: 'unseen' },
      { id: 'c', name: 'C', state: 'seen' },
      { id: 'd', name: 'D' },
      { id: 'e', name: 'E', state: 'none' },
    ]).map((story) => story.id);
    // `d` has no state and defaults to unseen; `none` counts as seen.
    expect(order).toEqual(['b', 'd', 'a', 'c', 'e']);
  });

  it('never mutates its input', () => {
    const input = [
      { id: 'a', name: 'A', state: 'seen' as const },
      { id: 'b', name: 'B', state: 'unseen' as const },
    ];
    sortStories(input);
    expect(input.map((story) => story.id)).toEqual(['a', 'b']);
  });
});

describe('groupSearchResults', () => {
  const results: ChatSearchResult[] = [
    { id: '1', kind: 'contact', name: 'C1' },
    { id: '2', kind: 'chat', name: 'H1' },
    { id: '3', kind: 'chat', name: 'H2' },
  ];

  it('orders the groups chats, messages, contacts and keeps input order inside', () => {
    expect(groupSearchResults(results).map((group) => group.kind)).toEqual(['chat', 'contact']);
    expect(groupSearchResults(results)[0]?.results.map((r) => r.id)).toEqual(['2', '3']);
  });

  it('drops an empty group rather than printing a heading over nothing', () => {
    expect(groupSearchResults(results).some((group) => group.kind === 'message')).toBe(false);
  });
});

describe('previewSummary and composeChatRowName', () => {
  it('leads a draft with the draft label and a sender with a colon', () => {
    expect(previewSummary({ draft: true, text: 'see you' }, DEFAULT_ITEM_LABELS)).toBe(
      'Draft: see you',
    );
    expect(previewSummary({ sender: 'You', text: 'on my way' }, DEFAULT_ITEM_LABELS)).toBe(
      'You: on my way',
    );
    expect(
      previewSummary(
        { attachment: { kind: 'voice', label: 'Voice message 0:12' } },
        DEFAULT_ITEM_LABELS,
      ),
    ).toBe('Voice message 0:12');
  });

  it('says every state the glyphs carry, in reading order', () => {
    expect(
      composeChatRowName(
        {
          name: 'Ana Ferrer',
          markerLabel: 'Verified',
          preview: { draft: true, text: 'see you' },
          time: '12:41',
          unreadCount: 3,
          muted: true,
          pinned: true,
        },
        DEFAULT_ITEM_LABELS,
        (count) => `${count} unread messages`,
      ),
    ).toBe('Ana Ferrer, Verified, Draft: see you, 12:41, 3 unread messages, Muted, Pinned');
  });

  it('never announces delivery ticks and an unread badge together', () => {
    const withUnread = composeChatRowName(
      { name: 'A', unreadCount: 2, outgoingStatus: 'read' },
      DEFAULT_ITEM_LABELS,
      () => '2 unread messages',
    );
    expect(withUnread).toContain('2 unread messages');
    expect(withUnread).not.toContain('Read');

    const withStatus = composeChatRowName(
      { name: 'A', outgoingStatus: 'read' },
      DEFAULT_ITEM_LABELS,
      () => 'x',
    );
    expect(withStatus).toBe('A, Read');
  });
});

// ---------------------------------------------------------------------------
//  ChatListItem
// ---------------------------------------------------------------------------

describe('ChatListItem geometry', () => {
  it('is 72 tall comfortable and 56 compact, with a 48 / 36 avatar', () => {
    for (const density of ['comfortable', 'compact'] as const) {
      mount(<ChatListItem name="Ana" density={density} testID="row" />);
      const geo = CHAT_ROW_GEOMETRY[density];
      expect(parseFloat(getComputedStyle(byTestId('row')).height)).toBe(geo.height);
      const avatar = byTestId('row-avatar');
      expect(parseFloat(getComputedStyle(avatar).width)).toBeGreaterThanOrEqual(geo.avatar);
    }
  });

  it('paints no inline background on web, so the hover rule can win', () => {
    // An inline `background-color` outranks an adopted stylesheet rule, which
    // would leave every row inert under the pointer while the CSS looked right.
    mount(<ChatListItem name="Ana" selected testID="row" />);
    expect(byTestId('row').style.backgroundColor).toBe('');
    expect(byTestId('row').style.getPropertyValue('--bloom-chat-selected')).not.toBe('');
    expect(byTestId('row').style.getPropertyValue('--bloom-chat-hover')).not.toBe('');
  });
});

describe('ChatListItem preview variants', () => {
  it('draws a draft prefix in the negative colour and in italic', () => {
    mount(<ChatListItem name="Ana" preview={{ draft: true, text: 'see you' }} testID="row" />);
    const line = byTestId('row-preview');
    const prefix = line.firstElementChild as HTMLElement;
    expect(prefix.textContent).toBe('Draft: ');
    expect(getComputedStyle(prefix).fontStyle).toBe('italic');
    expect(normalise(getComputedStyle(prefix).color)).toBe(normalise(paint().negative));
    expect(line.textContent).toBe('Draft: see you');
  });

  it('draws a sender prefix, and only when there is no draft', () => {
    mount(<ChatListItem name="Ana" preview={{ sender: 'You', text: 'on my way' }} testID="row" />);
    expect(byTestId('row-preview').textContent).toBe('You: on my way');

    mount(
      <ChatListItem
        name="Ana"
        preview={{ sender: 'You', draft: true, text: 'on my way' }}
        testID="row"
      />,
    );
    expect(byTestId('row-preview').textContent).toBe('Draft: on my way');
  });

  it('draws an attachment glyph beside the label, and hides the glyph on a draft', () => {
    mount(
      <ChatListItem
        name="Ana"
        preview={{ attachment: { kind: 'voice', label: 'Voice message 0:12' } }}
        testID="row"
      />,
    );
    expect(byTestId('row-attachment')).toBeTruthy();
    expect(byTestId('row-preview').textContent).toBe('Voice message 0:12');

    mount(
      <ChatListItem
        name="Ana"
        preview={{ draft: true, attachment: { kind: 'voice', label: 'Voice' }, text: 'hi' }}
        testID="row"
      />,
    );
    expect(maybe('row-attachment')).toBeNull();
  });

  it('replaces the preview entirely with the typing line', () => {
    mount(
      <ChatListItem
        name="Ana"
        typingLabel="typing…"
        preview={{ text: 'never drawn' }}
        testID="row"
      />,
    );
    expect(maybe('row-preview')).toBeNull();
    expect(byTestId('row-typing').textContent).toContain('typing…');
  });

  it('turns the name semibold only while something is unread', () => {
    mount(<ChatListItem name="Ana" testID="row" />);
    const read = getComputedStyle(byTestId('row-name')).fontWeight;
    mount(<ChatListItem name="Ana" unreadCount={1} testID="row" />);
    const unread = getComputedStyle(byTestId('row-name')).fontWeight;
    expect(Number(unread)).toBeGreaterThan(Number(read));
  });
});

describe('ChatListItem unread vs delivery status', () => {
  it('draws the badge and NOT the ticks when there is anything unread', () => {
    mount(<ChatListItem name="Ana" unreadCount={3} outgoingStatus="read" testID="row" />);
    expect(byTestId('row-unread')).toBeTruthy();
    expect(maybe('row-status')).toBeNull();
  });

  it('counts a dot with no number as unread', () => {
    mount(<ChatListItem name="Ana" unreadDot outgoingStatus="read" testID="row" />);
    expect(byTestId('row-unread')).toBeTruthy();
    expect(maybe('row-status')).toBeNull();
  });

  it('draws the ticks once nothing is unread', () => {
    mount(<ChatListItem name="Ana" unreadCount={0} outgoingStatus="delivered" testID="row" />);
    expect(maybe('row-unread')).toBeNull();
    expect(byTestId('row-status')).toBeTruthy();
  });

  it('tints the time accent while unread, and never on a muted chat', () => {
    mount(<ChatListItem name="Ana" time="12:41" unreadCount={2} testID="row" />);
    expect(normalise(getComputedStyle(byTestId('row-time')).color)).toBe(normalise(paint().accent));
    mount(<ChatListItem name="Ana" time="12:41" unreadCount={2} muted testID="row" />);
    expect(normalise(getComputedStyle(byTestId('row-time')).color)).toBe(
      normalise(paint().textMuted),
    );
  });
});

describe('ChatListItem accessibility', () => {
  it('is ONE target carrying the whole row, with the content hidden', () => {
    mount(
      <ChatListItem
        name="Ana Ferrer"
        verified
        preview={{ draft: true, text: 'see you' }}
        time="12:41"
        unreadCount={3}
        muted
        pinned
        onPress={() => undefined}
        testID="row"
      />,
    );
    const link = byTestId('row-link');
    expect(link.getAttribute('role')).toBe('button');
    expect(link.getAttribute('aria-label')).toBe(
      'Ana Ferrer, Verified, Draft: see you, 12:41, 3 unread messages, Muted, Pinned',
    );
    // The avatar, the two lines and the badges must not announce themselves a
    // second time under the row that already said all of it.
    const content = byTestId('row-name').closest('[aria-hidden="true"]');
    expect(content).not.toBeNull();
  });

  it('is a link when given an href, and marks the open one with aria-current', () => {
    mount(<ChatListItem name="Ana" href="/chats/ana" selected testID="row" />);
    const link = byTestId('row-link');
    expect(link.getAttribute('role')).toBe('link');
    expect(link.getAttribute('href')).toBe('/chats/ana');
    expect(link.getAttribute('aria-current')).toBe('true');
  });

  it('takes a caller name whole, for a row that says it differently', () => {
    mount(<ChatListItem name="Ana" accessibilityLabel="Ana, 3 nuevos" onPress={() => undefined} testID="row" />);
    expect(byTestId('row-link').getAttribute('aria-label')).toBe('Ana, 3 nuevos');
  });

  it('is not a control at all without a press handler or an href', () => {
    mount(<ChatListItem name="Ana" testID="row" />);
    expect(byTestId('row-link').getAttribute('role')).toBeNull();
  });
});

describe('ChatListItem actions', () => {
  it('renders the hover buttons on web, named, and reports the key it was given', () => {
    const calls: string[] = [];
    mount(
      <ChatListItem
        name="Ana"
        swipeActions={SWIPE}
        onAction={(key) => calls.push(key)}
        testID="row"
      />,
    );
    const archive = byTestId('row-action-archive');
    expect(archive.getAttribute('role')).toBe('button');
    expect(archive.getAttribute('aria-label')).toBe('Archive');
    act(() => archive.click());
    act(() => byTestId('row-action-delete').click());
    expect(calls).toEqual(['archive', 'delete']);
  });

  it('calls the action own handler as well as the row callback', () => {
    const own = jest.fn();
    const row = jest.fn();
    mount(
      <ChatListItem
        name="Ana"
        swipeActions={{ right: [{ key: 'mute', label: 'Mute', icon: RiArchiveLine, onPress: own }] }}
        onAction={row}
        testID="row"
      />,
    );
    act(() => byTestId('row-action-mute').click());
    expect(own).toHaveBeenCalledTimes(1);
    expect(row).toHaveBeenCalledWith('mute');
  });

  it('draws no action affordance when the row has none', () => {
    mount(<ChatListItem name="Ana" testID="row" />);
    expect(maybe('row-actions')).toBeNull();
  });

  it('renders the swipe panes instead once the gesture is enabled', () => {
    const calls: string[] = [];
    mount(
      <ChatListItem
        name="Ana"
        swipeActions={SWIPE}
        swipeEnabled
        onAction={(key) => calls.push(key)}
        testID="row"
      />,
    );
    const pane = byTestId('row-swipe-action-delete');
    expect(pane.getAttribute('aria-label')).toBe('Delete');
    act(() => pane.click());
    expect(calls).toEqual(['delete']);
  });
});

// ---------------------------------------------------------------------------
//  GroupAvatar
// ---------------------------------------------------------------------------

describe('GroupAvatar', () => {
  it('draws one face per entry, up to four', () => {
    for (const [count, drawn] of [
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
      [7, 4],
    ] as const) {
      mount(
        <GroupAvatar
          size={48}
          faces={Array.from({ length: count }, (_, i) => ({ name: `P${i}` }))}
          testID="cluster"
        />,
      );
      expect(container.querySelectorAll('[data-testid^="cluster-face-"]').length).toBe(drawn);
    }
  });

  it('keeps the cluster inside its declared size', () => {
    mount(<GroupAvatar size={48} faces={[{ name: 'A' }, { name: 'B' }, { name: 'C' }]} testID="cluster" />);
    const box = byTestId('cluster');
    expect(parseFloat(getComputedStyle(box).width)).toBe(48);
    expect(parseFloat(getComputedStyle(box).height)).toBe(48);
  });

  it('is decorative unless it is named', () => {
    mount(<GroupAvatar size={48} faces={[{ name: 'A' }, { name: 'B' }]} testID="cluster" />);
    expect(byTestId('cluster').getAttribute('aria-hidden')).toBe('true');
    mount(
      <GroupAvatar size={48} faces={[{ name: 'A' }, { name: 'B' }]} accessibilityLabel="Flat 4B" testID="cluster" />,
    );
    expect(byTestId('cluster').getAttribute('aria-hidden')).toBeNull();
    expect(byTestId('cluster').getAttribute('aria-label')).toBe('Flat 4B');
  });
});

// ---------------------------------------------------------------------------
//  ChatFolderTabs
// ---------------------------------------------------------------------------

describe('ChatFolderTabs', () => {
  const FOLDERS = [
    { key: 'all', label: 'All', unreadCount: 15 },
    { key: 'unread', label: 'Unread', unreadCount: 4 },
    { key: 'bots', label: 'Bots' },
  ];

  it('is a named tablist of tabs that spell their selection BOTH ways web and native read', () => {
    mount(<ChatFolderTabs folders={FOLDERS} value="unread" accessibilityLabel="Chat folders" testID="tabs" />);
    const list = container.querySelector('[role="tablist"]');
    expect(list?.getAttribute('aria-label')).toBe('Chat folders');
    expect(byTestId('tabs-tab-unread').getAttribute('aria-selected')).toBe('true');
    expect(byTestId('tabs-tab-all').getAttribute('aria-selected')).toBe('false');
    for (const folder of FOLDERS) {
      expect(byTestId(`tabs-tab-${folder.key}`).getAttribute('role')).toBe('tab');
    }
  });

  it('puts the count in the tab NAME, because the badge is a bare number', () => {
    mount(<ChatFolderTabs folders={FOLDERS} accessibilityLabel="Chat folders" testID="tabs" />);
    expect(byTestId('tabs-tab-unread').getAttribute('aria-label')).toBe('Unread, 4 unread');
    expect(byTestId('tabs-tab-bots').getAttribute('aria-label')).toBe('Bots');
  });

  it('draws a badge only for a folder with a count, and hides it from the reader', () => {
    mount(<ChatFolderTabs folders={FOLDERS} accessibilityLabel="Chat folders" testID="tabs" />);
    expect(byTestId('tabs-count-all').textContent).toBe('15');
    expect(maybe('tabs-count-bots')).toBeNull();
    expect(byTestId('tabs-count-all').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('underlines the selected tab in the accent and nothing else', () => {
    mount(<ChatFolderTabs folders={FOLDERS} value="all" accessibilityLabel="Chat folders" testID="tabs" />);
    expect(normalise(getComputedStyle(byTestId('tabs-tab-all')).borderBottomColor)).toBe(
      normalise(paint().accent),
    );
    expect(getComputedStyle(byTestId('tabs-tab-bots')).borderBottomColor).toMatch(
      /transparent|rgba\(0, 0, 0, 0\)/,
    );
  });

  it('selects uncontrolled and reports every press', () => {
    const calls: string[] = [];
    mount(
      <ChatFolderTabs
        folders={FOLDERS}
        onValueChange={(key) => calls.push(key)}
        accessibilityLabel="Chat folders"
        testID="tabs"
      />,
    );
    // No `value` and no `defaultValue`: the first folder starts selected.
    expect(byTestId('tabs-tab-all').getAttribute('aria-selected')).toBe('true');
    act(() => byTestId('tabs-tab-bots').click());
    expect(calls).toEqual(['bots']);
    expect(byTestId('tabs-tab-bots').getAttribute('aria-selected')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
//  StoriesRow
// ---------------------------------------------------------------------------

describe('StoriesRow', () => {
  const STORIES = [
    { id: 'a', name: 'Ana', state: 'seen' as const },
    { id: 'b', name: 'Bru', state: 'unseen' as const },
  ];

  it('puts your own entry first and the unseen stories before the seen', () => {
    mount(
      <StoriesRow stories={STORIES} own={{}} onStoryPress={() => undefined} testID="stories" />,
    );
    const rendered = [...container.querySelectorAll('[data-testid^="stories-"]')].map((el) =>
      el.getAttribute('data-testid'),
    );
    expect(rendered).toEqual(['stories-own', 'stories-story-b', 'stories-story-a']);
  });

  it('keeps the app order when seenLast is off', () => {
    mount(<StoriesRow stories={STORIES} seenLast={false} testID="stories" />);
    const rendered = [...container.querySelectorAll('[data-testid^="stories-story-"]')].map((el) =>
      el.getAttribute('data-testid'),
    );
    expect(rendered).toEqual(['stories-story-a', 'stories-story-b']);
  });

  it('names each ring and the add affordance, and reports presses by id', () => {
    const pressed: string[] = [];
    mount(
      <StoriesRow
        stories={STORIES}
        own={{}}
        onStoryPress={(id) => pressed.push(id)}
        onOwnPress={() => pressed.push('own')}
        testID="stories"
      />,
    );
    expect(byTestId('stories-own').getAttribute('aria-label')).toBe('Add to your story');
    expect(byTestId('stories-story-a').getAttribute('aria-label')).toBe("Ana's story");
    act(() => byTestId('stories-story-a').click());
    act(() => byTestId('stories-own').click());
    expect(pressed).toEqual(['a', 'own']);
  });

  it('names the strip as a list', () => {
    mount(<StoriesRow stories={STORIES} testID="stories" />);
    expect(container.querySelector('[role="list"]')?.getAttribute('aria-label')).toBe('Stories');
  });
});

// ---------------------------------------------------------------------------
//  HighlightedText
// ---------------------------------------------------------------------------

describe('HighlightedText', () => {
  it('paints the matched run in the accent and leaves the rest alone', () => {
    mount(<HighlightedText text="Flat 4B" query="fla" testID="hit" />);
    const el = byTestId('hit');
    expect(el.textContent).toBe('Flat 4B');
    const marked = el.querySelector('*') as HTMLElement;
    expect(marked.textContent).toBe('Fla');
    expect(normalise(getComputedStyle(marked).color)).toBe(normalise(paint().accent));
  });

  it('adds no band unless one is asked for', () => {
    mount(<HighlightedText text="Flat" query="fl" testID="hit" />);
    const marked = byTestId('hit').querySelector('*') as HTMLElement;
    expect(marked.style.backgroundColor).toBe('');
  });
});

// ---------------------------------------------------------------------------
//  ChatSearchResults
// ---------------------------------------------------------------------------

describe('ChatSearchResults', () => {
  const RESULTS: ChatSearchResult[] = [
    { id: 'c1', kind: 'contact', name: 'Flavia', detail: 'last seen recently' },
    { id: 'h1', kind: 'chat', name: 'Flat 4B', detail: 'Who is cooking?', time: '12:04' },
    { id: 'm1', kind: 'message', name: 'Darío', detail: 'the flat viewing is at six' },
  ];

  it('renders one heading per non-empty group, in order', () => {
    mount(<ChatSearchResults query="fla" results={RESULTS} testID="results" />);
    expect(byTestId('results-heading-chat').textContent).toBe('Chats');
    expect(byTestId('results-heading-message').textContent).toBe('Messages');
    expect(byTestId('results-heading-contact').textContent).toBe('Contacts');
  });

  it('highlights the query in both the name and the detail', () => {
    mount(<ChatSearchResults query="fla" results={RESULTS} testID="results" />);
    expect(byTestId('results-result-h1-name').querySelector('*')?.textContent).toBe('Fla');
    expect(byTestId('results-result-m1-detail').querySelector('*')?.textContent).toBe('fla');
  });

  it('names each row with everything it draws and reports the press by id', () => {
    const pressed: string[] = [];
    mount(
      <ChatSearchResults
        query="fla"
        results={RESULTS}
        onResultPress={(id) => pressed.push(id)}
        testID="results"
      />,
    );
    expect(byTestId('results-result-h1-link').getAttribute('aria-label')).toBe(
      'Flat 4B, Who is cooking?, 12:04',
    );
    act(() => byTestId('results-result-h1-link').click());
    expect(pressed).toEqual(['h1']);
  });

  it('says so when nothing matched, rather than printing empty headings', () => {
    mount(<ChatSearchResults query="zzz" results={[]} testID="results" />);
    expect(byTestId('results-empty').textContent).toBe('No results');
    expect(maybe('results-heading-chat')).toBeNull();
  });

  it('announces loading ONCE on the region, with the placeholders hidden', () => {
    mount(<ChatSearchResults query="" results={[]} loading loadingCount={3} testID="results" />);
    expect(byTestId('results').getAttribute('aria-busy')).toBe('true');
    expect(byTestId('results-skeleton').getAttribute('aria-hidden')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
//  ChatList and ArchivedRow
// ---------------------------------------------------------------------------

describe('ChatList', () => {
  const CHATS: ChatSummary[] = [
    { id: 'a', name: 'Ana', time: '12:41', unreadCount: 2 },
    { id: 'b', name: 'Bru', time: 'Mon' },
  ];

  it('renders a section heading and a nested named list per section', () => {
    mount(
      <ChatList
        sections={[{ key: 'pinned', title: 'Pinned', chats: CHATS.slice(0, 1) }, { key: 'all', title: 'All', chats: CHATS.slice(1) }]}
        testID="list"
      />,
    );
    expect(byTestId('list-heading-pinned').textContent).toBe('Pinned');
    const lists = [...container.querySelectorAll('[role="list"]')].map((el) =>
      el.getAttribute('aria-label'),
    );
    expect(lists).toEqual(['Chats', 'Pinned', 'All']);
  });

  it('routes press, long press and actions with the chat id', () => {
    const pressed: string[] = [];
    const actions: string[] = [];
    mount(
      <ChatList
        chats={[{ ...CHATS[0]!, swipeActions: SWIPE }]}
        onChatPress={(id) => pressed.push(id)}
        onChatAction={(key, id) => actions.push(`${key}:${id}`)}
        testID="list"
      />,
    );
    act(() => byTestId('list-chat-a-link').click());
    act(() => byTestId('list-chat-a-action-archive').click());
    expect(pressed).toEqual(['a']);
    expect(actions).toEqual(['archive:a']);
  });

  it('marks exactly the selected chat', () => {
    mount(<ChatList chats={CHATS} selectedId="b" testID="list" />);
    expect(byTestId('list-chat-b-link').getAttribute('aria-current')).toBe('true');
    expect(byTestId('list-chat-a-link').getAttribute('aria-current')).toBeNull();
  });

  it('shows the built-in empty state, and a caller one instead when given', () => {
    mount(<ChatList chats={[]} testID="list" />);
    expect(byTestId('list-empty').textContent).toContain('No conversations yet');
    mount(<ChatList chats={[]} labels={{ emptyTitle: 'Nada aún' }} testID="list" />);
    expect(byTestId('list-empty').textContent).toContain('Nada aún');
  });

  it('announces loading once and hides the placeholder rows', () => {
    mount(<ChatList loading loadingCount={4} testID="list" />);
    expect(byTestId('list').getAttribute('aria-busy')).toBe('true');
    expect(byTestId('list-skeleton').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelectorAll('[data-testid^="list-skeleton-row-"]').length).toBe(4);
    expect(maybe('list-empty')).toBeNull();
  });

  it('pins the archive row above the sections', () => {
    mount(<ChatList chats={CHATS} archived={{ count: 6 }} testID="list" />);
    const archived = byTestId('list-archived');
    const first = byTestId('list-chat-a');
    expect(archived.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('ArchivedRow', () => {
  it('names itself with the count and draws it muted by default', () => {
    mount(<ArchivedRow count={6} onPress={() => undefined} testID="archived" />);
    expect(byTestId('archived-link').getAttribute('aria-label')).toBe('Archived, 6 chats');
    expect(byTestId('archived-count').textContent).toBe('6');
  });

  it('drops the badge at zero and says only the label', () => {
    mount(<ArchivedRow onPress={() => undefined} testID="archived" />);
    expect(maybe('archived-count')).toBeNull();
    expect(byTestId('archived-link').getAttribute('aria-label')).toBe('Archived');
  });

  it('matches the chat row height at each density', () => {
    for (const density of ['comfortable', 'compact'] as const) {
      mount(<ArchivedRow count={2} density={density} testID="archived" />);
      expect(parseFloat(getComputedStyle(byTestId('archived')).height)).toBe(
        CHAT_ROW_GEOMETRY[density].height,
      );
    }
  });
});

// ---------------------------------------------------------------------------
//  Paint
// ---------------------------------------------------------------------------

describe('paint', () => {
  it('reads every colour off the theme, in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      mount(<ChatListItem name="Ana" testID="row" />, mode);
      const p = paint();
      expect(normalise(p.background)).toBe(normalise(theme.colors.background));
      expect(normalise(p.text)).toBe(normalise(theme.colors.text));
      // Hover and selected must be DISTINCT steps off the page, or a selected
      // row under the pointer is indistinguishable from any other.
      expect(p.hover).not.toBe(p.selected);
      expect(p.hover).not.toBe(p.background);
    }
  });
});
