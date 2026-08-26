/**
 * COPIED FROM react-native-teleport 1.2.0 — `src/specs/PortalHostViewNativeComponent.ts`
 * MIT, Copyright (c) 2025 Kiryl Ziusko. Full licence in `NOTICE` at the root.
 *
 * Changed: nothing — byte-for-byte, only its path.
 */
import { codegenNativeComponent, type ViewProps } from "react-native";

interface NativeProps extends ViewProps {
  name?: string;
}

export default codegenNativeComponent<NativeProps>("PortalHostView", {
  interfaceOnly: true,
});
