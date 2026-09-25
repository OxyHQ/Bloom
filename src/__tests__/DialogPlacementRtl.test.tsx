/**
 * @jest-environment jsdom
 */

/**
 * Logical side-sheet placements: `start` / `end` land on the reading-start /
 * reading-end edge and slide in from it; `left` / `right` stay physical.
 *
 * Direction is driven the way each platform supplies it: `I18nManager.isRTL`
 * for the native fork, `document.documentElement.dir` for the web fork (both
 * read through `useIsRtl()`). The slide SIGN is `physicalDialogSide`'s answer —
 * with the panel open the mapper's `translateX` is zero whichever way it would
 * travel, so the sign is pinned on the function that decides it.
 */

import React from 'react';
import * as ReactNative from 'react-native';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { Dialog } from '../dialog/Dialog';
import { Dialog as DialogWeb } from '../dialog/Dialog.web';
import { physicalDialogSide, type DialogSidePlacement } from '../dialog/placement';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

// The web fork portals through react-dom, which the test renderer cannot host;
// what is asserted is the panel's own geometry, so the portal renders in place.
jest.mock('../portal/index.web', () => ({
  Portal: ({ children }: { children: React.ReactNode }) => children,
}));

const i18n = ReactNative.I18nManager as { isRTL: boolean };

afterEach(() => {
  i18n.isRTL = false;
  document.documentElement.removeAttribute('dir');
});

function renderIn(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        {ui}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
}

const INSET = { left: 10, right: 30 };

describe('physicalDialogSide', () => {
  it.each([
    ['start', false, 'left'],
    ['start', true, 'right'],
    ['end', false, 'right'],
    ['end', true, 'left'],
    ['left', true, 'left'],
    ['right', true, 'right'],
  ] as const)('%s (rtl=%s) lands on %s', (side, rtl, edge) => {
    expect(physicalDialogSide(side as DialogSidePlacement, rtl)).toBe(edge);
  });
});

describe('native fork', () => {
  function panel(placement: DialogSidePlacement) {
    const screen = renderIn(
      <Dialog open placement={placement} inset={INSET} testID="d">
        <Text>Filters</Text>
      </Dialog>,
    );
    return resolvedStyle(screen.getByTestId('d').props.style);
  }

  it('positions start/end with a LOGICAL key, and takes the inset of the edge it lands on', () => {
    let style = panel('start');
    expect(style.insetInlineStart).toBe(10);
    expect(style.left).toBeUndefined();
    expect(style.right).toBeUndefined();
    i18n.isRTL = true;
    style = panel('start');
    expect(style.insetInlineStart).toBe(30);
    style = panel('end');
    expect(style.insetInlineEnd).toBe(10);
  });

  it('keeps left/right physical', () => {
    i18n.isRTL = true;
    expect(panel('left').left).toBe(10);
    expect(panel('right').right).toBe(30);
  });
});

describe('web fork', () => {
  const platform = ReactNative.Platform as { OS: string };
  const originalOS = platform.OS;
  beforeEach(() => {
    platform.OS = 'web';
  });
  afterEach(() => {
    platform.OS = originalOS;
  });

  function panel(placement: DialogSidePlacement) {
    const screen = renderIn(
      <DialogWeb open placement={placement} inset={INSET} testID="d">
        <Text>Filters</Text>
      </DialogWeb>,
    );
    return resolvedStyle(screen.getByTestId('d').props.style);
  }

  it('lands start on the left left-to-right and on the right right-to-left', () => {
    let style = panel('start');
    expect(style.left).toBe(10);
    expect(style.right).toBeUndefined();
    document.documentElement.dir = 'rtl';
    style = panel('start');
    expect(style.right).toBe(30);
    expect(style.left).toBeUndefined();
    // `end` is the reading end: the left edge right-to-left.
    style = panel('end');
    expect(style.left).toBe(10);
  });

  it('keeps left/right physical under rtl', () => {
    document.documentElement.dir = 'rtl';
    expect(panel('left').left).toBe(10);
    expect(panel('right').right).toBe(30);
  });
});
