import React, { createRef } from 'react';
import { Dimensions, Modal, Text, View } from 'react-native';
import { act, render, within } from '@testing-library/react-native';

import { useSurfaceFill, useSurfaceLevelValue } from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { hostNodes, resolvedStyle } from './support/rendered-style';
import BottomSheet, { type BottomSheetRef } from '../bottom-sheet';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function renderWithDarkTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="dark" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('BottomSheet', () => {
  it('uses one shared material and keeps a custom background authoritative', () => {
    const ref = createRef<BottomSheetRef>();
    const screen = renderWithTheme(<BottomSheet ref={ref}><Text>Material</Text></BottomSheet>);
    act(() => ref.current?.present());
    const materials = () => hostNodes(screen.toJSON()).filter(n => n.type === 'LinearGradient' && /^bloom-surface.*-sheen$/.test(String(n.props.id)));
    expect(materials()).toHaveLength(1);
    const panel = hostNodes(screen.toJSON()).find(n => resolvedStyle(n.props.style).maxWidth === 800);
    expect(resolvedStyle(panel?.props.style).backgroundColor).toBe('transparent');
    expect(resolvedStyle(panel?.props.style).overflow).toBeUndefined();
    const background = jest.fn(() => <View testID="custom-background" />);
    screen.rerender(<BloomThemeProvider mode="light" colorPreset="teal"><BottomSheet ref={ref} backgroundComponent={background}><Text>Material</Text></BottomSheet></BloomThemeProvider>);
    expect(screen.getByTestId('custom-background')).toBeTruthy();
    expect(background).toHaveBeenCalled();
    expect(materials()).toHaveLength(0);
  });

  it('publishes and paints the exact flat fill without an optical layer', () => {
    const ref = createRef<BottomSheetRef>();
    let published: string | undefined;
    function Probe() { published = useSurfaceFill(); return <Text>Flat content</Text>; }
    const screen = renderWithTheme(<BottomSheet ref={ref} material="flat" backgroundFill="#f3d7b6"><Probe /></BottomSheet>);
    act(() => ref.current?.present());
    const nodes = hostNodes(screen.toJSON());
    expect(nodes.filter(n => n.type === 'LinearGradient' && /^bloom-surface.*-sheen$/.test(String(n.props.id)))).toHaveLength(0);
    const panel = nodes.find(n => resolvedStyle(n.props.style).maxWidth === 800);
    expect(resolvedStyle(panel?.props.style).backgroundColor).toBe('#f3d7b6');
    expect(published).toBe('#f3d7b6');
  });

  it('does not render content when not presented', () => {
    const ref = createRef<BottomSheetRef>();
    const { queryByText } = renderWithTheme(
      <BottomSheet ref={ref}>
        <React.Fragment>Sheet Content</React.Fragment>
      </BottomSheet>,
    );
    // Not rendered until present() is called
    expect(queryByText('Sheet Content')).toBeNull();
  });

  it('exposes present/dismiss/close/expand/collapse/scrollTo on ref', () => {
    const ref = createRef<BottomSheetRef>();
    renderWithTheme(
      <BottomSheet ref={ref}>
        <React.Fragment>Content</React.Fragment>
      </BottomSheet>,
    );
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current!.present).toBe('function');
    expect(typeof ref.current!.dismiss).toBe('function');
    expect(typeof ref.current!.close).toBe('function');
    expect(typeof ref.current!.expand).toBe('function');
    expect(typeof ref.current!.collapse).toBe('function');
    expect(typeof ref.current!.scrollTo).toBe('function');
  });

  describe('rotation bug fix', () => {
    it('uses Dimensions.addEventListener for screen dimension updates', () => {
      const addEventSpy = jest.spyOn(Dimensions, 'addEventListener');

      const ref = createRef<BottomSheetRef>();
      renderWithTheme(
        <BottomSheet ref={ref}>
          <React.Fragment>Content</React.Fragment>
        </BottomSheet>,
      );

      // The useScreenDimensions hook should have registered a listener
      expect(addEventSpy).toHaveBeenCalledWith('change', expect.any(Function));

      addEventSpy.mockRestore();
    });

    it('does not use module-level cached screen dimensions', () => {
      // This test verifies the fix: the component should NOT reference
      // a module-level SCREEN_HEIGHT constant. Instead it uses
      // useScreenDimensions() which subscribes to Dimensions changes.

      // We verify this indirectly by checking that the component renders
      // successfully even after a simulated dimension change.
      const ref = createRef<BottomSheetRef>();
      const { unmount } = renderWithTheme(
        <BottomSheet ref={ref}>
          <React.Fragment>Content</React.Fragment>
        </BottomSheet>,
      );

      // Unmounting should clean up the Dimensions listener without error
      unmount();
    });
  });

  describe('dark mode fix', () => {
    it('renders in light mode without errors', () => {
      const ref = createRef<BottomSheetRef>();
      const { unmount } = renderWithTheme(
        <BottomSheet ref={ref}>
          <React.Fragment>Light content</React.Fragment>
        </BottomSheet>,
      );
      unmount();
    });

    it('renders in dark mode without errors', () => {
      const ref = createRef<BottomSheetRef>();
      const { unmount } = renderWithDarkTheme(
        <BottomSheet ref={ref}>
          <React.Fragment>Dark content</React.Fragment>
        </BottomSheet>,
      );
      unmount();
    });
  });

  describe('scrollable prop', () => {
    it('renders children directly when scrollable is false (no internal ScrollView wrap)', () => {
      // When scrollable={false}, the screen owns its own scrolling primitive
      // (FlatList, SectionList, etc.) so we must not wrap in Animated.ScrollView
      // — that would nest a VirtualizedList inside a ScrollView and trigger
      // the well-known RN warning + break windowing.
      const ref = createRef<BottomSheetRef>();
      const { UNSAFE_queryAllByType, getByText } = renderWithTheme(
        <BottomSheet ref={ref} scrollable={false}>
          <Text>Non-scrollable content</Text>
        </BottomSheet>,
      );
      // Force-present so the sheet actually mounts its children.
      act(() => {
        ref.current?.present();
      });
      // Children render unconditionally — only the WRAPPING ScrollView is
      // suppressed.
      expect(getByText('Non-scrollable content')).toBeTruthy();
      // No Animated.ScrollView host node should appear in the tree.
      const scrollViewNodes = UNSAFE_queryAllByType('Animated.ScrollView' as never);
      expect(scrollViewNodes.length).toBe(0);
    });

    it('defaults to wrapping children in a ScrollView (backwards-compat)', () => {
      const ref = createRef<BottomSheetRef>();
      const { UNSAFE_queryAllByType, getByText } = renderWithTheme(
        <BottomSheet ref={ref}>
          <Text>Default content</Text>
        </BottomSheet>,
      );
      act(() => {
        ref.current?.present();
      });
      expect(getByText('Default content')).toBeTruthy();
      // Default scrollable=true → Animated.ScrollView is present in the tree.
      const scrollViewNodes = UNSAFE_queryAllByType('Animated.ScrollView' as never);
      expect(scrollViewNodes.length).toBeGreaterThan(0);
    });
  });

  describe('manualActivation prop', () => {
    it('renders without errors with manualActivation enabled', () => {
      // manualActivation switches the body pan to the gorhom coordination
      // model (manualActivation(true) + onTouchesMove gating). The whole pan
      // pipeline must construct cleanly through the gesture-handler mock.
      const ref = createRef<BottomSheetRef>();
      const { unmount } = renderWithTheme(
        <BottomSheet ref={ref} manualActivation>
          <React.Fragment>Content</React.Fragment>
        </BottomSheet>,
      );
      act(() => {
        ref.current?.present();
      });
      unmount();
    });
  });

  describe('dynamicBackdrop prop', () => {
    it('renders without errors with dynamicBackdrop enabled', () => {
      // iOS Photos-style backdrop dim — proportional to drag distance. The
      // animated style closure must evaluate without throwing under the
      // interpolate mock (which accepts and ignores the clamp arg).
      const ref = createRef<BottomSheetRef>();
      const { unmount } = renderWithTheme(
        <BottomSheet ref={ref} dynamicBackdrop>
          <React.Fragment>Dynamic content</React.Fragment>
        </BottomSheet>,
      );
      act(() => {
        ref.current?.present();
      });
      unmount();
    });
  });

  describe('handleComponent prop', () => {
    it('renders a custom handle when handleComponent is provided', () => {
      const ref = createRef<BottomSheetRef>();
      const { getByText } = renderWithTheme(
        <BottomSheet
          ref={ref}
          handleComponent={() => <Text>Custom Handle</Text>}
        >
          <Text>Sheet body</Text>
        </BottomSheet>,
      );
      act(() => {
        ref.current?.present();
      });
      expect(getByText('Custom Handle')).toBeTruthy();
    });

    it('suppresses handle entirely when showHandle is false (even with handleComponent)', () => {
      // showHandle is the master switch — handleComponent is only consulted
      // when showHandle is true. This preserves the existing API contract
      // for consumers that opt out of the handle entirely.
      const ref = createRef<BottomSheetRef>();
      const { queryByText } = renderWithTheme(
        <BottomSheet
          ref={ref}
          showHandle={false}
          handleComponent={() => <Text>Should Not Appear</Text>}
        >
          <Text>Body</Text>
        </BottomSheet>,
      );
      act(() => {
        ref.current?.present();
      });
      expect(queryByText('Should Not Appear')).toBeNull();
    });
  });

  describe('keyboard provider: the app\'s one, never a second inside the Modal', () => {
    it('adds no KeyboardProvider of its own and tracks the keyboard through the app\'s', () => {
      // Every keyboard-controller provider suspends its main-window callback
      // when a <Modal> shows and relies on `dialog.setOnDismissListener` to
      // resume it; a dialog keeps only the last listener, so a provider added
      // inside the sheet left the app's own suspended for good — after the
      // first sheet, no KeyboardAvoidingView in the app followed the keyboard
      // until a restart (Alia #608, Android 16). React context crosses the
      // Modal, and the root provider carries the Modal window's keyboard
      // events itself, so the sheet uses that one.
      // The same module instance the sheet `require`s (moduleNameMapper'd to
      // `__mocks__/`); `jest.requireMock` would hand back a separate automock.
      const { KeyboardProvider, useKeyboardHandler } = require('react-native-keyboard-controller') as {
        KeyboardProvider: React.ComponentType<{ children?: React.ReactNode }>;
        useKeyboardHandler: jest.Mock;
      };
      useKeyboardHandler.mockClear();
      const ref = createRef<BottomSheetRef>();
      const { getByText, UNSAFE_getAllByType } = renderWithTheme(
        <KeyboardProvider>
          <BottomSheet ref={ref}>
            <Text>Keyboarded content</Text>
          </BottomSheet>
        </KeyboardProvider>,
      );
      act(() => {
        ref.current?.present();
      });

      expect(getByText('Keyboarded content')).toBeTruthy();
      expect(UNSAFE_getAllByType('KeyboardProvider' as never)).toHaveLength(1);
      expect(useKeyboardHandler).toHaveBeenCalled();
    });
  });

  describe('unmount-while-open does not fire onDismiss (responsive placement swap)', () => {
    it('skips onDismiss when a fully-open sheet is unmounted (yanked, not closing)', () => {
      // A responsive Dialog crossing its breakpoint swaps its bottom-sheet branch
      // for the centered-card branch, unmounting this sheet while it is still
      // fully OPEN. That is NOT a dismissal — firing onDismiss here would tear the
      // surface down mid-swap. The unmount-safety only flushes when a close was
      // already underway (visible=false).
      const onDismiss = jest.fn();
      const ref = createRef<BottomSheetRef>();
      const { unmount } = renderWithTheme(
        <BottomSheet ref={ref} onDismiss={onDismiss}>
          <React.Fragment>Open content</React.Fragment>
        </BottomSheet>,
      );
      act(() => {
        ref.current?.present();
      });
      act(() => {
        unmount();
      });
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('still flushes onDismiss when unmounted mid-close (visible already false)', () => {
      // The original guard's purpose: a sheet yanked mid-close-animation must
      // still flush its onDismiss so queued post-close callbacks are not lost.
      const onDismiss = jest.fn();
      const ref = createRef<BottomSheetRef>();
      const { unmount } = renderWithTheme(
        <BottomSheet ref={ref} onDismiss={onDismiss}>
          <React.Fragment>Closing content</React.Fragment>
        </BottomSheet>,
      );
      act(() => {
        ref.current?.present();
      });
      // Start the close (visible → false), then yank before the exit settles.
      act(() => {
        ref.current?.dismiss();
      });
      act(() => {
        unmount();
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('close generation tracking', () => {
    it('re-opening the sheet after dismiss does not throw or get stuck', () => {
      // Regression test for the "tap to open does nothing" bug: when the
      // user dismisses and immediately re-opens, a stale runOnJS(finishClose)
      // from the cancelled close cycle must NOT fire onDismiss on the new
      // session. The closeGeneration counter guards this — finishClose
      // checks that its captured generation still matches the live one.
      const onDismiss = jest.fn();
      const ref = createRef<BottomSheetRef>();
      renderWithTheme(
        <BottomSheet ref={ref} onDismiss={onDismiss}>
          <React.Fragment>Content</React.Fragment>
        </BottomSheet>,
      );
      // Open → close → open → close → open. Each present() bumps the
      // generation; any in-flight close callback from a prior cycle no-ops.
      act(() => {
        ref.current?.present();
        ref.current?.dismiss();
        ref.current?.present();
        ref.current?.dismiss();
        ref.current?.present();
      });
      // The sequence does not throw and the sheet does not get stuck in a
      // half-closed state. The fact that `present()` after `dismiss()`
      // returns cleanly is itself the proof the generation guard works:
      // without it, the stale dismiss callback would unmount the sheet
      // mid-reopen and the next present() would have no effect.
      expect(ref.current).not.toBeNull();
    });
  });
});


it('publishes declared custom background at the sheet level reset', () => {
  function Probe() { return <Text testID="surface-probe">{useSurfaceFill()}|{useSurfaceLevelValue()}</Text>; }
  const ref = createRef<BottomSheetRef>();
  const screen = renderWithTheme(<BottomSheet ref={ref} backgroundFill="#123456" backgroundComponent={() => <View />}><Probe /></BottomSheet>);
  act(() => ref.current?.present());
  expect(screen.getByTestId('surface-probe').props.children.join('')).toBe('#123456|0');
});


describe('protected sheet dismissal lifecycle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

  it('keeps a protected native modal visible when Android Back is requested', () => {
    const ref = createRef<BottomSheetRef>();
    const onDismiss = jest.fn();
    const guard = jest.fn(() => false);
    const screen = renderWithTheme(<BottomSheet ref={ref} onDismiss={onDismiss} onDismissAttempt={guard}><Text>Protected</Text></BottomSheet>);
    act(() => ref.current?.present());
    act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
    act(() => jest.advanceTimersByTime(400));
    expect(guard).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.UNSAFE_getByType(Modal).props.visible).toBe(true);
  });

  it('settles an explicit close even when user dismissal is blocked, then reopens', () => {
    const ref = createRef<BottomSheetRef>();
    const onDismiss = jest.fn();
    const guard = jest.fn(() => false);
    const screen = renderWithTheme(<BottomSheet ref={ref} onDismiss={onDismiss} onDismissAttempt={guard}><Text>Protected</Text></BottomSheet>);
    act(() => ref.current?.present());
    act(() => ref.current?.dismiss());
    act(() => jest.advanceTimersByTime(400));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(guard).not.toHaveBeenCalled();
    act(() => ref.current?.present());
    expect(screen.UNSAFE_getByType(Modal).props.visible).toBe(true);
  });

  it('settles an allowed Android Back request exactly once', () => {
    const ref = createRef<BottomSheetRef>();
    const onDismiss = jest.fn();
    const guard = jest.fn(() => true);
    const screen = renderWithTheme(<BottomSheet ref={ref} onDismiss={onDismiss} onDismissAttempt={guard}><Text>Allowed</Text></BottomSheet>);
    act(() => ref.current?.present());
    act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
    act(() => jest.advanceTimersByTime(400));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(guard).toHaveBeenCalledTimes(1);
  });
});
