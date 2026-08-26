/**
 * COPIED FROM react-native-teleport 1.2.0 — `src/views/PortalHost/index.tsx`
 * MIT, Copyright (c) 2025 Kiryl Ziusko. Full licence in `NOTICE` at the root.
 *
 * Changed: import paths only, for this flat directory.
 */
import { memo, useEffect } from "react";
import { usePortalRegistryContext } from "./portal-registry";
import type { PortalHostProps } from "./types";

function PortalHost({ name, children, style }: PortalHostProps) {
  const { registerHost } = usePortalRegistryContext();

  useEffect(() => {
    return () => {
      registerHost(name, null);
    };
  }, [name, registerHost]);

  return (
    <div
      style={{ ...style, pointerEvents: "none" } as React.CSSProperties}
      ref={(ref) => registerHost(name, ref)}
    >
      {children}
    </div>
  );
}

export default memo(PortalHost);
