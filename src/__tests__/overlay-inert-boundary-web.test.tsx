/**
 * @jest-environment jsdom
 */

// Web half of `OverlayInertBoundary` (OxyHQ/Mention#1126). The DOM attributes
// are the whole point, so this runs against the REAL react-native-web — the
// repo-wide `react-native` mock would render nothing a browser would see.
//
// Pins: the page is `inert` + `aria-hidden` only while a modal overlay is open;
// a non-modal overlay leaves it alone; and the boundary generates no box
// (`display: contents`), so a document-scrolling page lays out as before.

import { createElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Text } from 'react-native';

import { OverlayInertBoundary, OverlayRoot } from '../overlay';
import { resetModalOverlays } from '../overlay/modal-registry';
import { resetOverlayStack } from '../overlay/stack';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

function app(surface: 'none' | 'modal' | 'plain') {
  return createElement(
    'div',
    null,
    createElement(
      OverlayInertBoundary,
      { testID: 'content' },
      createElement(Text, null, 'Home feed'),
    ),
    surface === 'none'
      ? null
      : createElement(OverlayRoot, {
          testID: 'surface',
          modal: surface === 'modal',
          children: createElement(Text, null, 'Settings'),
        }),
  );
}

function mount(surface: 'none' | 'modal' | 'plain') {
  act(() => root.render(app(surface)));
}

const content = () => container.querySelector('[data-testid="content"]') as HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetModalOverlays();
  resetOverlayStack();
});

describe('OverlayInertBoundary (web)', () => {
  it('makes the page inert and hidden while a modal is open, and restores it', () => {
    mount('none');
    expect(content().hasAttribute('inert')).toBe(false);
    expect(content().hasAttribute('aria-hidden')).toBe(false);

    mount('modal');
    expect(content().hasAttribute('inert')).toBe(true);
    expect(content().getAttribute('aria-hidden')).toBe('true');
    // The surface is outside the boundary and stays reachable.
    const surface = container.querySelector('[data-testid="surface"]');
    expect(surface?.closest('[inert]')).toBeNull();

    mount('none');
    expect(content().hasAttribute('inert')).toBe(false);
    expect(content().hasAttribute('aria-hidden')).toBe(false);
  });

  it('a non-modal overlay leaves the page reachable', () => {
    mount('plain');
    expect(content().hasAttribute('inert')).toBe(false);
    expect(content().hasAttribute('aria-hidden')).toBe(false);
  });

  it('generates no box of its own', () => {
    mount('none');
    expect(getComputedStyle(content()).display).toBe('contents');
  });
});
