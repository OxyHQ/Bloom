import React, { useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet, type BottomSheetRef } from '../bottom-sheet';
import { useTheme } from '../theme/use-theme';
import { Context, useDialogContext } from './context';
import type { DialogControlProps, DialogInnerProps, DialogOuterProps } from './types';

export { useDialogContext, useDialogControl } from './context';
export type { DialogControlProps, DialogOuterProps, DialogInnerProps } from './types';

export function Outer({
  children,
  control,
  onClose,
  testID,
}: React.PropsWithChildren<DialogOuterProps>) {
  const theme = useTheme();
  const ref = useRef<BottomSheetRef>(null);
  const closeCallbacks = useRef<(() => void)[]>([]);

  const callQueuedCallbacks = useCallback(() => {
    for (const cb of closeCallbacks.current) {
      try {
        cb();
      } catch (e) {
        console.error('Dialog close callback error:', e);
      }
    }
    closeCallbacks.current = [];
  }, []);

  const open = useCallback(() => {
    ref.current?.present();
  }, []);

  const close = useCallback<DialogControlProps['close']>((cb) => {
    if (typeof cb === 'function') {
      closeCallbacks.current.push(cb);
    }
    ref.current?.dismiss();
  }, []);

  // onDismiss fires after the BottomSheet's close animation finishes — this is
  // the integration point for the closeCallbacks queue. Consumers (e.g.
  // Prompt.Action) rely on the queued callback running AFTER the sheet has
  // visually closed so the screen transition feels natural.
  const handleDismiss = useCallback(() => {
    callQueuedCallbacks();
    onClose?.();
  }, [callQueuedCallbacks, onClose]);

  useImperativeHandle(
    control.ref,
    () => ({ open, close }),
    [open, close],
  );

  const context = useMemo(
    () => ({ close, isWithinDialog: true }),
    [close],
  );

  const sheetStyle = useMemo(
    () => ({
      maxWidth: 500,
      backgroundColor: theme.colors.background,
      // All four corners rounded — Dialog uses BottomSheet in `detached` mode
      // (floating card with safe-area margins), so we round the bottom too
      // instead of leaving the default top-only radius.
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
      // Stronger dim so the underlying bottom-sheet's handle/content doesn't
      // bleed through when a Dialog/Prompt is stacked over another sheet.
      backdropOpacity={0.7}
      style={sheetStyle}
    >
      <Context.Provider value={context}>
        <View
          testID={testID}
          style={{ backgroundColor: theme.colors.background }}
        >
          {children}
        </View>
      </Context.Provider>
    </BottomSheet>
  );
}

export function Inner({ children, style, header, contentContainerStyle }: DialogInnerProps) {
  // Dialog renders inside a `detached` BottomSheet, which already adds
  // `marginBottom: insets.bottom + 16` to the sheet container — the floating
  // card sits ABOVE the system gesture bar, so we don't add `insets.bottom`
  // here. Doing so double-padded the bottom on Android edge-to-edge displays.
  return (
    <>
      {header}
      <View
        style={[
          { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20 },
          contentContainerStyle,
          style,
        ]}
      >
        {children}
      </View>
    </>
  );
}

export function ScrollableInner(props: DialogInnerProps) {
  return <Inner {...props} />;
}

const handleStyles = StyleSheet.create({
  container: { position: 'absolute', width: '100%', alignItems: 'center', zIndex: 10, height: 20 },
  bar: { top: 8, width: 35, height: 5, borderRadius: 3, alignSelf: 'center', opacity: 0.5 },
});

export function Handle() {
  const theme = useTheme();
  const { close } = useDialogContext();

  return (
    <View style={handleStyles.container}>
      <Pressable
        onPress={() => close()}
        accessibilityLabel="Dismiss"
        accessibilityHint="Tap to close the dialog"
        hitSlop={{ top: 10, bottom: 10, left: 40, right: 40 }}
      >
        <View style={[handleStyles.bar, { backgroundColor: theme.colors.text }]} />
      </Pressable>
    </View>
  );
}

export function Close() {
  return null;
}

export function Backdrop() {
  return null;
}
