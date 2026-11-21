import type { ReactNode, Ref } from "react";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";

type TMenuScheme = "light" | "dark";

type TMenuColorScheme = "auto" | TMenuScheme;

type TMenuAlignment = "auto" | "start" | "center" | "end";

type TMenuIconName =
  | "check"
  | "grid"
  | "list"
  | "plus"
  | "filter"
  | "ellipsis"
  | "trash"
  | "share"
  | "pencil"
  | "copy"
  | "heart"
  | "folder"
  | "sort"
  | "clock";

type TMenuAction = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: TMenuIconName;
  iconPath?: string;
  checked?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  keepOpen?: boolean;
  onSelect?: () => void;
};

type TMenuEntry = TMenuAction | { separator: true } | { heading: string };

type TMenuSelectEvent = {
  id: string;
  index: number;
  title: string;
};

type TMenuRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TMenuConfig = {
  blur?: number;
  morphBlur?: number;
  tintColor?: string;
  tintOpacity?: number;
  saturation?: number;
  refraction?: number;
  rim?: number;
  shine?: number;
  highlightOpacity?: number;
  jelly?: number;
  speed?: number;
};

type TMenuMorphOrigin = "trigger" | "press";

type TMenuShrink = {
  duration?: number;
  damping?: number;
  scale?: number;
};

type TMenuAbsorb = {
  duration?: number;
  damping?: number;
};

type TMenuTriggerConfig = {
  morphOrigin?: TMenuMorphOrigin;
  shrink?: TMenuShrink;
  absorb?: TMenuAbsorb;
  blur?: number;
  tintColor?: string;
  tintOpacity?: number;
  saturation?: number;
  refraction?: number;
  rim?: number;
  shine?: number;
  jelly?: number;
};

type TMenuItemIconState = {
  color: string;
};

type TMenuTriggerButton = PressableProps;

interface IMenuHandle {
  open: (from?: TMenuRect) => void;
  close: () => void;
}

interface IMenu {
  ref?: Ref<IMenuHandle>;
  colorScheme?: TMenuColorScheme;
  onSelect?: (event: TMenuSelectEvent) => void;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

interface IMenuTrigger {
  lens?: boolean;
  // Morph from the trigger when it has no glass (lens={false}): the panel grows out of the trigger's rectangle,
  // corner radius and tint, as with glass. Default true. Ignored with glass (a glass trigger always morphs).
  morph?: boolean;
  cornerRadius?: number;
  config?: TMenuTriggerConfig;
  openOnPress?: boolean;
  // Bloom: the rows arrive only as the menu opens; the view opens itself with them, again after they are emptied.
  openWithItems?: boolean;
  // Bloom: the menu has finished closing (its motion ended).
  onMenuClosed?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

interface IMenuContent {
  items?: TMenuEntry[];
  width?: number;
  alignment?: TMenuAlignment;
  fontFamily?: string;
  config?: TMenuConfig;
  children?: ReactNode;
}

// A submenu: a row with a chevron that opens the child items in a glass layer (touch: a layer over the root;
// fine pointer: a flyout beside the row).
interface ISubmenu {
  id?: string;
  title: string;
  icon?: TMenuIconName;
  children?: ReactNode;
}

interface IMenuItem {
  id?: string;
  checked?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  keepOpen?: boolean;
  onSelect?: () => void;
  children?: ReactNode;
}

interface IMenuItemIcon {
  name?: TMenuIconName;
  path?: string;
  children?: ReactNode | ((state: TMenuItemIconState) => ReactNode);
}

interface IMenuItemText {
  children: string;
}

interface IMenuLabel {
  children: string;
}

// A row of icon actions at the top of the content (the iOS context menu's row): one cell per action, icon above the
// title, no separator before the list. Its actions are TMenuAction entries; `onSelect` is per action.
interface IMenuActionRow {
  items: TMenuAction[];
}

export {
  type IMenu,
  type IMenuContent,
  type IMenuHandle,
  type IMenuItem,
  type ISubmenu,
  type IMenuItemIcon,
  type IMenuItemText,
  type IMenuActionRow,
  type IMenuLabel,
  type IMenuTrigger,
  type TMenuAbsorb,
  type TMenuAction,
  type TMenuAlignment,
  type TMenuColorScheme,
  type TMenuConfig,
  type TMenuEntry,
  type TMenuIconName,
  type TMenuItemIconState,
  type TMenuMorphOrigin,
  type TMenuRect,
  type TMenuScheme,
  type TMenuSelectEvent,
  type TMenuShrink,
  type TMenuTriggerButton,
  type TMenuTriggerConfig,
};
