/**
 * @jest-environment jsdom
 *
 * `chat-people` through the REAL react-native-web, so the assertions read the
 * emitted DOM rather than the props: the selection row's `role="checkbox"` and
 * its `aria-checked`, the alphabet rail's names, the role badges, and the two
 * pure functions that carry the arithmetic — `storyProgressFill` and
 * `nameCounterTone`.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

interface MotionState {
  reduced: boolean;
}
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  const g = globalThis as { __peopleMotion?: MotionState };
  const state = (g.__peopleMotion ??= { reduced: false });
  return {
    ...actual,
    __esModule: true,
    useReducedMotion: () => state.reduced,
  };
});

const motion = ((globalThis as { __peopleMotion?: MotionState }).__peopleMotion ??= {
  reduced: false,
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  ChannelPostCard,
  ContactList,
  ContactRow,
  MemberList,
  MemberRow,
  NewGroupForm,
  SelectedChipsRow,
  StoryProgressBars,
  StoryViewer,
  CONTACT_ALPHABET,
  contactSectionIndex,
  nameCounterTone,
  storyProgressFill,
  storyTapZone,
} from '../chat-people';
import { contactIndexLetters, memberBadgeLabel, MEMBER_LABELS } from '../chat-people/shared';
import type { ContactSection, MemberListItem } from '../chat-people/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
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
  motion.reduced = false;
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

function press(el: HTMLElement): void {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

const text = (el: HTMLElement): string => el.textContent ?? '';

const SECTIONS: ContactSection[] = [
  {
    letter: 'A',
    contacts: [
      { id: 'ana', name: 'Ana Restrepo', subtitle: 'online' },
      { id: 'ade', name: 'Adeola Bakare' },
    ],
  },
  { letter: 'K', contacts: [{ id: 'kofi', name: 'Kofi Mensah' }] },
  { letter: 'Z', contacts: [] },
];

// ---------------------------------------------------------------------------
//  ContactRow
// ---------------------------------------------------------------------------

describe('ContactRow', () => {
  it('renders application identity slots while retaining row naming and selection behavior', () => {
    const changes: boolean[] = [];
    mount(<ContactRow id="a" name="Ana Restrepo" subtitle="@ana@example.social"
      avatarSlot={<span data-testid="custom-avatar">Verified avatar</span>}
      identitySlot={<span data-testid="custom-identity">Ana · verified · example.social</span>}
      onSelectedChange={value => changes.push(value)} testID="r" />);
    expect(text(byTestId('custom-avatar'))).toContain('Verified avatar');
    expect(text(byTestId('custom-identity'))).toContain('example.social');
    expect(maybe('r-name')).toBeNull();
    expect(maybe('r-subtitle')).toBeNull();
    expect(byTestId('r-select').getAttribute('aria-label')).toBe('Ana Restrepo');
    press(byTestId('r-select'));
    expect(changes).toEqual([true]);
    expect(container.querySelectorAll('[role="checkbox"]').length).toBe(1);
  });

  it('supports intentionally empty slots without losing the accessible person name', () => {
    mount(<ContactRow id="a" name="Ana" subtitle="@ana" avatarSlot={null} identitySlot={null} onPress={() => undefined} testID="r" />);
    expect(maybe('r-name')).toBeNull();
    expect(maybe('r-subtitle')).toBeNull();
    expect(byTestId('r-open').getAttribute('aria-label')).toBe('Ana, @ana');
    expect(container.querySelector('[data-testid="r"] [role="img"]')).toBeNull();
  });

  it('derives the trailing affordance from the handlers it was given', () => {
    mount(<ContactRow id="a" name="Ana" onSelectedChange={() => undefined} testID="r" />);
    expect(maybe('r-checkbox')).not.toBeNull();
    expect(maybe('r-action')).toBeNull();

    mount(<ContactRow id="a" name="Ana" onAction={() => undefined} testID="r" />);
    expect(maybe('r-checkbox')).toBeNull();
    expect(maybe('r-action')).not.toBeNull();

    mount(<ContactRow id="a" name="Ana" testID="r" />);
    expect(maybe('r-checkbox')).toBeNull();
    expect(maybe('r-action')).toBeNull();
  });

  it('makes the ROW the checkbox — one role, not two', () => {
    mount(<ContactRow id="a" name="Ana Restrepo" selected onSelectedChange={() => undefined} testID="r" />);
    const row = byTestId('r-select');
    expect(row.getAttribute('role')).toBe('checkbox');
    expect(row.getAttribute('aria-checked')).toBe('true');
    expect(row.getAttribute('aria-label')).toBe('Ana Restrepo');
    // Exactly one checkbox in the subtree: nesting Bloom's `Checkbox` here would
    // announce the same control twice.
    expect(container.querySelectorAll('[role="checkbox"]').length).toBe(1);
  });

  it('emits the NEXT selected value', () => {
    const changes: boolean[] = [];
    mount(<ContactRow id="a" name="Ana" onSelectedChange={(n) => changes.push(n)} testID="r" />);
    press(byTestId('r-select'));
    expect(changes).toEqual([true]);
  });

  it('names a plain row with its subtitle, so the list reads as rows not names', () => {
    mount(
      <ContactRow id="a" name="Ana Restrepo" subtitle="last seen recently" onPress={() => undefined} testID="r" />,
    );
    expect(byTestId('r-open').getAttribute('aria-label')).toBe('Ana Restrepo, last seen recently');
  });

  it('swaps the action button for a quiet mark once it is done', () => {
    mount(<ContactRow id="a" name="Ana" actionLabel="Invite" onAction={() => undefined} testID="r" />);
    expect(text(byTestId('r-action'))).toContain('Invite');
    mount(
      <ContactRow id="a" name="Ana" actionLabel="Invite" actionDone onAction={() => undefined} testID="r" />,
    );
    expect(maybe('r-action')).toBeNull();
    expect(text(byTestId('r-action-done'))).toContain('Added');
  });

  it('reports disabled the way web reads it', () => {
    mount(<ContactRow id="a" name="Ana" disabled onPress={() => undefined} testID="r" />);
    expect(byTestId('r-open').getAttribute('aria-disabled')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
//  ContactList and the index rail
// ---------------------------------------------------------------------------

describe('contactIndexLetters / contactSectionIndex', () => {
  it('defaults the rail to the sections that exist, in their order', () => {
    expect(contactIndexLetters(SECTIONS)).toEqual(['A', 'K', 'Z']);
    expect(contactIndexLetters(SECTIONS, ['A', 'B'])).toEqual(['A', 'B']);
  });

  it('answers -1 for a letter with no section, so the rail can do nothing', () => {
    expect(contactSectionIndex(SECTIONS, 'K')).toBe(1);
    expect(contactSectionIndex(SECTIONS, 'Q')).toBe(-1);
  });

  it('puts # last in the default alphabet, where the thumb does not land', () => {
    expect(CONTACT_ALPHABET).toHaveLength(27);
    expect(CONTACT_ALPHABET[0]).toBe('A');
    expect(CONTACT_ALPHABET[26]).toBe('#');
  });
});

describe('ContactList', () => {
  it('drops an empty section from the list AND from the rail', () => {
    mount(<ContactList sections={SECTIONS} testID="l" />);
    expect(maybe('l-heading-A')).not.toBeNull();
    expect(maybe('l-heading-K')).not.toBeNull();
    expect(maybe('l-heading-Z')).toBeNull();
    expect(maybe('l-jump-Z')).toBeNull();
  });

  it('names every rail button by where it goes, and reports the jump', () => {
    const jumps: string[] = [];
    mount(<ContactList sections={SECTIONS} onJumpToLetter={(l) => jumps.push(l)} testID="l" />);
    expect(byTestId('l-jump-K').getAttribute('aria-label')).toBe('Jump to K');
    press(byTestId('l-jump-K'));
    expect(jumps).toEqual(['K']);
  });

  it('does NOT report a jump to a letter with no section', () => {
    const jumps: string[] = [];
    mount(
      <ContactList
        sections={SECTIONS}
        indexLetters={['A', 'Q']}
        onJumpToLetter={(l) => jumps.push(l)}
        testID="l"
      />,
    );
    press(byTestId('l-jump-Q'));
    expect(jumps).toEqual([]);
    press(byTestId('l-jump-A'));
    expect(jumps).toEqual(['A']);
  });

  it('hides the rail for a single section unless asked for', () => {
    mount(<ContactList sections={[SECTIONS[0] as ContactSection]} testID="l" />);
    expect(maybe('l-rail')).toBeNull();
    mount(<ContactList sections={[SECTIONS[0] as ContactSection]} showIndex testID="l" />);
    expect(maybe('l-rail')).not.toBeNull();
  });

  it('routes a row press and a selection change with the contact id', () => {
    const opened: string[] = [];
    const picked: [string, boolean][] = [];
    mount(
      <ContactList
        sections={SECTIONS}
        onContactPress={(id) => opened.push(id)}
        testID="l"
      />,
    );
    press(byTestId('l-contact-kofi-open'));
    expect(opened).toEqual(['kofi']);

    mount(
      <ContactList
        sections={SECTIONS}
        onContactSelectedChange={(id, next) => picked.push([id, next])}
        testID="l"
      />,
    );
    press(byTestId('l-contact-ana-select'));
    expect(picked).toEqual([['ana', true]]);
  });
});

// ---------------------------------------------------------------------------
//  SelectedChipsRow
// ---------------------------------------------------------------------------

describe('SelectedChipsRow', () => {
  const people = [
    { id: 'a', name: 'Ana Restrepo' },
    { id: 'b', name: 'Kofi Mensah' },
  ];

  it('names each × by the person it removes', () => {
    mount(<SelectedChipsRow people={people} onRemove={() => undefined} testID="c" />);
    expect(byTestId('c-chip-a-remove').getAttribute('aria-label')).toBe('Remove Ana Restrepo');
  });

  it('removes by id', () => {
    const removed: string[] = [];
    mount(<SelectedChipsRow people={people} onRemove={(id) => removed.push(id)} testID="c" />);
    press(byTestId('c-chip-b-remove'));
    expect(removed).toEqual(['b']);
  });

  it('renders nothing at all with nobody picked and no empty state', () => {
    mount(<SelectedChipsRow people={[]} testID="c" />);
    expect(maybe('c')).toBeNull();
  });

  it('drops the × entirely when there is no remove handler', () => {
    mount(<SelectedChipsRow people={people} testID="c" />);
    expect(maybe('c-chip-a-remove')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  NewGroupForm
// ---------------------------------------------------------------------------

describe('nameCounterTone', () => {
  it('warns BEFORE the limit, because the input stops at it', () => {
    expect(nameCounterTone(0, 64)).toBe('quiet');
    expect(nameCounterTone(57, 64)).toBe('quiet');
    expect(nameCounterTone(58, 64)).toBe('warn'); // 64 * 0.9 = 57.6
    expect(nameCounterTone(64, 64)).toBe('warn');
    expect(nameCounterTone(65, 64)).toBe('over');
    expect(nameCounterTone(3, 0)).toBe('quiet');
  });
});

describe('NewGroupForm', () => {
  it('draws the counter against the SAME number the input is capped at', () => {
    mount(
      <NewGroupForm name="Saturday" onNameChange={() => undefined} nameMaxLength={20} testID="f" />,
    );
    expect(text(byTestId('f-counter'))).toBe('8/20');
    const input = byTestId('f-name');
    expect(input.getAttribute('maxlength')).toBe('20');
  });

  it('names the photo picker — it draws a glyph and no text', () => {
    mount(
      <NewGroupForm name="" onNameChange={() => undefined} onPickPhoto={() => undefined} testID="f" />,
    );
    expect(byTestId('f-photo').getAttribute('aria-label')).toBe('Choose a group photo');
  });

  it('counts the members it was handed, and names each remove', () => {
    mount(
      <NewGroupForm
        name=""
        onNameChange={() => undefined}
        members={[{ id: 'a', name: 'Ana Restrepo' }]}
        onRemoveMember={() => undefined}
        testID="f"
      />,
    );
    expect(text(byTestId('f-members-title'))).toBe('1 member');
    expect(byTestId('f-remove-a').getAttribute('aria-label')).toBe('Remove Ana Restrepo');
  });
});

// ---------------------------------------------------------------------------
//  Members
// ---------------------------------------------------------------------------

describe('memberBadgeLabel', () => {
  it('badges owner and admin, and nobody else', () => {
    expect(memberBadgeLabel('owner', MEMBER_LABELS)).toBe('Owner');
    expect(memberBadgeLabel('admin', MEMBER_LABELS)).toBe('Admin');
    expect(memberBadgeLabel('member', MEMBER_LABELS)).toBeUndefined();
    expect(memberBadgeLabel(undefined, MEMBER_LABELS)).toBeUndefined();
    expect(memberBadgeLabel('owner', MEMBER_LABELS, 'Creator')).toBe('Creator');
  });
});

describe('MemberRow', () => {
  it('writes the role as a WORD, not only as a hue', () => {
    mount(<MemberRow id="a" name="Ana" role="owner" testID="r" />);
    expect(text(byTestId('r-role'))).toBe('Owner');
    mount(<MemberRow id="a" name="Ana" role="admin" testID="r" />);
    expect(text(byTestId('r-role'))).toBe('Admin');
    mount(<MemberRow id="a" name="Ana" testID="r" />);
    expect(maybe('r-role')).toBeNull();
  });

  it('paints owner and admin differently', () => {
    mount(<MemberRow id="a" name="Ana" role="owner" testID="r" />);
    const owner = getComputedStyle(byTestId('r-role')).backgroundColor;
    mount(<MemberRow id="a" name="Ana" role="admin" testID="r" />);
    expect(getComputedStyle(byTestId('r-role')).backgroundColor).not.toBe(owner);
  });

  it('carries the role into the row name', () => {
    mount(<MemberRow id="a" name="Ana Restrepo" role="admin" onPress={() => undefined} testID="r" />);
    expect(byTestId('r-open').getAttribute('aria-label')).toBe('Ana Restrepo, Admin');
  });

  it('shows the menu only when there is something in it', () => {
    mount(<MemberRow id="a" name="Ana" testID="r" />);
    expect(maybe('r-actions')).toBeNull();
    mount(<MemberRow id="a" name="Ana" onRemove={() => undefined} testID="r" />);
    expect(byTestId('r-actions').getAttribute('aria-label')).toBe('Actions for Ana');
  });

  it('lets a caller replace the trailing slot wholesale', () => {
    mount(
      <MemberRow
        id="a"
        name="Ana"
        onRemove={() => undefined}
        trailingSlot={<div data-testid="mine" />}
        testID="r"
      />,
    );
    expect(maybe('r-actions')).toBeNull();
    expect(maybe('mine')).not.toBeNull();
  });
});

describe('MemberList', () => {
  const members: MemberListItem[] = [
    { id: 'ana', name: 'Ana Restrepo', role: 'owner' },
    { id: 'kofi', name: 'Kofi Mensah' },
  ];

  it('draws the search field only with a handler, and never filters', () => {
    mount(<MemberList members={members} testID="l" />);
    expect(maybe('l-search')).toBeNull();
    mount(<MemberList members={members} search="zzz" onSearchChange={() => undefined} testID="l" />);
    expect(maybe('l-search')).not.toBeNull();
    // Both rows survive a search string the component was never asked to apply.
    expect(maybe('l-member-ana')).not.toBeNull();
    expect(maybe('l-member-kofi')).not.toBeNull();
  });

  it('routes every per-member action with the id', () => {
    const pressed: string[] = [];
    mount(<MemberList members={members} onMemberPress={(id) => pressed.push(id)} testID="l" />);
    press(byTestId('l-member-kofi-open'));
    expect(pressed).toEqual(['kofi']);
  });

  it('shows the empty state for a search that found nobody', () => {
    mount(<MemberList members={[]} emptyState={<div data-testid="none" />} testID="l" />);
    expect(maybe('none')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  ChannelPostCard
// ---------------------------------------------------------------------------

describe('ChannelPostCard', () => {
  it('draws the counts as given, and names each pair', () => {
    mount(
      <ChannelPostCard
        channelName="Coast Weather Watch"
        time="12:41"
        views="12.4K"
        forwards="318"
        testID="p"
      />,
    );
    expect(text(byTestId('p-views'))).toBe('12.4K');
    expect(byTestId('p-views').getAttribute('aria-label')).toBe('12.4K views');
    expect(byTestId('p-forwards').getAttribute('aria-label')).toBe('318 forwards');
  });

  it('draws the comments button from its own text', () => {
    mount(
      <ChannelPostCard channelName="C" time="12:41" comments="128 comments" onComments={() => undefined} testID="p" />,
    );
    expect(text(byTestId('p-comments'))).toContain('128 comments');
  });

  it('names the share button, which draws only a glyph', () => {
    mount(<ChannelPostCard channelName="C" time="12:41" onShare={() => undefined} testID="p" />);
    expect(byTestId('p-share').getAttribute('aria-label')).toBe('Share');
  });

  it('keeps the footer buttons OUT of the card press target', () => {
    mount(
      <ChannelPostCard
        channelName="C"
        time="12:41"
        onPress={() => undefined}
        onShare={() => undefined}
        testID="p"
      />,
    );
    expect(byTestId('p-open').contains(byTestId('p-share'))).toBe(false);
  });

  it('names the pin mark, which is otherwise a silent glyph', () => {
    mount(<ChannelPostCard channelName="C" time="12:41" pinned testID="p" />);
    expect(byTestId('p-pinned').getAttribute('aria-label')).toBe('Pinned');
  });
});

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

describe('storyProgressFill', () => {
  it('fills everything before the current story and nothing after it', () => {
    expect([0, 1, 2, 3].map((bar) => storyProgressFill(bar, 2, 0.4))).toEqual([1, 1, 0.4, 0]);
  });

  it('clamps the current story, and treats a non-number as empty', () => {
    expect(storyProgressFill(0, 0, -1)).toBe(0);
    expect(storyProgressFill(0, 0, 4)).toBe(1);
    expect(storyProgressFill(0, 0, Number.NaN)).toBe(0);
  });

  it('answers honestly for an index outside the range, rather than throwing', () => {
    // A story expiring under the viewer renders one frame with a stale index.
    // Before the first story nothing is filled; past the last one everything is.
    expect(storyProgressFill(0, -1, 0.5)).toBe(0);
    expect(storyProgressFill(0, 9, 0.5)).toBe(1);
  });
});

describe('storyTapZone', () => {
  it('gives BACK the narrow third — forward is the common intent', () => {
    expect(storyTapZone(10, 300)).toBe('previous');
    expect(storyTapZone(99, 300)).toBe('previous');
    expect(storyTapZone(100, 300)).toBe('next');
    expect(storyTapZone(290, 300)).toBe('next');
    expect(storyTapZone(10, 0)).toBe('next');
  });
});

describe('StoryProgressBars', () => {
  it('draws one bar per story and names the strip by position', () => {
    mount(<StoryProgressBars count={5} index={1} progress={0.5} testID="s" />);
    expect(byTestId('s').getAttribute('aria-label')).toBe('Story 2 of 5');
    expect(maybe('s-bar-4')).not.toBeNull();
    expect(maybe('s-bar-5')).toBeNull();
  });

  it('runs its own clock only while uncontrolled and unpaused', () => {
    jest.useFakeTimers();
    try {
      const done: number[] = [];
      mount(
        <StoryProgressBars count={3} index={0} duration={1000} onComplete={() => done.push(1)} testID="s" />,
      );
      act(() => {
        jest.advanceTimersByTime(1200);
      });
      expect(done).toHaveLength(1);

      done.length = 0;
      mount(<StoryProgressBars count={3} index={0} duration={1000} paused onComplete={() => done.push(1)} testID="s" />);
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(done).toHaveLength(0);

      done.length = 0;
      mount(
        <StoryProgressBars count={3} index={0} progress={0.2} duration={1000} onComplete={() => done.push(1)} testID="s" />,
      );
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(done).toHaveLength(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps ADVANCING under reduced motion — only the animation stops', () => {
    // A viewer that stops advancing under reduced motion strands the reader on
    // story one with nothing to tell them anything was meant to happen.
    motion.reduced = true;
    jest.useFakeTimers();
    try {
      const done: number[] = [];
      mount(
        <StoryProgressBars count={3} index={0} duration={800} onComplete={() => done.push(1)} testID="s" />,
      );
      act(() => {
        jest.advanceTimersByTime(900);
      });
      expect(done).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('StoryViewer', () => {
  const stories = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('gives both tap zones a real name, so a keyboard can reach them', () => {
    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="Saoirse"
        time="2 h"
        onNext={() => undefined}
        onPrevious={() => undefined}
        testID="v"
      />,
    );
    expect(byTestId('v-previous').getAttribute('aria-label')).toBe('Previous story');
    expect(byTestId('v-next').getAttribute('aria-label')).toBe('Next story');
  });

  it('steps forward and back through the caller', () => {
    const events: string[] = [];
    mount(
      <StoryViewer
        stories={stories}
        index={1}
        name="Saoirse"
        time="2 h"
        onNext={() => events.push('next')}
        onPrevious={() => events.push('prev')}
        testID="v"
      />,
    );
    press(byTestId('v-next'));
    press(byTestId('v-previous'));
    expect(events).toEqual(['next', 'prev']);
  });

  it('passes the index straight to the strip', () => {
    mount(<StoryViewer stories={stories} index={2} name="S" time="2 h" testID="v" />);
    expect(byTestId('v-progress').getAttribute('aria-label')).toBe('Story 3 of 3');
  });

  it('makes the mute button a toggle with both spellings', () => {
    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="S"
        time="2 h"
        muted
        onMutedChange={() => undefined}
        testID="v"
      />,
    );
    const mute = byTestId('v-mute');
    expect(mute.getAttribute('aria-pressed')).toBe('true');
    expect(mute.getAttribute('aria-label')).toBe('Unmute story');
  });

  it('draws the composer only with a change handler, and names the send button', () => {
    mount(<StoryViewer stories={stories} index={0} name="S" time="2 h" testID="v" />);
    expect(maybe('v-reply')).toBeNull();

    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="S"
        time="2 h"
        replyValue=""
        onReplyChange={() => undefined}
        onReplySend={() => undefined}
        testID="v"
      />,
    );
    expect(maybe('v-reply')).not.toBeNull();
    expect(byTestId('v-send').getAttribute('aria-label')).toBe('Send reply');
  });

  it('names each quick reaction by its emoji', () => {
    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="S"
        time="2 h"
        reactions={['❤️', '🔥']}
        onReact={() => undefined}
        testID="v"
      />,
    );
    expect(byTestId('v-react-❤️').getAttribute('aria-label')).toBe('React with ❤️');
  });

  it('lets a caller replace the composer entirely', () => {
    mount(
      <StoryViewer
        stories={stories}
        index={0}
        name="S"
        time="2 h"
        onReplyChange={() => undefined}
        composer={<div data-testid="mine" />}
        testID="v"
      />,
    );
    expect(maybe('v-reply')).toBeNull();
    expect(maybe('mine')).not.toBeNull();
  });
});
