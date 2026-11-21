import type { ReactNode, Ref } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import type {
  INativeMenuHandle,
  TNativeMenuItem,
} from "../../context/interface";
import type {
  TMenuAlignment,
  TMenuConfig,
  TMenuScheme,
  TMenuSelectEvent,
  TMenuTriggerConfig,
} from "../../interface";

interface INativeMenu {
  ref?: Ref<INativeMenuHandle>;
  items: TNativeMenuItem[];
  onItemSelect?: (event: { nativeEvent: TMenuSelectEvent }) => void;
  onMenuOpenChange?: (event: { nativeEvent: { open: boolean } }) => void;
  lens?: boolean;
  morph?: boolean;
  cornerRadius?: number;
  colorScheme?: TMenuScheme;
  menuWidth?: number;
  fontFamily?: string;
  alignment?: TMenuAlignment;
  config?: TMenuConfig;
  triggerConfig?: TMenuTriggerConfig;
  openWithItems?: boolean;
  restBackdrop?: string;
  onMenuClosed?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export { type INativeMenu };
