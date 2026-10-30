import React from 'react';
import * as ReactNative from 'react-native';
import { Modal, Platform, StyleSheet, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

// Explicit native owners: Jest resolves bare `./X`, never `.native.*`, and the
// web dispatcher must not stand in for this coverage.
import BottomSheet from '../bottom-sheet/BottomSheet';
import type { BottomSheetRef } from '../bottom-sheet/types';
import {
  DETACHED_SHEET_SIDE_GAP,
  SHEET_MAX_WIDTH,
  sheetSideInsetFor,
} from '../bottom-sheet/BottomSheetBase';
import { CenteredCard, CENTERED_CARD_GUTTER } from '../dialog/CenteredCard';
import { Dialog } from '../dialog/Dialog';
import { useDialogControl } from '../dialog/context';
import { presentsAsDesktop } from '../dialog/placement';
import { SheetShell } from '../dialog/SheetShell';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { hostNodes, resolvedStyle } from './support/rendered-style';
import { declaration } from './support/menubar-declaration';
import * as MenubarParts from '../menubar';
import { PortalOutlet, PortalProvider } from '../portal';

const MAC_WINDOW = { width: 1360, height: 860, scale: 2, fontScale: 1 };
const PHONE_WINDOW = { width: 375, height: 812, scale: 3, fontScale: 1 };

let windowSize = PHONE_WINDOW;
const originalOS = Platform.OS;

beforeEach(() => {
  windowSize = PHONE_WINDOW;
  jest.spyOn(ReactNative, 'useWindowDimensions').mockImplementation(() => windowSize);
  jest.useFakeTimers();
});

afterEach(() => {
  Platform.OS = originalOS;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function Harness({
  children,
}: {
  children: (control: ReturnType<typeof useDialogControl>) => React.ReactNode;
}) {
  const control = useDialogControl();
  return <>{children(control)}</>;
}

function renderDialog(props: Partial<React.ComponentProps<typeof Dialog>> = {}) {
  let control!: ReturnType<typeof useDialogControl>;
  const tree = () => (
    <BloomThemeProvider fonts={false}>
      <Harness>
        {(c) => {
          control = c;
          return (
            <Dialog control={c} label="Sign in" testID="sign-in" {...props}>
              <Text>Use your Oxy account</Text>
            </Dialog>
          );
        }}
      </Harness>
    </BloomThemeProvider>
  );
  const view = render(tree());
  return { view, tree, control: () => control };
}

function pressBackdrop(view: ReturnType<typeof render>) {
  const card = view.UNSAFE_getByType(CenteredCard);
  const backdrop = card.findAll(
    (node) => typeof node.props.onPress === 'function' && node.props.progress !== undefined,
  )[0];
  backdrop?.props.onPress();
}

const flat = (style: unknown): ReactNative.ViewStyle =>
  StyleSheet.flatten(style as ReactNative.StyleProp<ReactNative.ViewStyle>) ?? {};

describe('presentsAsDesktop', () => {
  it.each([
    ['macos', 320, true],
    ['windows', 500, true],
    ['ios', 375, false],
    ['android', 767, false],
    ['android', 768, true],
    ['ios', 1024, true],
  ])('%s at %ipx → %s', (os, width, expected) => {
    expect(presentsAsDesktop(os, width)).toBe(expected);
  });
});

describe('native Dialog, placement center', () => {
  it('presents as a centred card on macOS, sized as the web card', () => {
    Platform.OS = 'macos';
    windowSize = MAC_WINDOW;
    const { view, control } = renderDialog({ placement: { base: 'bottom', md: 'center' } });
    act(() => control().open());

    const card = view.UNSAFE_getByType(CenteredCard);
    expect(view.UNSAFE_queryByProps({ detached: true })).toBeNull();
    expect(view.UNSAFE_getAllByType(Modal)).toHaveLength(1);
    expect(view.getByText('Use your Oxy account')).toBeTruthy();

    const panel = card.findAll((node) => node.props.accessibilityViewIsModal === true)[0];
    const style = flat(panel?.props.style);
    expect(style.maxWidth).toBe(480);
    expect(style.maxHeight).toBe(Math.round(860 * 0.9));
    expect(style.width).toBe('100%');
    expect(style.borderWidth).toBe(1);
    expect(style.bottom).toBeUndefined();

    const frame = flat(panel?.parent?.props.style);
    expect(frame.alignItems).toBe('center');
    expect(frame.justifyContent).toBe('center');
    expect(frame.paddingLeft).toBe(CENTERED_CARD_GUTTER);
    expect(frame.paddingRight).toBe(CENTERED_CARD_GUTTER);
  });

  it('honours the maxWidth the web honours', () => {
    Platform.OS = 'macos';
    windowSize = MAC_WINDOW;
    const { view, control } = renderDialog({ maxWidth: 420 });
    act(() => control().open());
    const panel = view
      .UNSAFE_getByType(CenteredCard)
      .findAll((node) => node.props.accessibilityViewIsModal === true)[0];
    expect(flat(panel?.props.style).maxWidth).toBe(420);
  });

  it('presents as a centred card on any wide window', () => {
    windowSize = { ...MAC_WINDOW, width: 1024 };
    const { view, control } = renderDialog();
    act(() => control().open());
    expect(view.UNSAFE_queryByType(CenteredCard)).not.toBeNull();
  });

  it('keeps the floating sheet on a phone', () => {
    const { view, control } = renderDialog();
    act(() => control().open());
    expect(view.UNSAFE_queryByType(CenteredCard)).toBeNull();
    expect(view.UNSAFE_queryByProps({ detached: true })).not.toBeNull();
  });

  it('closes on Escape (the Modal’s onRequestClose) and on a backdrop press', () => {
    Platform.OS = 'macos';
    windowSize = MAC_WINDOW;
    const onClose = jest.fn();
    const { view, control } = renderDialog({ onClose });

    act(() => control().open());
    act(() => view.UNSAFE_getByType(Modal).props.onRequestClose());
    act(() => jest.runOnlyPendingTimers());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(view.queryByText('Use your Oxy account')).toBeNull();

    act(() => control().open());
    act(() => pressBackdrop(view));
    act(() => jest.runOnlyPendingTimers());
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('stays open on Escape and a backdrop press when dismissOnBackdrop is false', () => {
    Platform.OS = 'macos';
    windowSize = MAC_WINDOW;
    const onClose = jest.fn();
    const { view, control } = renderDialog({ onClose, dismissOnBackdrop: false });
    act(() => control().open());
    act(() => view.UNSAFE_getByType(Modal).props.onRequestClose());
    act(() => pressBackdrop(view));
    act(() => jest.runOnlyPendingTimers());
    expect(onClose).not.toHaveBeenCalled();
    expect(view.getByText('Use your Oxy account')).toBeTruthy();
  });

  it('keeps its presentation through a resize across the breakpoint until it has closed', () => {
    windowSize = { ...MAC_WINDOW, width: 1000 };
    const { view, tree, control } = renderDialog();
    act(() => control().open());
    const draft = view.getByText('Use your Oxy account');

    windowSize = { ...PHONE_WINDOW, width: 320 };
    view.rerender(tree());
    expect(view.getByText('Use your Oxy account')).toBe(draft);
    expect(view.UNSAFE_queryByType(CenteredCard)).not.toBeNull();

    act(() => control().close());
    act(() => jest.runOnlyPendingTimers());
    act(() => control().open());
    expect(view.UNSAFE_queryByType(CenteredCard)).toBeNull();
    expect(view.UNSAFE_queryByProps({ detached: true })).not.toBeNull();
  });
});

describe('CenteredCard lifecycle', () => {
  it('reports its dismissal once, even when unmounted in the middle of its exit', () => {
    const onDismiss = jest.fn();
    const ref = React.createRef<BottomSheetRef>();
    const view = render(
      <BloomThemeProvider fonts={false}>
        <CenteredCard ref={ref} open onDismiss={onDismiss}>
          <Text>Card</Text>
        </CenteredCard>
      </BloomThemeProvider>,
    );
    act(() => ref.current?.dismiss());
    view.unmount();
    act(() => jest.runOnlyPendingTimers());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('native SheetShell', () => {
  function OpenShell({ anchored }: { anchored?: boolean }) {
    const control = useDialogControl();
    React.useEffect(() => {
      control.open();
    }, [control]);
    return (
      <SheetShell control={control} label="Menu" anchored={anchored}>
        <Text>Rename</Text>
      </SheetShell>
    );
  }

  it('presents a menu as a centred card without a drag handle on macOS', () => {
    Platform.OS = 'macos';
    windowSize = MAC_WINDOW;
    const view = render(
      <BloomThemeProvider fonts={false}>
        <OpenShell />
      </BloomThemeProvider>,
    );
    expect(view.UNSAFE_queryByType(CenteredCard)).not.toBeNull();
    expect(view.queryByHintText('Tap to close')).toBeNull();
    expect(view.getByText('Rename')).toBeTruthy();
  });

  it('keeps anchored content (a menu, a popover) in its sheet on macOS', () => {
    Platform.OS = 'macos';
    windowSize = MAC_WINDOW;
    const view = render(
      <BloomThemeProvider fonts={false}>
        <OpenShell anchored />
      </BloomThemeProvider>,
    );
    expect(view.UNSAFE_queryByType(CenteredCard)).toBeNull();
    expect(view.UNSAFE_queryByProps({ detached: true })).not.toBeNull();
    expect(view.getByText('Rename')).toBeTruthy();
  });

  it("opens a menu bar's menus as anchored content, never as a centred card", () => {
    Platform.OS = 'macos';
    windowSize = MAC_WINDOW;
    const view = render(
      <BloomThemeProvider fonts={false}>
        <PortalProvider>
          {declaration(MenubarParts, {}, {}, { defaultValue: 'file' })}
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
    expect(view.UNSAFE_queryAllByType(SheetShell).length).toBeGreaterThan(0);
    for (const shell of view.UNSAFE_queryAllByType(SheetShell)) {
      expect(shell.props.anchored).toBe(true);
    }
    expect(view.UNSAFE_queryByType(CenteredCard)).toBeNull();
  });

  it('keeps the sheet and its handle on a phone', () => {
    const view = render(
      <BloomThemeProvider fonts={false}>
        <OpenShell />
      </BloomThemeProvider>,
    );
    expect(view.UNSAFE_queryByType(CenteredCard)).toBeNull();
    expect(view.UNSAFE_queryByProps({ detached: true })).not.toBeNull();
    expect(view.queryByHintText('Tap to close')).not.toBeNull();
  });
});

describe('BottomSheet horizontal placement', () => {
  it.each([
    [375, 500, true, DETACHED_SHEET_SIDE_GAP],
    [375, SHEET_MAX_WIDTH, false, 0],
    [1360, 500, true, 430],
    [1360, SHEET_MAX_WIDTH, false, 280],
  ])('a %ipx window, %ipx cap, detached %s → %ipx each side', (width, cap, detached, inset) => {
    expect(sheetSideInsetFor(width, cap, detached)).toBe(inset);
  });

  it('centres a capped sheet in a wide native window instead of pinning it left', () => {
    windowSize = MAC_WINDOW;
    const view = render(
      <BloomThemeProvider fonts={false}>
        <BottomSheet open detached style={{ maxWidth: 500 }}>
          <Text>Sheet</Text>
        </BottomSheet>
      </BloomThemeProvider>,
    );
    const style = resolvedStyle(
      hostNodes(view.toJSON()).find((n) => resolvedStyle(n.props.style).maxWidth === 500)?.props
        .style,
    );
    expect(style.left).toBe(430);
    expect(style.right).toBe(430);
    expect(1360 - (style.left as number) - (style.right as number)).toBe(500);
  });
});
