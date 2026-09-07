/**
 * @jest-environment jsdom
 */

// A PRESET THAT ARRIVES LATE MUST NOT REMOUNT THE SUBTREE.
//
// `BloomColorScope` is mounted high — in Mention it wraps the app's whole route
// stack — and its preset is frequently unknown on the first render: the profile
// screen learns the account's color only once the profile fetch lands, a few
// hundred milliseconds after the route opens.
//
// The scope used to answer "no preset" with `return <>{children}</>`, two
// provider levels shallower than the preset path. React reconciles by POSITION,
// so the render in which the preset arrives finds different element types there
// and unmounts everything below to mount it again. That destroyed the navigator
// underneath: the pushed child route and its `[username]` param went with it,
// and a profile opened from the videos reel painted "Profile not found" a second
// after it had painted correctly. Scroll positions and video players went the
// same way, invisibly.
//
// The assertion is on MOUNT COUNT, not on rendered output: output is identical
// either way round, which is exactly why the bug survived so long. A child that
// counts its own mounts can only report a remount, so the test cannot pass for
// the wrong reason.

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BloomThemeProvider } from '../BloomThemeProvider';
import { BloomColorScope } from '../color-scope/ColorScope.web';
import type { AppColorName } from '../color-presets';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
let mounts = 0;

beforeEach(() => {
  mounts = 0;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** Stands in for everything the scope wraps that owns state — a navigator, a list, a player. */
function MountCounter() {
  React.useEffect(() => {
    mounts += 1;
  }, []);
  return <span data-testid="child">child</span>;
}

function render(preset: AppColorName | undefined) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <BloomColorScope colorPreset={preset} asChild>
          <div data-testid="scoped">
            <MountCounter />
          </div>
        </BloomColorScope>
      </BloomThemeProvider>,
    );
  });
}

describe('a color preset arriving after the first render', () => {
  it('does not remount the subtree', () => {
    render(undefined);
    expect(mounts).toBe(1);

    render('grove');

    // 2 would mean the subtree was torn down and rebuilt — the bug.
    expect(mounts).toBe(1);
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it('does not remount it when the preset goes away again', () => {
    render('grove');
    expect(mounts).toBe(1);

    render(undefined);

    expect(mounts).toBe(1);
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it('still publishes the preset’s variables once it arrives, and stops when it goes', () => {
    // The scope's OWN element, not the theme provider's — that one carries the
    // app-wide preset and would report a variable in every branch.
    const scoped = () =>
      container.querySelector<HTMLElement>('[data-testid="scoped"]')!.style.getPropertyValue('--primary');

    render(undefined);
    const before = scoped();

    render('grove');
    const during = scoped();

    render(undefined);
    const after = scoped();

    // Not just "no remount" — the scope has to keep DOING its job across the
    // change, or a stable tree would be a stable wrong one.
    expect(before).toBe('');
    expect(during).not.toBe('');
    expect(after).toBe('');
  });
});
