import type React from 'react';
import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Portal } from '../portal/index.web';
import { Z_INDEX } from '../styles/z-index';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import {
    BottomSheetBase,
    type BottomSheetProps,
    type BottomSheetRef,
    type BottomSheetShellProps,
} from './BottomSheetBase';

/**
 * Web shell: bloom's stable DOM `<Portal>` (a single, reused
 * `#bloom-portal-root` in `document.body`, created in a layout effect and never
 * torn down) + a fixed, full-viewport `<GestureHandlerRootView>`.
 *
 * Why NOT RN-Web's `<Modal>` (which native uses): RN-Web's `Modal` mounts
 * through `ModalPortal`, which appends its host `<div>` DURING RENDER and
 * removes it in an unmount effect that also nulls its ref. Under React 19
 * concurrent rendering / StrictMode, that host node is orphaned — the sheet
 * mounts but its DOM lands in a detached node and never paints. Bloom's Portal
 * has no render-phase side effect and a stable host, so the sheet paints
 * reliably. This is the SAME portal the `Dialog` `center`/side paths already
 * use on web.
 *
 * `keyboardHeight` / `onRequestClose` are native-shell concerns (the browser
 * owns keyboard layout and back-button semantics) and are intentionally unused
 * here.
 */
function WebShell({ children }: BottomSheetShellProps) {
    return (
        <Portal>
            <GestureHandlerRootView style={[webStyles.rootView, { pointerEvents: 'box-none' }]}>
                {children}
            </GestureHandlerRootView>
        </Portal>
    );
}

const BottomSheet = forwardRef((props: BottomSheetProps, ref: React.ForwardedRef<BottomSheetRef>) => (
    <BottomSheetBase {...props} ref={ref} Shell={WebShell} />
));

BottomSheet.displayName = 'BottomSheet';

const webStyles = StyleSheet.create({
    rootView: {
        // The bloom Portal root is `position: fixed; inset: 0; pointer-events:
        // none`; this fixed, full-viewport root re-enables pointer events for
        // the sheet's own interactive descendants (backdrop, sheet) while empty
        // gaps stay click-through (`box-none`). `StyleSheet.absoluteFill` from
        // the sheet body then anchors to this box.
        position: WEB_POSITION_FIXED,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: Z_INDEX.portalRoot,
    },
});

export type { BottomSheetProps, BottomSheetRef };
export default BottomSheet;
export { BottomSheet };
