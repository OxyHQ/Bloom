/**
 * A covered screen's lens controls are drawn in their place, against the screen's fill, never by the
 * window over the screen in front: the window overlay draws a resting lens above everything, and
 * Mention drew Home's header over the settings modal a deep link opened (Pixel 8a). A lens drawn in
 * its place is one whose native view has a `restBackdrop`; the lens base sets it from `LensCover`.
 *
 * The base is the real one (`@oxy.so/bloom-lens`, its Android menu trigger); only its native view is
 * a stand-in, whose props are the contract with the engine.
 */
import { createElement } from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { stackSceneLayout } from '../panel-routing/expo-router';
import { OverlayInertBoundary } from '../overlay/OverlayInertBoundary';
import { registerModalOverlay } from '../overlay/modal-registry';
import { LensCover } from '../floating/lens/lens-cover';
import { getNativeLens } from '../floating/lens/native-lens';

jest.mock(
  'expo',
  () => {
    const { createElement, forwardRef, useImperativeHandle } = jest.requireActual('react');
    const NativeLens = forwardRef(function NativeLens(props: object, ref: unknown) {
      useImperativeHandle(ref, () => ({ open: async () => {}, close: async () => {} }));
      return createElement('BloomLensMenu', props);
    });
    return { requireNativeView: () => NativeLens };
  },
  { virtual: true },
);
jest.mock('../../packages/bloom-lens/src/menu/components/menu-trigger/menu-trigger', () =>
  jest.requireActual(
    '../../packages/bloom-lens/src/menu/components/menu-trigger/menu-trigger.android',
  ),
);
jest.mock('../floating/lens/native-lens', () => {
  const actual = jest.requireActual('../floating/lens/native-lens');
  const lens = jest.requireActual('../../packages/bloom-lens/src');
  return { ...actual, getNativeLens: () => lens };
});

let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused }));

const FILL = '#123456';

/** A header control: a lens base the window draws while its screen is in front. */
function Control({ restBackdrop }: { restBackdrop?: string }) {
  const lens = getNativeLens();
  if (!lens) throw new Error('the lens did not resolve');
  return createElement(lens.LensBase, { restBackdrop }, <Text>Search</Text>);
}

function restBackdrop(tree: ReturnType<typeof render>): string | undefined {
  const views = tree.UNSAFE_root.findAll((node) => (node.type as unknown) === 'BloomLensMenu');
  expect(views).toHaveLength(1);
  return views[0]?.props.restBackdrop;
}

describe('a lens base on a covered screen is drawn in its place', () => {
  it('in front, the window draws it; covered, it draws itself against the fill', () => {
    const ui = (covered: boolean) => (
      <LensCover covered={covered} fill={FILL}>
        <Control />
      </LensCover>
    );
    const tree = render(ui(false));
    expect(restBackdrop(tree)).toBeUndefined();
    tree.rerender(ui(true));
    expect(restBackdrop(tree)).toBe(FILL);
    tree.rerender(ui(false));
    expect(restBackdrop(tree)).toBeUndefined();
  });

  it('a screen inside a covered screen is covered too, whatever it says', () => {
    const tree = render(
      <LensCover covered fill={FILL}>
        <LensCover covered={false} fill="#ffffff">
          <Control />
        </LensCover>
      </LensCover>,
    );
    expect(restBackdrop(tree)).toBe(FILL);
  });

  it("a base's own backdrop (a control in a scroll) stays its own", () => {
    const tree = render(
      <LensCover covered fill={FILL}>
        <Control restBackdrop="#abcdef" />
      </LensCover>,
    );
    expect(restBackdrop(tree)).toBe('#abcdef');
  });

  it('a stack scene under the one on top covers its controls', () => {
    const ui = () => (
      <BloomThemeProvider fonts={false}>
        <SurfaceLevelProvider level={1} fill={FILL}>
          {stackSceneLayout({ children: <Control /> })}
        </SurfaceLevelProvider>
      </BloomThemeProvider>
    );
    mockFocused = true;
    const tree = render(ui());
    expect(restBackdrop(tree)).toBeUndefined();
    mockFocused = false;
    tree.rerender(ui());
    expect(restBackdrop(tree)).toBe(FILL);
    mockFocused = true;
  });

  it('a modal overlay covers the app under it', () => {
    const tree = render(
      <BloomThemeProvider fonts={false}>
        <SurfaceLevelProvider level={1} fill={FILL}>
          <OverlayInertBoundary>
            <Control />
          </OverlayInertBoundary>
        </SurfaceLevelProvider>
      </BloomThemeProvider>,
    );
    expect(restBackdrop(tree)).toBeUndefined();
    let release: () => void = () => {};
    act(() => {
      release = registerModalOverlay({});
    });
    expect(restBackdrop(tree)).toBe(FILL);
    act(() => release());
    expect(restBackdrop(tree)).toBeUndefined();
  });
});
