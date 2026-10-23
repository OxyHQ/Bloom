import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { BloomIconComponent } from '../icons/icon-component';
import { EngagementAction, EngagementBar, EngagementGroup } from '../engagement-bar';

/**
 * `EngagementBar` is mounted once per row of a feed, with five or six actions
 * in it, so what an action costs at REST is the contract: one composite over
 * one pressable host, the glyph, and a text only when there is a count — no
 * style wrapper, no animated node, no mapper — and ONE hook slot (a state; the
 * bar's context is a read, not a slot). The pop and the roll exist only between
 * an accepted press and the end of their animation.
 *
 * Under this suite's react-native mock each primitive is a `forwardRef` over a
 * host: two fibers. The real `Pressable` is its `memo`, the `View` it renders,
 * the host and, in development builds, a `PressabilityDebugView`; the real
 * `Text` is one composite, the host and the string. An app's own row-cost
 * harness measures those.
 */

interface Fiber {
  tag: number;
  child: Fiber | null;
  sibling: Fiber | null;
  memoizedState: { next?: unknown } | null;
}

const HOOK_TAGS = new Set([0, 11, 14, 15]);

/** Fibers and hook slots in an instance's subtree, the instance included. */
function cost(instance: ReactTestInstance) {
  const root = (instance as unknown as { _fiber: Fiber })._fiber;
  let fibers = 0;
  let hooks = 0;
  const stack: Fiber[] = [root];
  while (stack.length > 0) {
    const fiber = stack.pop() as Fiber;
    fibers += 1;
    if (HOOK_TAGS.has(fiber.tag)) {
      for (let hook = fiber.memoizedState; hook; hook = (hook.next as typeof hook) ?? null) {
        hooks += 1;
      }
    }
    if (fiber.child) stack.push(fiber.child);
    if (fiber.sibling && fiber !== root) stack.push(fiber.sibling);
  }
  return { fibers, hooks };
}

const Glyph: BloomIconComponent = () => null;
const ActiveGlyph: BloomIconComponent = () => null;

function mount(ui: React.ReactElement) {
  const { UNSAFE_root: root, unmount } = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
  return { root, unmount };
}

type Mounted = ReturnType<typeof mount>;

/** A `memo` instance's test-renderer type is the function it wraps. */
const ACTION_RENDER = (EngagementAction as unknown as { type: unknown }).type;
const actions = (renderer: Mounted) => renderer.root.findAll((node) => node.type === ACTION_RENDER);
const pressable = (renderer: Mounted, label: string) =>
  renderer.root.find(
    (node) => String(node.type) === 'Pressable' && node.props.accessibilityLabel === label,
  );
const animated = (renderer: Mounted) =>
  renderer.root.findAll((node) => String(node.type) === 'Animated.View');

describe('EngagementAction at rest', () => {
  it('is one pressable host, its glyph and, with a count, one text', () => {
    const renderer = mount(
      <EngagementBar trailing={<EngagementAction icon={Glyph} accessibilityLabel="Save" />}>
        <EngagementAction icon={Glyph} accessibilityLabel="Reply" count={0} onPress={() => {}} />
        <EngagementAction
          icon={Glyph}
          activeIcon={ActiveGlyph}
          accessibilityLabel="Like"
          count={1200}
          active
          tone="error"
          popOnActivate
          rollCount
          onPress={() => {}}
        />
      </EngagementBar>,
    );
    const [reply, like, save] = actions(renderer).map(cost);
    // the action + Pressable (2) + the glyph
    expect(reply).toEqual({ fibers: 4, hooks: 1 });
    expect(save).toEqual({ fibers: 4, hooks: 1 });
    // + Text (2) and its string
    expect(like).toEqual({ fibers: 7, hooks: 1 });
    expect(animated(renderer)).toHaveLength(0);
    expect(renderer.root.findByType(ActiveGlyph)).toBeTruthy();
    renderer.unmount();
  });

  it('formats a count through the bar, and announces a toggle in both spellings', () => {
    const renderer = mount(
      <EngagementBar formatCount={(n) => `${n} x`}>
        <EngagementAction icon={Glyph} accessibilityLabel="Like" count={3} active={false} />
        <EngagementGroup>
          <EngagementAction icon={Glyph} accessibilityLabel="Share" />
        </EngagementGroup>
      </EngagementBar>,
    );
    const like = pressable(renderer, 'Like');
    expect(like.findByProps({ children: '3 x' })).toBeTruthy();
    expect(like.props['aria-pressed']).toBe(false);
    expect(like.props.accessibilityState).toEqual({
      selected: false,
      busy: false,
      disabled: false,
    });
    expect(pressable(renderer, 'Share').props['aria-pressed']).toBeUndefined();
    renderer.unmount();
  });
});

describe('EngagementAction motion', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function Like({ onLike }: { onLike: () => boolean }) {
    const [liked, setLiked] = React.useState(false);
    return (
      <EngagementBar>
        <EngagementAction
          icon={Glyph}
          accessibilityLabel="Like"
          count={liked ? 4 : 3}
          active={liked}
          tone="error"
          popOnActivate
          rollCount
          onPress={() => {
            if (onLike() === false) return false;
            setLiked((value) => !value);
          }}
        />
      </EngagementBar>
    );
  }

  it('animates only the press it accepted, and returns to rest when done', () => {
    const rejected = mount(<Like onLike={() => false} />);
    act(() => pressable(rejected, 'Like').props.onPress());
    expect(animated(rejected)).toHaveLength(0);
    rejected.unmount();

    const renderer = mount(<Like onLike={() => true} />);
    act(() => pressable(renderer, 'Like').props.onPress());
    // The pop's glyph and ring, and the roll's incoming and outgoing counts.
    expect(animated(renderer)).toHaveLength(4);
    act(() => jest.runAllTimers());
    expect(animated(renderer)).toHaveLength(0);
    renderer.unmount();
  });
});
