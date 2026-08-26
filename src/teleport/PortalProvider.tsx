/**
 * COPIED FROM react-native-teleport 1.2.0 — `src/PortalProvider.tsx`
 * MIT, Copyright (c) 2025 Kiryl Ziusko. Full licence in `NOTICE` at the root.
 *
 * Changed: import paths only, for this flat directory.
 */
import PortalHost from "./PortalHost";
import NativePortalProvider from "./PortalProviderView";
import { PortalManagerProvider } from "./portal-manager";

type PortalProviderProps = {
  children: React.ReactNode;
};

/**
 * Wraps your app with this component to use the teleport API.
 *
 * This component provides a context/registry for all Portals so that you can use imperative API, such as `usePortal` hook to manage Portals.
 *
 * @category components
 * @example
 * ```tsx
 * import { PortalProvider } from "react-native-teleport";
 * export default function App() {
 *   return (
 *     <PortalProvider>
 *       //* your main application code goes here
 *     </PortalProvider>
 *   );
 * }
 */
export default function PortalProvider({ children }: PortalProviderProps) {
  return (
    <NativePortalProvider>
      <PortalManagerProvider>
        {children}
        <PortalHost name="root" style={styles.root} />
      </PortalManagerProvider>
    </NativePortalProvider>
  );
}

const styles = {
  root: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
} as const;
