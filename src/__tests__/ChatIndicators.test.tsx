/**
 * @jest-environment jsdom
 *
 * `chat-indicators`, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: the geometry, the painted colours and the
 * accessibility ATTRIBUTES (a prop-level test cannot see `accessibilityState`
 * being dropped on web, which is the defect class these components are most
 * exposed to).
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

// Reduced motion, and whether the dots ever START a repeat, are the two things
// about `TypingDots` jest can see. The state object hangs off `globalThis` so
// the factory (which runs before this module's own bindings initialise) and the
// suite share one reference.
interface MotionState {
  reduced: boolean;
  repeats: number;
}
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  const g = globalThis as { __chatMotion?: MotionState };
  const state = (g.__chatMotion ??= { reduced: false, repeats: 0 });
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

const motion = ((globalThis as { __chatMotion?: MotionState }).__chatMotion ??= {
  reduced: false,
  repeats: 0,
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  AvatarPresence,
  MessageStatus,
  PresenceDot,
  StoryRing,
  TypingDots,
  UnreadBadge,
  formatUnreadCount,
  presenceSizeForAvatar,
} from '../chat-indicators';
import { resolveChatIndicatorPaint } from '../chat-indicators/shared';

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

/** jsdom reports colours as `rgb(r, g, b)`; theme values arrive as `rgb(r g b)`. */
function normalise(color: string): string {
  const m = color.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) return color;
  return `rgb(${Number(m[0])}, ${Number(m[1])}, ${Number(m[2])})`;
}

function bg(el: HTMLElement): string {
  return getComputedStyle(el).backgroundColor;
}

function paint() {
  return resolveChatIndicatorPaint(theme);
}

// ---------------------------------------------------------------------------
//  PresenceDot
// ---------------------------------------------------------------------------

describe('PresenceDot', () => {
  it('names each status and renders it as an img', () => {
    for (const [status, name] of [
      ['online', 'Online'],
      ['idle', 'Away'],
      ['busy', 'Busy'],
      ['offline', 'Offline'],
    ] as const) {
      mount(<PresenceDot status={status} testID="dot" />);
      const el = byTestId('dot');
      expect(el.getAttribute('role')).toBe('img');
      expect(el.getAttribute('aria-label')).toBe(name);
      expect(el.getAttribute('aria-hidden')).toBeNull();
    }
  });

  it('takes a caller name, for i18n', () => {
    mount(<PresenceDot status="online" accessibilityLabel="En línea" testID="dot" />);
    expect(byTestId('dot').getAttribute('aria-label')).toBe('En línea');
  });

  it('hides itself from assistive tech on an EMPTY name, and only then', () => {
    mount(<PresenceDot status="online" accessibilityLabel="" testID="dot" />);
    const el = byTestId('dot');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('paints four DISTINCT fills, and offline is the hollow one', () => {
    const fills = new Set<string>();
    for (const status of ['online', 'idle', 'busy', 'offline'] as const) {
      mount(<PresenceDot status={status} testID="dot" />);
      const inner = byTestId('dot').firstElementChild as HTMLElement;
      const style = getComputedStyle(inner);
      if (status === 'offline') {
        // Hollow: the fill is the SURFACE, the colour is in the border. Four
        // states told apart by hue alone are four states some readers cannot
        // tell apart at all.
        expect(parseFloat(style.borderTopWidth)).toBeGreaterThanOrEqual(1.5);
        expect(normalise(style.backgroundColor)).toBe(normalise(theme.colors.background));
        fills.add(normalise(style.borderTopColor));
      } else {
        expect(parseFloat(style.borderTopWidth || '0')).toBe(0);
        fills.add(normalise(style.backgroundColor));
      }
    }
    expect(fills.size).toBe(4);
  });

  it('paints from the theme slots', () => {
    mount(<PresenceDot status="busy" testID="dot" />);
    const inner = byTestId('dot').firstElementChild as HTMLElement;
    expect(normalise(bg(inner))).toBe(normalise(paint().busy));
    expect(normalise(paint().busy)).toBe(normalise(theme.colors.error));
  });

  it('sizes the dot 8 / 10 / 12 and reserves ring + dot + ring', () => {
    for (const [size, px] of [
      ['small', 8],
      ['medium', 10],
      ['large', 12],
    ] as const) {
      mount(<PresenceDot status="online" size={size} testID="dot" />);
      const outer = byTestId('dot');
      const inner = outer.firstElementChild as HTMLElement;
      expect(getComputedStyle(inner).width).toBe(`${px}px`);
      expect(getComputedStyle(outer).width).toBe(`${px + 4}px`);
    }
  });

  it('takes the ring colour from the surface it sits on, and 0 removes it', () => {
    mount(<PresenceDot status="online" ringColor="rgb(1, 2, 3)" testID="dot" />);
    expect(normalise(bg(byTestId('dot')))).toBe('rgb(1, 2, 3)');

    mount(<PresenceDot status="online" ringWidth={0} testID="dot" />);
    expect(getComputedStyle(byTestId('dot')).width).toBe('10px');
  });
});

// ---------------------------------------------------------------------------
//  AvatarPresence
// ---------------------------------------------------------------------------

describe('AvatarPresence', () => {
  it('keeps the avatar footprint whatever the status', () => {
    mount(<AvatarPresence name="Ana" size={44} status="online" containerStyle={undefined} />);
    const wrapper = container.querySelector('div > div') as HTMLElement;
    expect(getComputedStyle(wrapper).width).toBe('44px');
    expect(getComputedStyle(wrapper).height).toBe('44px');
  });

  it('picks the dot rung from the avatar size', () => {
    expect(presenceSizeForAvatar(24)).toBe('small');
    expect(presenceSizeForAvatar(28)).toBe('small');
    expect(presenceSizeForAvatar(40)).toBe('medium');
    expect(presenceSizeForAvatar(44)).toBe('medium');
    expect(presenceSizeForAvatar(56)).toBe('large');

    for (const [avatar, dot] of [
      [24, 8],
      [40, 10],
      [56, 12],
    ] as const) {
      mount(<AvatarPresence name="Ana" size={avatar} status="online" />);
      const el = container.querySelector('[role="img"][aria-label="Online"]') as HTMLElement;
      const inner = el.firstElementChild as HTMLElement;
      expect(getComputedStyle(inner).width).toBe(`${dot}px`);
    }
  });

  it('honours presenceSize and forwards the label', () => {
    mount(
      <AvatarPresence name="Ana" size={56} status="idle" presenceSize="small" presenceLabel="Ausente" />,
    );
    const el = container.querySelector('[role="img"][aria-label="Ausente"]') as HTMLElement;
    expect(getComputedStyle(el.firstElementChild as HTMLElement).width).toBe('8px');
  });

  it('draws no dot without a status', () => {
    mount(<AvatarPresence name="Ana" size={40} />);
    expect(container.querySelector('[aria-label="Online"]')).toBeNull();
    expect(container.querySelector('[aria-label="Offline"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  MessageStatus
// ---------------------------------------------------------------------------

describe('MessageStatus', () => {
  function glyph(id = 'st') {
    return byTestId(id).querySelector('path') as SVGPathElement;
  }

  it('maps each status to its own glyph, and the two tick states share one', () => {
    const d: Record<string, string> = {};
    for (const status of ['sending', 'sent', 'delivered', 'read', 'failed'] as const) {
      mount(<MessageStatus status={status} testID="st" />);
      d[status] = glyph().getAttribute('d') ?? '';
      expect(d[status]).not.toBe('');
    }
    expect(new Set([d.sending, d.sent, d.delivered, d.failed]).size).toBe(4);
    // `read` is `delivered` in another colour — the tick COUNT does not change.
    expect(d.read).toBe(d.delivered);
  });

  it('names each status', () => {
    for (const [status, name] of [
      ['sending', 'Sending…'],
      ['sent', 'Sent'],
      ['delivered', 'Delivered'],
      ['read', 'Read'],
      ['failed', 'Not sent'],
    ] as const) {
      mount(<MessageStatus status={status} testID="st" />);
      expect(byTestId('st').getAttribute('role')).toBe('img');
      expect(byTestId('st').getAttribute('aria-label')).toBe(name);
    }
  });

  it('hides itself on an empty label', () => {
    mount(<MessageStatus status="read" label="" testID="st" />);
    expect(byTestId('st').getAttribute('aria-hidden')).toBe('true');
    expect(byTestId('st').getAttribute('role')).toBeNull();
  });

  it('paints read in the accent and the other ticks muted', () => {
    mount(<MessageStatus status="delivered" testID="st" />);
    const muted = glyph().getAttribute('fill');
    mount(<MessageStatus status="read" testID="st" />);
    const read = glyph().getAttribute('fill');
    expect(muted).toBe(paint().tick);
    expect(read).toBe(paint().tickRead);
    expect(read).not.toBe(muted);
  });

  it('lets a coloured bubble repaint the ticks — but never the failure', () => {
    mount(<MessageStatus status="read" color="rgb(9, 9, 9)" testID="st" />);
    expect(glyph().getAttribute('fill')).toBe('rgb(9, 9, 9)');

    mount(<MessageStatus status="failed" color="rgb(9, 9, 9)" testID="st" />);
    expect(glyph().getAttribute('fill')).toBe(theme.colors.error);
  });

  it('draws at the size it is given', () => {
    for (const size of [12, 14, 16] as const) {
      mount(<MessageStatus status="sent" size={size} testID="st" />);
      expect(getComputedStyle(byTestId('st')).width).toBe(`${size}px`);
      expect(glyph().closest('svg')?.getAttribute('width')).toBe(String(size));
    }
  });
});

// ---------------------------------------------------------------------------
//  UnreadBadge
// ---------------------------------------------------------------------------

describe('formatUnreadCount', () => {
  it('clamps at max and floors the rest', () => {
    expect(formatUnreadCount(0)).toBe('0');
    expect(formatUnreadCount(1)).toBe('1');
    expect(formatUnreadCount(99)).toBe('99');
    expect(formatUnreadCount(100)).toBe('99+');
    expect(formatUnreadCount(1204)).toBe('99+');
    expect(formatUnreadCount(12, 9)).toBe('9+');
    expect(formatUnreadCount(4.8)).toBe('4');
    expect(formatUnreadCount(-3)).toBe('0');
    expect(formatUnreadCount(Number.NaN)).toBe('0');
  });
});

describe('UnreadBadge', () => {
  it('renders NOTHING at zero, and the dot variant regardless', () => {
    mount(<UnreadBadge count={0} testID="b" />);
    expect(container.querySelector('[data-testid="b"]')).toBeNull();

    mount(<UnreadBadge count={0} dot testID="b" />);
    expect(byTestId('b').getAttribute('aria-label')).toBe('Unread');
  });

  it('draws the clamped text while the NAME keeps the real count', () => {
    mount(<UnreadBadge count={128} testID="b" />);
    expect(byTestId('b').textContent).toBe('99+');
    expect(byTestId('b').getAttribute('aria-label')).toBe('128 unread messages');
  });

  it('says "message" once and "messages" otherwise', () => {
    mount(<UnreadBadge count={1} testID="b" />);
    expect(byTestId('b').getAttribute('aria-label')).toBe('1 unread message');
    mount(<UnreadBadge count={3} testID="b" />);
    expect(byTestId('b').getAttribute('aria-label')).toBe('3 unread messages');
  });

  it('takes formatLabel — with the REAL count, not the clamped text', () => {
    mount(<UnreadBadge count={128} formatLabel={(n) => `${n} sin leer`} testID="b" />);
    expect(byTestId('b').getAttribute('aria-label')).toBe('128 sin leer');
    mount(<UnreadBadge count={4} accessibilityLabel="four" formatLabel={() => 'x'} testID="b" />);
    expect(byTestId('b').getAttribute('aria-label')).toBe('four');
  });

  it('hides the drawn digits from assistive tech, so the count is read once', () => {
    mount(<UnreadBadge count={7} testID="b" />);
    const text = byTestId('b').firstElementChild as HTMLElement;
    expect(text.getAttribute('aria-hidden')).toBe('true');
  });

  it('is a circle at one digit and grows with the text', () => {
    mount(<UnreadBadge count={7} testID="b" />);
    const one = byTestId('b').getBoundingClientRect();
    const style = getComputedStyle(byTestId('b'));
    expect(style.height).toBe('20px');
    expect(style.minWidth).toBe('20px');
    expect(style.paddingLeft).toBe('0px');
    expect(one).toBeTruthy();

    mount(<UnreadBadge count={42} testID="b" />);
    expect(getComputedStyle(byTestId('b')).paddingLeft).toBe('6px');
    expect(getComputedStyle(byTestId('b')).paddingRight).toBe('6px');

    mount(<UnreadBadge count={7} size="small" testID="b" />);
    expect(getComputedStyle(byTestId('b')).height).toBe('16px');
    mount(<UnreadBadge count={7} size="small" dot testID="b" />);
    expect(getComputedStyle(byTestId('b')).width).toBe('8px');
  });

  it('fills with the accent, or the neutral when muted', () => {
    mount(<UnreadBadge count={5} testID="b" />);
    expect(normalise(bg(byTestId('b')))).toBe(normalise(paint().accent));
    mount(<UnreadBadge count={5} muted testID="b" />);
    expect(normalise(bg(byTestId('b')))).toBe(normalise(paint().mutedFill));
    expect(normalise(paint().mutedFill)).not.toBe(normalise(paint().accent));
  });

  it('repaints in dark mode', () => {
    mount(<UnreadBadge count={5} muted testID="b" />, 'light');
    const light = normalise(bg(byTestId('b')));
    mount(<UnreadBadge count={5} muted testID="b" />, 'dark');
    expect(normalise(bg(byTestId('b')))).not.toBe(light);
  });
});

// ---------------------------------------------------------------------------
//  TypingDots
// ---------------------------------------------------------------------------

describe('TypingDots', () => {
  it('is decorative without a label — and named with one', () => {
    mount(<TypingDots testID="t" />);
    expect(byTestId('t').getAttribute('aria-hidden')).toBe('true');
    expect(byTestId('t').getAttribute('role')).toBeNull();

    mount(<TypingDots label="Ana is typing…" testID="t" />);
    expect(byTestId('t').getAttribute('aria-hidden')).toBeNull();
    expect(byTestId('t').getAttribute('role')).toBe('img');
    expect(byTestId('t').getAttribute('aria-label')).toBe('Ana is typing…');
    expect(byTestId('t').textContent).toBe('Ana is typing…');
  });

  it('draws three dots', () => {
    mount(<TypingDots size={8} testID="t" />);
    // Reanimated views are a bare host in the jest mock, so their diameter and
    // their lift are browser-verified (Base/Chat Indicators), not read here.
    expect((byTestId('t').firstElementChild as HTMLElement).children).toHaveLength(3);
  });

  it('starts one repeat per dot — and NONE under reduced motion', () => {
    motion.repeats = 0;
    mount(<TypingDots testID="t" />);
    expect(motion.repeats).toBe(3);

    motion.reduced = true;
    motion.repeats = 0;
    mount(<TypingDots testID="t" />);
    expect(motion.repeats).toBe(0);
    // Still three dots: reduced motion stops the movement, not the indicator.
    expect((byTestId('t').firstElementChild as HTMLElement).children.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
//  StoryRing
// ---------------------------------------------------------------------------

describe('StoryRing', () => {
  it('reserves size + 2 * (thickness + gap) in EVERY state, `none` included', () => {
    for (const state of ['unseen', 'seen', 'none'] as const) {
      mount(
        <StoryRing state={state} size={56} testID="r">
          <div />
        </StoryRing>,
      );
      expect(getComputedStyle(byTestId('r')).width).toBe('64px');
    }
    mount(
      <StoryRing state="unseen" size={40} thickness={3} gap={4} testID="r">
        <div />
      </StoryRing>,
    );
    expect(getComputedStyle(byTestId('r')).width).toBe('54px');
  });

  it('draws a gradient for unseen, a plain border for seen, nothing for none', () => {
    mount(
      <StoryRing state="unseen" size={56} testID="r">
        <div />
      </StoryRing>,
    );
    const stops = Array.from(byTestId('r').querySelectorAll('stop'));
    expect(stops.length).toBe(paint().ringUnseen.length);
    expect(stops.length).toBeGreaterThanOrEqual(2);
    expect(stops.map((s) => normalise(s.getAttribute('stop-color') ?? ''))).toEqual(
      paint().ringUnseen.map((c) => normalise(c)),
    );
    // A "gradient" whose stops are all one colour is a solid ring in disguise.
    expect(new Set(stops.map((s) => s.getAttribute('stop-color'))).size).toBe(stops.length);

    mount(
      <StoryRing state="seen" size={56} testID="r">
        <div />
      </StoryRing>,
    );
    expect(byTestId('r').querySelector('stop')).toBeNull();
    const border = byTestId('r').firstElementChild as HTMLElement;
    expect(normalise(getComputedStyle(border).borderTopColor)).toBe(normalise(paint().ringSeen));

    mount(
      <StoryRing state="none" size={56} testID="r">
        <div data-testid="child" />
      </StoryRing>,
    );
    expect(byTestId('r').querySelector('stop')).toBeNull();
    expect(parseFloat(getComputedStyle(byTestId('r').firstElementChild as HTMLElement).borderTopWidth || '0')).toBe(0);
    expect(byTestId('child')).toBeTruthy();
  });

  it('takes a caller ring colour, solid or gradient', () => {
    mount(
      <StoryRing state="seen" size={40} colors={['rgb(1, 2, 3)', 'rgb(4, 5, 6)']} testID="r">
        <div />
      </StoryRing>,
    );
    expect(byTestId('r').querySelectorAll('stop').length).toBe(2);

    mount(
      <StoryRing state="unseen" size={40} colors="rgb(1, 2, 3)" testID="r">
        <div />
      </StoryRing>,
    );
    expect(byTestId('r').querySelector('stop')).toBeNull();
    expect(normalise(getComputedStyle(byTestId('r').firstElementChild as HTMLElement).borderTopColor)).toBe(
      'rgb(1, 2, 3)',
    );
  });

  it('becomes a named button when it is pressable, and stays decorative otherwise', () => {
    const onPress = jest.fn();
    mount(
      <StoryRing state="unseen" size={56} onPress={onPress} accessibilityLabel="Ana's story" testID="r">
        <div />
      </StoryRing>,
    );
    const el = byTestId('r');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('aria-label')).toBe("Ana's story");

    mount(
      <StoryRing state="unseen" size={56} testID="r">
        <div />
      </StoryRing>,
    );
    expect(byTestId('r').getAttribute('role')).toBeNull();
  });

  it('pins the badge slot to the bottom-right', () => {
    mount(
      <StoryRing state="seen" size={56} badge={<div data-testid="badge" />} testID="r">
        <div />
      </StoryRing>,
    );
    const slot = byTestId('badge').parentElement as HTMLElement;
    const style = getComputedStyle(slot);
    expect(style.position).toBe('absolute');
    expect(style.right).toBe('0px');
    expect(style.bottom).toBe('0px');
  });
});
