/**
 * @jest-environment jsdom
 */

/**
 * `UserHoverCard` and the hover bridge that floats it, checked against the DOM
 * react-native-web actually produces.
 *
 * Two things live here that a prop-level test cannot see:
 *
 * 1. WHERE THE `footer` SLOT LANDS. On web the identity area is a real
 *    `role="button"`, and every text node INSIDE a button contributes to its
 *    accessible name. Nested, a contribution graph or a "3 mutual followers"
 *    line would be read out as part of the person's name, and a press anywhere
 *    on it would open the profile. Rendering it as a SIBLING is what prevents
 *    both, and only the emitted DOM shows which one happened.
 *
 * 2. THAT A PRESSABLE INSIDE THE CARD DOES NOT DISMISS IT. react-native-web's
 *    `Pressable` calls `useHover` with `contain: true`, which dispatches a
 *    BUBBLING `react-gui:hover:lock` event on itself; an ancestor `Pressable`
 *    that is currently hovered ends its own hover for any lock whose target is
 *    not itself. The hover bridge in `AvatarGroup.web.tsx` used to be such a
 *    `Pressable`, so reaching the FollowButton — or the identity area — closed
 *    the card ~120ms later, with nothing in the console. The bridge is now a
 *    `View` with `pointerenter`/`pointerleave`, which do not bubble and do not
 *    fire when the cursor moves between descendants.
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByRole, getByText, queryByText } from '@testing-library/dom';

// This suite is about what react-native-web puts in the DOM and which events it
// listens to, so it runs against the REAL RNW. Under the repo-wide `react-native`
// mock every assertion below would read a stub back and pass either way.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Pressable, Text } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalProvider, PortalOutlet } from '../portal';
import { UserHoverCard } from '../user-hover-card';
import { AvatarGroup } from '../avatar-group/AvatarGroup.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

/**
 * The outlet is mounted because jest resolves the fork's RELATIVE `'../portal'`
 * to the NATIVE barrel — export conditions do not apply to relative specifiers,
 * and there is no `.web` extension resolution here (a web bundler adds one; see
 * `.storybook/main.ts`). The portal is not what these tests measure, so the
 * native one, given its outlet, serves fine.
 */
function mount(ui: React.ReactElement): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <PortalProvider>
          {ui}
          <PortalOutlet />
        </PortalProvider>
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

describe('UserHoverCard on web', () => {
  it('keeps the footer out of the identity button, so it is not part of its name', () => {
    mount(
      <UserHoverCard
        displayName="Nate Isern"
        username="nate"
        onPressProfile={() => {}}
        footer={<Text>Contribution graph</Text>}
      />,
    );

    const identity = getByRole(container, 'button', { name: 'Nate Isern (@nate)' });
    // Positive control: without it, a slot that never rendered would satisfy
    // "not inside the button" just as well as a correctly placed one.
    expect(getByText(container, 'Contribution graph')).toBeTruthy();
    expect(queryByText(identity, 'Contribution graph')).toBeNull();
  });
});

/**
 * Enter/leave, dispatched in BOTH spellings the two layers listen to.
 *
 * react-native-web's `useHover` attaches its own `mouseenter`/`mouseleave`
 * listeners straight to the node (no PointerEvent in jsdom, so it takes the
 * mouse fallback). React DOM, which is what delivers a `View`'s
 * `onPointerEnter`/`onPointerLeave`, synthesises those from the BUBBLING
 * `pointerover`/`pointerout` pair plus `relatedTarget`. A test that sent only
 * one spelling would exercise only one of the two layers — and the bug being
 * pinned lives in the seam between them.
 */
function hoverIn(target: Element, from: Element = document.body) {
  act(() => {
    target.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: false, view: window, relatedTarget: from }),
    );
    target.dispatchEvent(
      new MouseEvent('pointerover', { bubbles: true, view: window, relatedTarget: from }),
    );
  });
}

function hoverOut(target: Element, to: Element = document.body) {
  act(() => {
    target.dispatchEvent(
      new MouseEvent('mouseleave', { bubbles: false, view: window, relatedTarget: to }),
    );
    target.dispatchEvent(
      new MouseEvent('pointerout', { bubbles: true, view: window, relatedTarget: to }),
    );
  });
}

describe('AvatarGroup hover bridge', () => {
  const ITEMS = [
    { id: '1', displayName: 'Ada Lovelace', username: 'ada' },
    { id: '2', displayName: 'Grace Hopper', username: 'grace' },
  ];

  function group() {
    return (
      <AvatarGroup
        items={ITEMS}
        hoverCard
        onPressItem={() => {}}
        renderItemAction={() => (
          // A `Pressable`, because the real injected action is one — the SDK's
          // FollowButton. A `View` here would not exercise the bug at all.
          <Pressable onPress={() => {}}>
            <Text>Follow</Text>
          </Pressable>
        )}
      />
    );
  }

  /** The bridge: the nearest fixed-position ancestor of the card's content. */
  function bridgeOf(node: HTMLElement): HTMLElement {
    let n: HTMLElement | null = node;
    while (n && getComputedStyle(n).position !== 'fixed') n = n.parentElement;
    if (!n) throw new Error('no positioned bridge above the card');
    return n;
  }

  /** Hovers the first avatar and moves the cursor onto the card. */
  function openCard(): { bridge: HTMLElement; action: HTMLElement } {
    const cell = getByRole(container, 'button', { name: 'Ada Lovelace (@ada)' });
    hoverIn(cell);
    // `measureInWindow` positions the card from a `setTimeout(0)`.
    act(() => {
      jest.advanceTimersByTime(1);
    });
    const follow = queryByText(document.body, 'Follow');
    if (!follow) throw new Error('hover card did not open');
    const bridge = bridgeOf(follow);
    // The cursor travels off the avatar and onto the card, which is the whole
    // reason the bridge exists.
    hoverOut(cell, bridge);
    hoverIn(bridge, cell);
    // `follow` is the Text; the Pressable that wraps it is what dispatches the
    // hover lock.
    const action = follow.parentElement;
    if (!action) throw new Error('action has no host element');
    return { bridge, action };
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stays open when the cursor reaches a Pressable inside the card', () => {
    mount(group());
    const { bridge, action } = openCard();
    // Control: the card is open before the nested hover, or the assertion below
    // would pass against a card that never appeared.
    expect(queryByText(document.body, 'Follow')).not.toBeNull();

    hoverIn(action, bridge);
    act(() => {
      // Well past the bridge's 120ms close delay.
      jest.advanceTimersByTime(500);
    });

    expect(queryByText(document.body, 'Follow')).not.toBeNull();
  });

  it('still dismisses when the cursor leaves the card entirely', () => {
    mount(group());
    const { bridge } = openCard();
    expect(queryByText(document.body, 'Follow')).not.toBeNull();

    hoverOut(bridge, document.body);
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(queryByText(document.body, 'Follow')).toBeNull();
  });
});
