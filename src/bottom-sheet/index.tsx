import type React from 'react';
import { forwardRef } from 'react';
import { Modal, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import {
    BottomSheetBase,
    type BottomSheetProps,
    type BottomSheetRef,
    type BottomSheetShellProps,
} from './BottomSheetBase';

// Keyboard handling — only on native platforms. On web, keyboard events are
// handled by the browser (and the web build resolves to `index.web.tsx`, which
// never imports this module). `react-native-keyboard-controller` is an OPTIONAL
// dependency: it is lazily `require`d below and everything no-ops when it is
// absent (or on web).
const noopKeyboardHandler = (_handlers: Record<string, (e: { height: number }) => void>, _deps: unknown[]) => {};
let useKeyboardHandler: (handlers: Record<string, (e: { height: number }) => void>, deps: unknown[]) => void = noopKeyboardHandler;

// react-native-keyboard-controller's <KeyboardProvider>. We re-establish it
// INSIDE the sheet's RN <Modal> (see the render below): a <Modal> mounts into
// its OWN native root, and neither the app-root GestureHandlerRootView nor the
// app-root KeyboardProvider's native KeyboardControllerView extend across that
// boundary. Without a provider inside the Modal, keyboard-controller consumers
// (this sheet's keyboard tracker, plus any TextInputs in `children`) read the
// default empty KeyboardContext — logging "Couldn't find real values for
// KeyboardContext ..." — and receive no keyboard insets. When the optional
// module is absent, or on web (no RN Modal native-window boundary, keyboard is
// the browser's concern), this resolves to a passthrough that just renders its
// children, so no provider is introduced where one isn't needed.
const PassthroughKeyboardProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
let KeyboardProvider: React.ComponentType<{ children: React.ReactNode }> = PassthroughKeyboardProvider;

if (Platform.OS !== 'web' && typeof require !== 'undefined') {
    try {
        const moduleName = 'react-native-keyboard-controller';
        const keyboardController = require(moduleName);
        useKeyboardHandler = keyboardController.useKeyboardHandler ?? noopKeyboardHandler;
        KeyboardProvider = keyboardController.KeyboardProvider ?? PassthroughKeyboardProvider;
    } catch {
        // react-native-keyboard-controller not available — keep the no-op
        // handler and passthrough provider.
    }
}

/**
 * Registers the sheet's keyboard-height tracker. It lives in its own tiny
 * component — rendered INSIDE the Modal, under the re-established
 * <KeyboardProvider> — so `useKeyboardHandler` reads the in-Modal
 * KeyboardContext whose native KeyboardControllerView actually receives the
 * Modal window's keyboard insets (the app-root provider does not cross the
 * Modal's native-window boundary). It writes the live keyboard height into the
 * shared value that drives the sheet's translate/height styles. Renders
 * nothing. No-ops when react-native-keyboard-controller isn't installed / on
 * web (`useKeyboardHandler` is the module-level no-op there).
 */
function SheetKeyboardSync({ keyboardHeight }: { keyboardHeight: SharedValue<number> }) {
    useKeyboardHandler({
        onMove: (e) => {
            'worklet';
            keyboardHeight.value = e.height;
        },
        onEnd: (e) => {
            'worklet';
            keyboardHeight.value = e.height;
        },
    }, []);
    return null;
}

/**
 * Native shell: RN's `<Modal>` (its own native root window) + the
 * re-established `<KeyboardProvider>` + the sheet's keyboard tracker + a
 * `<GestureHandlerRootView>` (the app-root GHRV does not cross the Modal's
 * native-window boundary, so pan gestures need their own root here).
 */
function NativeShell({ visible, onRequestClose, keyboardHeight, children }: BottomSheetShellProps) {
    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onRequestClose}>
            <KeyboardProvider>
                <SheetKeyboardSync keyboardHeight={keyboardHeight} />
                <GestureHandlerRootView style={styles.rootView}>{children}</GestureHandlerRootView>
            </KeyboardProvider>
        </Modal>
    );
}

const BottomSheet = forwardRef((props: BottomSheetProps, ref: React.ForwardedRef<BottomSheetRef>) => (
    <BottomSheetBase {...props} ref={ref} Shell={NativeShell} />
));

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
    rootView: {
        flex: 1,
    },
});

export type { BottomSheetProps, BottomSheetRef };
export default BottomSheet;
export { BottomSheet };
