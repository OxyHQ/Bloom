/**
 * COPIED FROM react-native-teleport 1.2.0 — `src/views/PortalHost/index.native.tsx`
 * MIT, Copyright (c) 2025 Kiryl Ziusko. Full licence in `NOTICE` at the root.
 *
 * Changed: import paths only, for this flat directory.
 */
import PortalHostNativeComponent from "./specs/PortalHostViewNativeComponent";
import type { PortalHostProps } from "./types";

const PortalHost = (props: PortalHostProps) => {
  return <PortalHostNativeComponent pointerEvents="box-none" {...props} />;
};

export default PortalHost;
