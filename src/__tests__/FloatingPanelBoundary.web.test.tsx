/** @jest-environment jsdom */
import React, { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Button } from '../button/Button.web';
import { PlacementBoundaryContext } from '../overlay/placement-boundary';
import { resetOverlayStack } from '../overlay/stack';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/Popover.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const rect = (left: number, top: number, right: number, bottom: number) =>
  ({
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
  }) as DOMRect;

// jsdom lays nothing out, so each node answers with the box it would have in a
// two-panel desktop layout: the reader's panel is the right-hand 400px, and the
// trigger sits at that panel's left edge.
const BOXES: Record<string, DOMRect | undefined> = {
  panel: rect(600, 0, 1000, 500),
  narrow: rect(600, 0, 700, 500),
  trigger: rect(610, 100, 640, 140),
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  resetOverlayStack();
  Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 500, configurable: true });
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: Element,
  ) {
    // The anchor is the wrapper `TriggerSlot` puts around the trigger: the one
    // node that holds the trigger button and is not the surface.
    const isAnchor =
      !this.matches('[role="dialog"]') && this.firstElementChild?.tagName === 'BUTTON';
    const key = this.getAttribute('data-box') ?? (isAnchor ? 'trigger' : null);
    return (key && BOXES[key]) || rect(0, 0, 0, 0);
  });
  // The surface itself: 200x100, whatever it renders.
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200);
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetOverlayStack();
  jest.restoreAllMocks();
});

function Fixture({ boundary }: { boundary: 'panel' | 'narrow' | null }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const body = (
    <Popover open onOpenChange={() => {}}>
      <PopoverTrigger asChild>
        <Button>Open</Button>
      </PopoverTrigger>
      <PopoverContent label="Menu" align="end">
        <Button>Item</Button>
      </PopoverContent>
    </Popover>
  );
  return boundary ? (
    <div ref={panelRef} data-box={boundary}>
      <PlacementBoundaryContext.Provider value={panelRef}>{body}</PlacementBoundaryContext.Provider>
    </div>
  ) : (
    body
  );
}

function surfaceLeft(boundary: 'panel' | 'narrow' | null): number {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light">
        <Fixture boundary={boundary} />
      </BloomThemeProvider>,
    );
  });
  const surface = document.querySelector<HTMLElement>('[role="dialog"]');
  expect(surface).not.toBeNull();
  return parseFloat(surface!.style.left);
}

describe('FloatingPanel inside a panel', () => {
  it('without a panel, fits the viewport: the surface hangs over the left neighbour', () => {
    expect(surfaceLeft(null)).toBe(440);
  });

  it('stays inside its panel while it fits there', () => {
    expect(surfaceLeft('panel')).toBe(608);
  });

  it('falls back to the viewport when the panel is too narrow for it', () => {
    expect(surfaceLeft('narrow')).toBe(440);
  });
});
