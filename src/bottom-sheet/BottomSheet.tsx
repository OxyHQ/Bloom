import type React from 'react';
import { forwardRef } from 'react';
import { Platform } from 'react-native';

import { OverlayRoot } from '../overlay';
import { Portal } from '../portal';
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
const noopKeyboardHandler = (
  _handlers: Record<string, (e: { height: number }) => void>,
  _deps: unknown[],
) => {};
let useKeyboardHandler: (
  handlers: Record<string, (e: { height: number }) => void>,
  deps: unknown[],
) => void = noopKeyboardHandler;

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
 * not mount a second one. The sheet lives in the app's own window, so this hook
 * finds the app-root provider and its events directly (they used to cross an RN
 * `<Modal>`'s window through the provider's `ModalAttachedWatcher`).
 *
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
  useKeyboardHandler(
    {
      onMove: (e) => {
        'worklet';
        keyboardHeight.value = e.height;
      },
      onEnd: (e) => {
        'worklet';
        keyboardHeight.value = e.height;
      },
    },
    [],
  );
  return null;
}

/**
 * Native shell: the sheet presents in the APP'S OWN window, through bloom's
 * `<Portal>` and an `OverlayRoot`, exactly as the side drawers do. Not an RN
 * `<Modal>`: a `<Modal>` is a second native window, and a surface in it can
 * neither refract what is behind it (the lens material has nothing to sample)
 * nor share the app's gesture root and keyboard provider. In the app's window
 * all three just work, so this shell mounts none of them:
 *
 *  - the app's `GestureHandlerRootView` already covers it;
 *  - `SheetKeyboardSync` reads the app's one `<KeyboardProvider>` directly;
 *  - the surface is `modal` — `OverlayRoot` confines VoiceOver (iOS) and, through
 *    the app's `OverlayInertBoundary`, TalkBack — and consumes Android back via
 *    `onRequestClose`, newest surface first.
 */
export function NativeShell({
  visible,
  onRequestClose,
  keyboardHeight,
  children,
}: BottomSheetShellProps) {
  if (!visible) return null;
  return (
    <Portal>
      <OverlayRoot onRequestClose={onRequestClose} modal>
        <SheetKeyboardSync keyboardHeight={keyboardHeight} />
        {children}
      </OverlayRoot>
    </Portal>
  );
}

const BottomSheet = forwardRef(
  (props: BottomSheetProps, ref: React.ForwardedRef<BottomSheetRef>) => (
    <BottomSheetBase {...props} ref={ref} Shell={NativeShell} />
  ),
);

BottomSheet.displayName = 'BottomSheet';

export default BottomSheet;

export type { BottomSheetProps, BottomSheetRef };

export { BottomSheet };
