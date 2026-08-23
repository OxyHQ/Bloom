/**
 * Internal bottom-sheet shell shared by `Menu`, `Select` and `ContextMenu`.
 *
 * Not exported from the public `@oxyhq/bloom` surface — these three
 * components historically used the low-level `Dialog.Outer / Inner /
 * Handle` primitives, which are gone in 0.5.0. This shell captures the
 * shared shape (BottomSheet + drag handle + close-on-tap context) in a
 * single place so the three internal call sites stay symmetrical.
 *
 * Consumers needing the same behaviour for app code should use the public
 * `BottomSheet` primitive directly.
 */
import React, { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BottomSheet, type BottomSheetRef } from '../bottom-sheet';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { StyledView } from '../styles/styled-primitives';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { Context } from './context';
import type { DialogControlProps } from './types';

export interface SheetShellProps {
  control: DialogControlProps;
  label?: string;
  header?: React.ReactNode;
  onClose?: () => void;
  /** Classes applied to the inner padded content container. */
  contentClassName?: string;
  /** Style overrides applied to the inner padded content container. */
  contentStyle?: StyleProp<ViewStyle>;
  contentTestID?: string;
  children?: React.ReactNode;
}

/**
 * Bottom-sheet shell with an embedded drag handle. Exposes the bloom
 * dialog `close()` context to descendants — `MenuItem`, `SelectItem`
 * etc. rely on it to dismiss the sheet after selection.
 */
export function SheetShell({
  control,
  label,
  header,
  onClose,
  contentClassName,
  contentStyle,
  contentTestID,
  children,
}: SheetShellProps) {
  const theme = useTheme();
  const ref = useRef<BottomSheetRef>(null);
  const closeCallbacks = useRef<(() => void)[]>([]);
  // Whether the sheet is on screen. Tracked here rather than read off the
  // imperative control because the control has no readable state — and this is
  // the ONE place all five sheet-presenting families pass through, so wiring the
  // screen-reader focus move here is what gets it right for every one of them
  // instead of four times.
  const [presented, setPresented] = useState(false);
  const bodyRef = useAccessibilityFocus<View>(presented);

  const callQueuedCallbacks = useCallback(() => {
    const queued = closeCallbacks.current;
    closeCallbacks.current = [];
    for (const cb of queued) {
      try {
        cb();
      } catch (e) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('SheetShell close callback error:', e);
        }
      }
    }
  }, []);

  const open = useCallback(() => {
    setPresented(true);
    ref.current?.present();
  }, []);

  const close = useCallback<DialogControlProps['close']>((cb) => {
    if (typeof cb === 'function') {
      closeCallbacks.current.push(cb);
    }
    ref.current?.dismiss();
  }, []);

  const handleDismiss = useCallback(() => {
    setPresented(false);
    callQueuedCallbacks();
    onClose?.();
  }, [callQueuedCallbacks, onClose]);

  useImperativeHandle(control.ref, () => ({ open, close }), [open, close]);

  const context = useMemo(
    () => ({ close, isWithinDialog: true }),
    [close],
  );

  const sheetStyle = useMemo(
    () => ({
      maxWidth: 500,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
    }),
    [theme.colors.background],
  );

  return (
    <BottomSheet
      ref={ref}
      onDismiss={handleDismiss}
      enablePanDownToClose
      detached
      backdropOpacity={0.7}
      style={sheetStyle}
      // `SheetShell` draws its own PRESSABLE handle below (tap to dismiss);
      // `BottomSheet`'s built-in one is decorative and defaults to on, so
      // leaving it enabled painted two pills 2dp apart in every Bloom sheet
      // menu, select, popover and context menu.
      showHandle={false}
    >
      <Context.Provider value={context}>
        <SheetHandle onPress={() => close()} />
        {header}
        <StyledView
          // Deliberately NOT `accessible`: collapsing the body into one
          // accessibility element would make its rows unreachable, and the
          // focus move below would land on the group instead of the first row.
          ref={bodyRef}
          // The platform's own dismiss gesture — a two-finger Z scrub under
          // VoiceOver, a back gesture under TalkBack. Without it a screen-reader
          // user has to find the drag handle to leave a sheet, and the handle is
          // a 4dp pill. Android's hardware back is already covered: every Bloom
          // sheet is an RN `<Modal>`, whose `onRequestClose` it fires.
          onAccessibilityEscape={() => close()}
          accessibilityLabel={label}
          className={contentClassName}
          testID={contentTestID}
          style={[styles.body, { backgroundColor: theme.colors.background }, contentStyle]}
        >
          {children}
        </StyledView>
      </Context.Provider>
    </BottomSheet>
  );
}

function SheetHandle({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.handleContainer}>
      <Pressable
        onPress={onPress}
        accessibilityLabel="Dismiss"
        accessibilityHint="Tap to close"
        hitSlop={{ top: 10, bottom: 10, left: 40, right: 40 }}
      >
        <View style={[styles.handleBar, { backgroundColor: theme.colors.text }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  handleContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: Z_INDEX.floating,
    height: 20,
  },
  handleBar: {
    top: 8,
    width: 35,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    opacity: 0.5,
  },
  body: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
