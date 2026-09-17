/**
 * @jest-environment jsdom
 *
 * `call-ui`, rendered through the REAL react-native-web so the assertions read
 * the emitted DOM: the accessibility ATTRIBUTES a toggle actually ships (a
 * prop-level test cannot see `accessibilityState` being dropped on web, which
 * is the defect class every control here is exposed to), the geometry of the
 * grid, and the one piece of logic with a wrong answer — the status line's
 * precedence.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

interface MotionState {
  reduced: boolean;
  repeats: number;
}
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  const g = globalThis as { __callMotion?: MotionState };
  const state = (g.__callMotion ??= { reduced: false, repeats: 0 });
  return {
    ...actual,
    __esModule: true,
    useReducedMotion: () => state.reduced,
    withRepeat: (...args: unknown[]) => {
      state.repeats += 1;
      return (actual.withRepeat as (...a: unknown[]) => unknown)(...args);
    },
  };
});

const motion = ((globalThis as { __callMotion?: MotionState }).__callMotion ??= {
  reduced: false,
  repeats: 0,
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  CallControls,
  CallHistoryList,
  CallHistoryRow,
  CallMinimisedPill,
  CallScreen,
  GroupCallBar,
  GroupCallGrid,
  IncomingCallBanner,
  IncomingCallScreen,
  callGridColumns,
  callGridLayout,
  callSpotlightIndex,
  resolveCallStatusLine,
} from '../call-ui';
import { SLIDE_ANSWER_THRESHOLD, slideAnswers } from '../call-ui/shared';
import type { GroupCallParticipant } from '../call-ui/types';

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
  motion.repeats = 0;
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

function text(el: HTMLElement): string {
  return el.textContent ?? '';
}

const PEOPLE: GroupCallParticipant[] = Array.from({ length: 12 }, (_, i) => ({
  id: `p${i}`,
  name: `Person ${i}`,
}));

// ---------------------------------------------------------------------------
//  The status line's precedence
// ---------------------------------------------------------------------------

describe('resolveCallStatusLine', () => {
  it('lets the caller override everything', () => {
    expect(
      resolveCallStatusLine({ status: 'active', duration: '00:42', statusText: 'Poor connection' }),
    ).toBe('Poor connection');
  });

  it('NEVER shows a timer once the call has ended', () => {
    // The frozen last tick reads as a live call. This is the precedence bug the
    // function exists to make impossible.
    expect(resolveCallStatusLine({ status: 'ended', duration: '00:42' })).toBe('Call ended');
  });

  it('shows "Reconnecting…" over the timer, because the media is down', () => {
    expect(resolveCallStatusLine({ status: 'reconnecting', duration: '02:11' })).toBe(
      'Reconnecting…',
    );
  });

  it('shows the timer while active, and the fallback until the first tick', () => {
    expect(resolveCallStatusLine({ status: 'active', duration: '00:42' })).toBe('00:42');
    expect(resolveCallStatusLine({ status: 'active' })).toBe('Connected');
    expect(resolveCallStatusLine({ status: 'active', duration: '' })).toBe('Connected');
  });

  it('falls back to each status label, and takes a translated one', () => {
    expect(resolveCallStatusLine({ status: 'calling' })).toBe('Calling…');
    expect(resolveCallStatusLine({ status: 'ringing' })).toBe('Ringing');
    expect(resolveCallStatusLine({ status: 'onHold' })).toBe('On hold');
    expect(resolveCallStatusLine({ status: 'calling', labels: { calling: 'Llamando…' } })).toBe(
      'Llamando…',
    );
  });

  it('is what CallScreen renders', () => {
    mount(
      <CallScreen name="Ana Restrepo" status="ended" duration="00:42" testID="c" />,
    );
    expect(text(byTestId('c-status'))).toBe('Call ended');
  });
});

// ---------------------------------------------------------------------------
//  Controls
// ---------------------------------------------------------------------------

describe('CallControls', () => {
  it('draws a control only when its handler is given', () => {
    mount(<CallControls muted={false} onMutedChange={() => undefined} testID="c" />);
    expect(maybe('c-mute')).not.toBeNull();
    expect(maybe('c-video')).toBeNull();
    expect(maybe('c-speaker')).toBeNull();
    expect(maybe('c-end')).toBeNull();
  });

  it('cannot be made to draw a control that has no handler', () => {
    mount(
      <CallControls
        controls={['video', 'screenShare', 'mute']}
        onMutedChange={() => undefined}
        testID="c"
      />,
    );
    expect(maybe('c-video')).toBeNull();
    expect(maybe('c-screenShare')).toBeNull();
    expect(maybe('c-mute')).not.toBeNull();
  });

  it('ships BOTH toggle spellings — aria-pressed for web, the name for both', () => {
    mount(<CallControls muted onMutedChange={() => undefined} testID="c" />);
    const mute = byTestId('c-mute');
    expect(mute.getAttribute('role')).toBe('button');
    expect(mute.getAttribute('aria-pressed')).toBe('true');
    expect(mute.getAttribute('aria-label')).toBe('Unmute');
  });

  it('names the toggle by what pressing it DOES, and flips with the state', () => {
    mount(<CallControls muted={false} onMutedChange={() => undefined} testID="c" />);
    expect(byTestId('c-mute').getAttribute('aria-label')).toBe('Mute');
    expect(byTestId('c-mute').getAttribute('aria-pressed')).toBe('false');
  });

  it('gives a one-shot action NO aria-pressed — it has no state to announce', () => {
    mount(<CallControls onFlipCamera={() => undefined} onAddParticipant={() => undefined} testID="c" />);
    expect(byTestId('c-flipCamera').getAttribute('aria-pressed')).toBeNull();
    expect(byTestId('c-addParticipant').getAttribute('aria-pressed')).toBeNull();
    expect(byTestId('c-flipCamera').getAttribute('aria-label')).toBe('Flip camera');
  });

  it('reports the camera toggle as pressed when the camera is OFF', () => {
    mount(<CallControls videoOn={false} onVideoChange={() => undefined} testID="c" />);
    expect(byTestId('c-video').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('c-video').getAttribute('aria-label')).toBe('Turn camera on');
  });

  it('toggles by emitting the NEXT value', () => {
    const changes: boolean[] = [];
    mount(<CallControls muted onMutedChange={(next) => changes.push(next)} testID="c" />);
    press(byTestId('c-mute'));
    expect(changes).toEqual([false]);
  });

  it('draws the end button last and only with a handler', () => {
    mount(
      <CallControls
        onMutedChange={() => undefined}
        onEndCall={() => undefined}
        testID="c"
      />,
    );
    const end = byTestId('c-end');
    expect(end.getAttribute('aria-label')).toBe('End call');
    expect(end.getAttribute('aria-pressed')).toBeNull();
  });

  it('disables every button at once, and says so', () => {
    mount(
      <CallControls disabled muted={false} onMutedChange={() => undefined} onEndCall={() => undefined} testID="c" />,
    );
    expect(byTestId('c-mute').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('c-end').getAttribute('aria-disabled')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
//  CallScreen
// ---------------------------------------------------------------------------

describe('CallScreen', () => {
  it('names the top-bar buttons, and counts the participants on one of them', () => {
    mount(
      <CallScreen
        name="Ana Restrepo"
        status="active"
        duration="00:10"
        onMinimise={() => undefined}
        onOpenChat={() => undefined}
        onOpenParticipants={() => undefined}
        participantCount={4}
        testID="c"
      />,
    );
    expect(byTestId('c-minimise').getAttribute('aria-label')).toBe('Minimise call');
    expect(byTestId('c-chat').getAttribute('aria-label')).toBe('Open chat');
    expect(byTestId('c-participants').getAttribute('aria-label')).toBe('Participants (4)');
  });

  it('drops the control bar once the call has ended', () => {
    const controls = { onEndCall: () => undefined };
    mount(<CallScreen name="Ana" status="active" controls={controls} testID="c" />);
    expect(maybe('c-controls-end')).not.toBeNull();
    mount(<CallScreen name="Ana" status="ended" controls={controls} testID="c" />);
    expect(maybe('c-controls-end')).toBeNull();
  });

  it('shows the avatar for voice and the remote frame for video', () => {
    mount(<CallScreen name="Ana" status="active" testID="c" />);
    expect(maybe('c-avatar')).not.toBeNull();
    expect(maybe('c-remote')).toBeNull();

    mount(
      <CallScreen
        name="Ana"
        mode="video"
        status="active"
        remoteVideo={<div data-testid="frame" />}
        testID="c"
      />,
    );
    expect(maybe('c-remote')).not.toBeNull();
    expect(maybe('c-avatar')).toBeNull();
  });

  it('cycles the PiP corner clockwise, and names the corner it is going TO', () => {
    const moves: string[] = [];
    mount(
      <CallScreen
        name="Ana"
        mode="video"
        status="active"
        remoteVideo={<div />}
        localVideo={<div />}
        localVideoCorner="top-right"
        onMoveLocal={(corner) => moves.push(corner)}
        testID="c"
      />,
    );
    const pip = byTestId('c-pip');
    expect(pip.getAttribute('role')).toBe('button');
    expect(pip.getAttribute('aria-label')).toBe('Move self view (now bottom right)');
    press(pip);
    expect(moves).toEqual(['bottom-right']);
  });

  it('leaves the PiP a plain frame when it cannot move', () => {
    mount(
      <CallScreen
        name="Ana"
        mode="video"
        status="active"
        remoteVideo={<div />}
        localVideo={<div />}
        testID="c"
      />,
    );
    expect(byTestId('c-pip').getAttribute('role')).toBeNull();
  });

  it('collapses to the pill, carrying the timer and the mute state', () => {
    mount(
      <CallScreen
        name="Ana Restrepo"
        status="active"
        duration="00:42"
        minimised
        onMinimise={() => undefined}
        controls={{ muted: true, onMutedChange: () => undefined, onEndCall: () => undefined }}
        testID="c"
      />,
    );
    expect(text(byTestId('c-timer'))).toBe('00:42');
    expect(byTestId('c-mute').getAttribute('aria-pressed')).toBe('true');
    expect(maybe('c-avatar')).toBeNull();
  });
});

describe('CallMinimisedPill', () => {
  it('names the expand target with the person on the call', () => {
    mount(<CallMinimisedPill name="Ana Restrepo" duration="01:02" onExpand={() => undefined} testID="p" />);
    expect(byTestId('p-expand').getAttribute('aria-label')).toBe('Return to call with Ana Restrepo');
  });

  it('prefers a status line over the timer', () => {
    mount(<CallMinimisedPill name="Ana" duration="01:02" statusText="Reconnecting…" testID="p" />);
    expect(text(byTestId('p-timer'))).toBe('Reconnecting…');
  });
});

// ---------------------------------------------------------------------------
//  Incoming
// ---------------------------------------------------------------------------

describe('IncomingCallBanner', () => {
  it('says which KIND of call is arriving, and names both round buttons', () => {
    mount(
      <IncomingCallBanner
        name="Marcel Dubé"
        mode="video"
        onAccept={() => undefined}
        onDecline={() => undefined}
        testID="b"
      />,
    );
    expect(text(byTestId('b-subtitle'))).toBe('Incoming video call');
    expect(byTestId('b-accept').getAttribute('aria-label')).toBe('Accept');
    expect(byTestId('b-decline').getAttribute('aria-label')).toBe('Decline');
  });

  it('keeps the two buttons OUTSIDE the banner press target', () => {
    mount(
      <IncomingCallBanner
        name="Marcel Dubé"
        onAccept={() => undefined}
        onDecline={() => undefined}
        onPress={() => undefined}
        testID="b"
      />,
    );
    expect(byTestId('b-open').contains(byTestId('b-accept'))).toBe(false);
  });
});

describe('IncomingCallScreen', () => {
  it('answers on a PRESS as well as a drag — the accessible path is the same control', () => {
    const accepted: number[] = [];
    mount(
      <IncomingCallScreen
        name="Lucía Ferrer"
        answerMode="slide"
        onAccept={() => accepted.push(1)}
        testID="s"
      />,
    );
    const knob = byTestId('s-knob');
    expect(knob.getAttribute('role')).toBe('button');
    expect(knob.getAttribute('aria-label')).toBe('Accept');
    press(knob);
    expect(accepted).toEqual([1]);
  });

  it('answers past the threshold and not before it', () => {
    expect(slideAnswers(0, 200)).toBe(false);
    expect(slideAnswers(200 * SLIDE_ANSWER_THRESHOLD - 1, 200)).toBe(false);
    expect(slideAnswers(200 * SLIDE_ANSWER_THRESHOLD, 200)).toBe(true);
    // A track that has not been measured cannot answer: `dx >= 0 * anything` is
    // true for every gesture, which would answer the call on a stray touch.
    expect(slideAnswers(50, 0)).toBe(false);
  });

  it('draws two round buttons in the default answer mode', () => {
    mount(
      <IncomingCallScreen
        name="Ana"
        onAccept={() => undefined}
        onDecline={() => undefined}
        testID="s"
      />,
    );
    expect(maybe('s-knob')).toBeNull();
    expect(byTestId('s-accept').getAttribute('aria-label')).toBe('Accept');
    expect(byTestId('s-decline').getAttribute('aria-label')).toBe('Decline');
  });

  it('starts the chevron loop, and does not under reduced motion', () => {
    mount(<IncomingCallScreen name="Ana" answerMode="slide" onAccept={() => undefined} />);
    expect(motion.repeats).toBeGreaterThan(0);

    motion.repeats = 0;
    motion.reduced = true;
    mount(<IncomingCallScreen name="Ana" answerMode="slide" onAccept={() => undefined} />);
    expect(motion.repeats).toBe(0);
  });
});

// ---------------------------------------------------------------------------
//  Group call layout
// ---------------------------------------------------------------------------

describe('callGridColumns', () => {
  it('is ceil(sqrt(n)) — 2 side by side, 4 a square, 6 as 3×2, 9 as 3×3', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16].map(callGridColumns)).toEqual([
      1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4,
    ]);
  });
});

describe('callGridLayout', () => {
  it('lays a full grid out by count', () => {
    expect(callGridLayout(4)).toEqual({ visible: 4, overflow: 0, columns: 2, rows: 2, cells: 4 });
    expect(callGridLayout(6)).toEqual({ visible: 6, overflow: 0, columns: 3, rows: 2, cells: 6 });
    expect(callGridLayout(9)).toEqual({ visible: 9, overflow: 0, columns: 3, rows: 3, cells: 9 });
  });

  it('makes the overflow tile TAKE a cell, so a 9-up stays 3×3', () => {
    // The failure this pins: adding the `+N` beside the grid turns a 9-cell
    // 3×3 into a 10-cell 4×3 the moment a tenth person joins.
    const layout = callGridLayout(12, 9);
    expect(layout).toEqual({ visible: 8, overflow: 4, columns: 3, rows: 3, cells: 9 });
  });

  it('does not invent an overflow tile at exactly the cap', () => {
    expect(callGridLayout(9, 9).overflow).toBe(0);
    expect(callGridLayout(10, 9).overflow).toBe(2);
    expect(callGridLayout(10, 9).visible).toBe(8);
  });

  it('takes a columns override and an unlimited cap', () => {
    expect(callGridLayout(6, 9, 2)).toEqual({
      visible: 6,
      overflow: 0,
      columns: 2,
      rows: 3,
      cells: 6,
    });
    expect(callGridLayout(20, 0).overflow).toBe(0);
  });

  it('answers for an empty call rather than dividing by zero', () => {
    expect(callGridLayout(0)).toEqual({ visible: 0, overflow: 0, columns: 1, rows: 1, cells: 0 });
  });
});

describe('callSpotlightIndex', () => {
  it('prefers the asked-for tile, then the presenter, then the speaker, then the first', () => {
    const people: GroupCallParticipant[] = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B', speaking: true },
      { id: 'c', name: 'C', presenting: true },
    ];
    expect(callSpotlightIndex(people, 'a')).toBe(0);
    expect(callSpotlightIndex(people)).toBe(2);
    expect(callSpotlightIndex(people.slice(0, 2))).toBe(1);
    expect(callSpotlightIndex([{ id: 'a', name: 'A' }])).toBe(0);
    expect(callSpotlightIndex([])).toBe(-1);
    // An id nobody has falls through rather than pinning the wrong person.
    expect(callSpotlightIndex(people, 'zz')).toBe(2);
  });
});

describe('GroupCallGrid', () => {
  it('draws one tile per participant, sized to the width it was given', () => {
    mount(<GroupCallGrid participants={PEOPLE.slice(0, 4)} width={332} gap={8} testID="g" />);
    const tile = byTestId('g-tile-p0');
    // (332 - 8) / 2 = 162
    expect(tile.style.width).toBe('162px');
    expect(tile.style.height).toBe('162px');
    expect(maybe('g-tile-p3')).not.toBeNull();
    expect(maybe('g-overflow')).toBeNull();
  });

  it('folds the tail into a +N tile that takes the last cell', () => {
    mount(<GroupCallGrid participants={PEOPLE} width={330} maxTiles={9} testID="g" />);
    expect(maybe('g-tile-p7')).not.toBeNull();
    expect(maybe('g-tile-p8')).toBeNull();
    const overflow = byTestId('g-overflow');
    expect(text(overflow)).toBe('+4 more');
    expect(overflow.getAttribute('aria-label')).toBe('+4 more');
  });

  it('spotlights one tile over a strip', () => {
    mount(
      <GroupCallGrid
        participants={PEOPLE.slice(0, 5)}
        layout="spotlight"
        spotlightId="p2"
        width={330}
        testID="g"
      />,
    );
    expect(maybe('g-spotlight')).not.toBeNull();
    expect(maybe('g-strip-p2')).toBeNull();
    expect(maybe('g-strip-p0')).not.toBeNull();
  });

  it('draws nothing until it has a width', () => {
    mount(<GroupCallGrid participants={PEOPLE.slice(0, 4)} testID="g" />);
    expect(maybe('g-tile-p0')).toBeNull();
  });

  it('names a muted tile, and pulses the speaking ring unless motion is reduced', () => {
    const talking: GroupCallParticipant[] = [
      { id: 'a', name: 'Ana', muted: true, speaking: true },
    ];
    mount(
      <GroupCallGrid
        participants={talking}
        width={200}
        onParticipantPress={() => undefined}
        testID="g"
      />,
    );
    expect(byTestId('g-tile-a').getAttribute('aria-label')).toBe('Ana, muted');
    expect(motion.repeats).toBeGreaterThan(0);

    motion.repeats = 0;
    motion.reduced = true;
    mount(<GroupCallGrid participants={talking} width={200} testID="g" />);
    expect(motion.repeats).toBe(0);
  });
});

describe('GroupCallBar', () => {
  it('lets who is speaking replace the quiet status line', () => {
    mount(<GroupCallBar title="Saturday" statusText="4 on the call" testID="b" />);
    expect(text(byTestId('b-status'))).toBe('4 on the call');
    mount(
      <GroupCallBar title="Saturday" statusText="4 on the call" speakingName="Marcel" testID="b" />,
    );
    expect(text(byTestId('b-status'))).toBe('Marcel is speaking');
  });

  it('switches Join for Leave, and only offers mute once joined', () => {
    mount(<GroupCallBar onJoin={() => undefined} onLeave={() => undefined} onMutedChange={() => undefined} testID="b" />);
    expect(maybe('b-join')).not.toBeNull();
    expect(maybe('b-leave')).toBeNull();
    expect(maybe('b-mute')).toBeNull();

    mount(<GroupCallBar joined onJoin={() => undefined} onLeave={() => undefined} muted onMutedChange={() => undefined} testID="b" />);
    expect(maybe('b-join')).toBeNull();
    expect(maybe('b-leave')).not.toBeNull();
    expect(byTestId('b-mute').getAttribute('aria-pressed')).toBe('true');
  });

  it('marks the avatars it could not fit', () => {
    mount(
      <GroupCallBar
        participants={PEOPLE.slice(0, 7).map((p) => ({ id: p.id, name: p.name }))}
        maxAvatars={4}
        testID="b"
      />,
    );
    expect(text(byTestId('b-more'))).toBe('+3');
  });
});

// ---------------------------------------------------------------------------
//  Call history
// ---------------------------------------------------------------------------

describe('CallHistoryRow', () => {
  it('names the direction in WORDS as well as in colour', () => {
    mount(<CallHistoryRow name="Ana" direction="missed" meta="Yesterday, 18:40" testID="r" />);
    expect(text(byTestId('r-meta'))).toBe('Missed · Yesterday, 18:40');
  });

  it('paints only missed and declined calls negative', () => {
    const colorOf = (direction: 'incoming' | 'outgoing' | 'missed' | 'declined') => {
      mount(<CallHistoryRow name="Ana" direction={direction} meta="18:40" testID="r" />);
      return getComputedStyle(byTestId('r-name')).color;
    };
    const quiet = colorOf('incoming');
    expect(colorOf('outgoing')).toBe(quiet);
    const loud = colorOf('missed');
    expect(loud).not.toBe(quiet);
    expect(colorOf('declined')).toBe(loud);
  });

  it('names the row and the call-back button separately', () => {
    mount(
      <CallHistoryRow
        name="Ana Restrepo"
        direction="incoming"
        meta="18:40 · 4:32"
        onPress={() => undefined}
        onCallBack={() => undefined}
        testID="r"
      />,
    );
    expect(byTestId('r-open').getAttribute('aria-label')).toBe(
      'Ana Restrepo, incoming, 18:40 · 4:32',
    );
    expect(byTestId('r-callback').getAttribute('aria-label')).toBe('Call Ana Restrepo back');
    expect(byTestId('r-open').contains(byTestId('r-callback'))).toBe(false);
  });

  it('draws a repeat count only when there is more than one call', () => {
    mount(<CallHistoryRow name="Ana" direction="missed" meta="18:40" count={1} testID="r" />);
    expect(text(byTestId('r'))).not.toContain('(1)');
    mount(<CallHistoryRow name="Ana" direction="missed" meta="18:40" count={3} testID="r" />);
    expect(text(byTestId('r'))).toContain('(3)');
  });
});

describe('CallHistoryList', () => {
  const sections = [
    { title: 'Today', items: [{ id: '1', name: 'Ana', direction: 'missed' as const, meta: '09:14' }] },
    { title: 'Empty', items: [] },
    {
      title: 'Yesterday',
      items: [{ id: '2', name: 'Kofi', direction: 'outgoing' as const, meta: '18:40' }],
    },
  ];

  it('drops an empty section rather than heading nothing', () => {
    mount(<CallHistoryList sections={sections} testID="l" />);
    expect(maybe('l-section-Today')).not.toBeNull();
    expect(maybe('l-section-Yesterday')).not.toBeNull();
    expect(maybe('l-section-Empty')).toBeNull();
  });

  it('routes presses back with the item id', () => {
    const opened: string[] = [];
    const called: string[] = [];
    mount(
      <CallHistoryList
        sections={sections}
        onItemPress={(id) => opened.push(id)}
        onCallBack={(id) => called.push(id)}
        testID="l"
      />,
    );
    press(byTestId('l-item-2-open'));
    press(byTestId('l-item-1-callback'));
    expect(opened).toEqual(['2']);
    expect(called).toEqual(['1']);
  });

  it('shows the empty state only when every section is empty', () => {
    mount(
      <CallHistoryList
        sections={[{ title: 'Today', items: [] }]}
        emptyState={<div data-testid="none" />}
        testID="l"
      />,
    );
    expect(maybe('none')).not.toBeNull();
  });
});
