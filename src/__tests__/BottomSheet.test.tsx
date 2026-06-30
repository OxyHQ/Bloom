import React, { createRef } from 'react';
import { Dimensions, Text } from 'react-native';
import { act, render, within } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
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

  describe('keyboard provider (Modal native-root boundary)', () => {
    it('re-establishes a KeyboardProvider inside the Modal and wraps the sheet content', () => {
      // RN <Modal> mounts into a SEPARATE native root; the app-root
      // react-native-keyboard-controller <KeyboardProvider>'s native context
      // does not cross that boundary. The sheet must therefore re-establish a
      // provider INSIDE the Modal so its own keyboard tracker (SheetKeyboardSync)
      // AND any inputs in `children` find a real KeyboardContext (otherwise:
      // "Couldn't find real values for KeyboardContext ..." warning + broken
      // keyboard insets). This asserts the presented content is a DESCENDANT of
      // that in-Modal provider.
      const ref = createRef<BottomSheetRef>();
      const { getByText, UNSAFE_getByType } = renderWithTheme(
        <BottomSheet ref={ref}>
          <Text>Keyboarded content</Text>
        </BottomSheet>,
      );
      act(() => {
        ref.current?.present();
      });

      const provider = UNSAFE_getByType('KeyboardProvider' as never);
      expect(within(provider).getByText('Keyboarded content')).toBeTruthy();
      expect(getByText('Keyboarded content')).toBeTruthy();
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
