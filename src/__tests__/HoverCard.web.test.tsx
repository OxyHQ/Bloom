/**
 * @jest-environment jsdom
 */

/**
 * `HoverCard` on WEB, against the DOM react-native-web really produces: WHEN the
 * card appears (hover intent, keyboard focus, never a touch) and that it stays
 * up while the pointer travels onto it — including onto a `Pressable` inside,
 * which is the hover-lock trap `HoverCardPanel` documents.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByText, queryByText } from '@testing-library/dom';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Pressable, Text } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../hover-card/HoverCard.web';
import { HOVER_CARD_CLOSE_DELAY, HOVER_CARD_OPEN_DELAY } from '../hover-card/constants';
import { UserHoverCard } from '../user-hover-card';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

function mount(ui: React.ReactElement) {
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
}

/** React synthesises `onPointerEnter`/`Leave` from the bubbling over/out pair. */
function pointer(type: 'pointerover' | 'pointerout', target: Element, related: Element, pointerType = 'mouse') {
  const event = new MouseEvent(type, { bubbles: true, view: window, relatedTarget: related });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  act(() => {
    target.dispatchEvent(event);
  });
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

const onOpenChange = jest.fn();

function card() {
  return (
    <HoverCard onOpenChange={onOpenChange}>
      <HoverCardTrigger testID="trigger">
        <Text>@nate</Text>
      </HoverCardTrigger>
      <HoverCardContent label="Nate">
        <Text>Profile card</Text>
        <Pressable onPress={() => {}}>
          <Text>Follow</Text>
        </Pressable>
      </HoverCardContent>
    </HoverCard>
  );
}

const trigger = () => getByText(container, '@nate').parentElement as HTMLElement;
const isOpen = () => queryByText(document.body, 'Profile card') !== null;

beforeEach(() => onOpenChange.mockClear());

describe('HoverCard (web)', () => {
  it('opens only after the open delay', () => {
    mount(card());
    pointer('pointerover', trigger(), document.body);
    advance(HOVER_CARD_OPEN_DELAY - 50);
    expect(isOpen()).toBe(false);
    advance(100);
    expect(isOpen()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('does not open when the pointer only passes over the trigger', () => {
    mount(card());
    pointer('pointerover', trigger(), document.body);
    advance(100);
    pointer('pointerout', trigger(), document.body);
    advance(1000);
    expect(isOpen()).toBe(false);
    // Nothing opened, so nothing is reported closed either.
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('ignores a touch pointer', () => {
    mount(card());
    pointer('pointerover', trigger(), document.body, 'touch');
    advance(1000);
    expect(isOpen()).toBe(false);
  });

  it('stays open while the pointer is on the card, including on a Pressable in it', () => {
    mount(card());
    pointer('pointerover', trigger(), document.body);
    advance(HOVER_CARD_OPEN_DELAY);
    expect(isOpen()).toBe(true);

    const follow = getByText(document.body, 'Follow').parentElement as HTMLElement;
    pointer('pointerout', trigger(), follow);
    pointer('pointerover', follow, trigger());
    // Twice: a close would schedule the panel's exit timer, which must also run
    // before "still mounted" means "still open".
    advance(1000);
    advance(1000);
    expect(isOpen()).toBe(true);

    pointer('pointerout', follow, document.body);
    advance(HOVER_CARD_CLOSE_DELAY);
    // The panel's exit runs on a timer scheduled by the close itself.
    advance(1000);
    expect(isOpen()).toBe(false);
  });

  it('draws the surface once: a UserHoverCard inside paints no border of its own', () => {
    mount(
      <HoverCard defaultOpen>
        <HoverCardTrigger>
          <Text>@nate</Text>
        </HoverCardTrigger>
        <HoverCardContent label="Nate">
          <UserHoverCard displayName="Nate Isern" username="nate" testID="user-card" />
        </HoverCardContent>
      </HoverCard>,
    );
    const userCard = document.querySelector('[data-testid="user-card"]') as HTMLElement;
    expect(userCard).not.toBeNull();
    expect(getComputedStyle(userCard).borderTopWidth).not.toBe('1px');
    expect(getComputedStyle(userCard).paddingTop).not.toBe('15px');
  });
});
