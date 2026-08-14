import type React from 'react';
import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OverlayRoot } from '../overlay';
import { Portal } from '../portal/index.web';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import { BottomSheetBase } from './BottomSheetBase';
import type { BottomSheetProps, BottomSheetRef, BottomSheetShellProps } from './types';

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
            {/* `OverlayRoot` owns the portal-root pointer-events opt-in (see
                `src/overlay`). It used to ride in the style array below as an
                RN-only box-none value, which never reached the DOM — the whole
                sheet, backdrop included, was click-through on web. */}
            <OverlayRoot style={webStyles.rootView}>
                <GestureHandlerRootView style={StyleSheet.absoluteFill}>
                    {children}
                </GestureHandlerRootView>
            </OverlayRoot>
        </Portal>
    );
}

const BottomSheet = forwardRef((props: BottomSheetProps, ref: React.ForwardedRef<BottomSheetRef>) => (
    <BottomSheetBase {...props} ref={ref} Shell={WebShell} />
));

BottomSheet.displayName = 'BottomSheet';

const webStyles = StyleSheet.create({
    // Fixed, full-viewport box the sheet's `StyleSheet.absoluteFill` body
    // anchors to. The pointer-events opt-in and the STACKING both live in
    // `OverlayRoot`.
    //
    // This used to also pin `zIndex: Z_INDEX.portalRoot` (999999) here. Inside
    // the portal root that number does not mean "the portal layer" — it means
    // "above every other portaled surface", which is how a confirm dialog
    // opened from inside an open sheet ended up rendering underneath it,
    // unreachable, no matter which one opened last. Stacking is the overlay
    // stack's job now (`src/overlay/stack.ts`); do not reintroduce a constant.
    rootView: {
        position: WEB_POSITION_FIXED,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});

export default BottomSheet;

export type { BottomSheetProps, BottomSheetRef };

export { BottomSheet };
