import React, { useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/use-theme';
import { lazyRequire } from '../utils/lazy-require';
import { Context, useDialogContext } from './context';
import type { DialogControlProps, DialogInnerProps, DialogOuterProps } from './types';

export { useDialogContext, useDialogControl } from './context';
export type { DialogControlProps, DialogOuterProps, DialogInnerProps } from './types';

// ---------------------------------------------------------------------------
// Local types for @gorhom/bottom-sheet — declared here instead of imported so
// that Bloom type-checks cleanly in downstream projects that do not install
// this optional peer dependency. The module is still consumed at runtime via
// `lazyRequire`, which returns `null` if the package is missing. In that case
// Dialog.Outer renders nothing with a console warning, so consumers on native
// MUST install @gorhom/bottom-sheet to use Bloom's Dialog on native.
// ---------------------------------------------------------------------------
type BottomSheetBackdropProps = {
  animatedIndex: unknown;
  animatedPosition: unknown;
  style?: StyleProp<ViewStyle>;
};

type BottomSheetModalRef = {
  present: () => void;
  dismiss: () => void;
};

type BottomSheetModalProps = {
  ref?: React.Ref<BottomSheetModalRef>;
  enablePanDownToClose?: boolean;
  enableDismissOnClose?: boolean;
  enableDynamicSizing?: boolean;
  snapPoints?: (string | number)[];
  backgroundStyle?: StyleProp<ViewStyle>;
  handleComponent?: React.ComponentType | (() => React.ReactNode) | null;
  backdropComponent?: React.ComponentType<BottomSheetBackdropProps>;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

type BottomSheetViewProps = {
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

type BottomSheetBackdropComponentProps = BottomSheetBackdropProps & {
  appearsOnIndex?: number;
  disappearsOnIndex?: number;
  pressBehavior?: 'none' | 'close' | 'collapse' | number;
  opacity?: number;
};

type BottomSheetModule = {
  BottomSheetModal: React.ComponentType<BottomSheetModalProps>;
  BottomSheetView: React.ComponentType<BottomSheetViewProps>;
  BottomSheetBackdrop: React.ComponentType<BottomSheetBackdropComponentProps>;
};

const getBottomSheetModule = lazyRequire<BottomSheetModule>('@gorhom/bottom-sheet');

let warnedAboutMissingBottomSheet = false;
function warnMissingBottomSheet(): void {
  if (warnedAboutMissingBottomSheet) return;
  warnedAboutMissingBottomSheet = true;
  console.warn(
    "[bloom] @gorhom/bottom-sheet is not installed. Bloom's native Dialog will not render. " +
      'Install it as a peer dependency to enable Dialog on native, or rely on the web Dialog implementation on web.',
  );
}

export function Outer({
  children,
  control,
  onClose,
  testID,
  preventExpansion,
}: React.PropsWithChildren<DialogOuterProps>) {
  const theme = useTheme();
  const ref = useRef<BottomSheetModalRef>(null);
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

  const bottomSheet = getBottomSheetModule();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => {
      if (!bottomSheet) return null;
      const { BottomSheetBackdrop } = bottomSheet;
      return (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          opacity={0.4}
        />
      );
    },
    [bottomSheet],
  );

  const renderHandle = useCallback(() => null, []);

  if (!bottomSheet) {
    // Optional peer `@gorhom/bottom-sheet` is not installed.
    // Dialog.Outer is a no-op in this environment; consumers on native must
    // install the peer to use Bloom's native Dialog implementation.
    warnMissingBottomSheet();
    return null;
  }

  const { BottomSheetModal, BottomSheetView } = bottomSheet;

  return (
    <BottomSheetModal
      ref={ref}
      enablePanDownToClose
      enableDismissOnClose
      enableDynamicSizing={!preventExpansion}
      snapPoints={preventExpansion ? ['40%'] : undefined}
      backgroundStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      handleComponent={renderHandle}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      style={{ maxWidth: 500, margin: 'auto' }}
    >
      <Context.Provider value={context}>
        <BottomSheetView
          testID={testID}
          style={{ backgroundColor: theme.colors.background }}
        >
          {children}
        </BottomSheetView>
      </Context.Provider>
    </BottomSheetModal>
  );
}

export function Inner({ children, style, header, contentContainerStyle }: DialogInnerProps) {
  const insets = useSafeAreaInsets();
  return (
    <>
      {header}
      <View
        style={[
          { paddingTop: 20, paddingHorizontal: 20, paddingBottom: insets.bottom + insets.top },
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
