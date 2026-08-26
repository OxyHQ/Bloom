/**
 * COPIED FROM react-native-teleport 1.2.0 — `src/types/index.ts`
 * MIT, Copyright (c) 2025 Kiryl Ziusko. Full licence in `NOTICE` at the root.
 *
 * Changed: nothing — byte-for-byte, only its path.
 */
import type { StyleProp, ViewStyle } from "react-native";

export type PortalProviderProps = {
  children: React.ReactNode;
};
export type PortalHostProps = {
  name: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};
export type PortalProps = {
  name?: string;
  hostName?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};
