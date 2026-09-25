import type React from 'react';
import { forwardRef } from 'react';
import { Modal, Platform, StyleSheet } from 'react-native';

import { GlassBlurWindow } from '../glass/blur-target';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import { BottomSheetBase } from './BottomSheetBase';
import type { BottomSheetProps, BottomSheetRef, BottomSheetShellProps } from './types';

// Keyboard handling — only on native platforms. On web, keyboard events are
// handled by the browser (and the web build resolves to `index.web.tsx`, which
// never imports this module). `react-native-keyboard-controller` is an OPTIONAL
// dependency, loaded below through the shape Metro collects as an optional
// dependency: a `require()` of a STRING LITERAL as a direct statement of a `try`
// block — the real module when it is installed, `null` in the dependency map
// when it is not, so the failure lands in the `catch` and everything no-ops.
// The specifier used to be bound to a local `const` first, which also worked
// (Metro evaluates the constant); the literal is simply the form the rule can be
// checked as. See `connection-status/netinfo.ts` for the full rule, including
// the specifier shape that does NOT work.
const noopKeyboardHandler = (_handlers: Record<string, (e: { height: number }) => void>, _deps: unknown[]) => {};
let useKeyboardHandler: (handlers: Record<string, (e: { height: number }) => void>, deps: unknown[]) => void = noopKeyboardHandler;

if (Platform.OS !== 'web' && typeof require !== 'undefined') {
    try {
        const keyboardController = require('react-native-keyboard-controller');
        useKeyboardHandler = keyboardController.useKeyboardHandler ?? noopKeyboardHandler;
    } catch {
        // react-native-keyboard-controller not available — keep the no-op handler.
    }
}

/**
 * Registers the sheet's keyboard-height tracker, writing the live keyboard
 * height into the shared value that drives the sheet's translate/height styles.
 * Renders nothing.
 *
 * It reads the APP's one `<KeyboardProvider>`, and the sheet deliberately does
 * not mount a second one inside its `<Modal>`:
 *
 *  - React context crosses a `<Modal>` like any other element, so this hook
 *    finds the app-root provider from inside the sheet.
 *  - The native events cross too: when a `<Modal>` shows, the root provider's
 *    `ModalAttachedWatcher` (keyboard-controller ≥ 1.13, Android) attaches a
 *    keyboard callback to the dialog's window and propagates it to the ROOT
 *    provider's view, which is where this handler is registered.
 *  - A second provider breaks the app until it restarts. Every provider's
 *    watcher answers the same `topShow`: each SUSPENDS its own main-window
 *    callback and then calls `dialog.setOnDismissListener` to un-suspend it —
 *    and a dialog keeps only the LAST listener. So on dismiss one provider
 *    resumes and the others stay suspended for good: after the first sheet, the
 *    app's `KeyboardAvoidingView`s never saw the keyboard again (Alia #608,
 *    Android 16, keyboard-controller 1.21.9 and unchanged in 1.22.5).
 *
 * No app-root provider means keyboard-controller works nowhere in that app; the
 * hook then no-ops (and warns in development) like every other consumer.
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
 * Native shell: RN's `<Modal>` (its own native root window) + the sheet's
 * keyboard tracker + a `<GestureHandlerRootView>` (the app-root GHRV does not
 * cross the Modal's native-window boundary, so pan gestures need their own root
 * here). No `<KeyboardProvider>`: see `SheetKeyboardSync`.
 */
function NativeShell({ visible, onRequestClose, keyboardHeight, children }: BottomSheetShellProps) {
    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onRequestClose}>
            {/*
              This <Modal> is its own native window — the same boundary the
              GestureHandlerRootView below is re-established for.
              `GlassBlurWindow` declares it to the glass layer, which is the
              ONLY thing that lets a backdrop in here take an Android blur target:
              a BlurView in the app's own window would be a descendant of what it
              blurs, and that segfaults. See `glass/blur-target.tsx`.
            */}
            <GlassBlurWindow>
                <SheetKeyboardSync keyboardHeight={keyboardHeight} />
                <GestureHandlerRootView style={styles.rootView}>{children}</GestureHandlerRootView>
            </GlassBlurWindow>
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

export default BottomSheet;

export type { BottomSheetProps, BottomSheetRef };

export { BottomSheet };
