import type { ReactNode, RefObject } from "react";

import type {
  IMenuContent,
  IMenuHandle,
  TMenuScheme,
  TMenuSelectEvent,
} from "../interface";

type TNativeMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  iconPath?: string;
  iconSlot?: number;
  checked?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  keepOpen?: boolean;
  separator?: boolean;
  heading?: boolean;
  // The action cells of an action row (icon actions, one cell each). Null for every other row.
  actions?: TNativeMenuItem[];
  // Present on submenu rows: the child items (a chevron row).
  items?: TNativeMenuItem[];
  // The header row of a submenu panel: returns to the parent panel.
  back?: boolean;
};

interface INativeMenuHandle {
  open: (
    x?: number,
    y?: number,
    width?: number,
    height?: number,
  ) => Promise<void>;
  close: () => Promise<void>;
}

type TParsedMenu = {
  items: TNativeMenuItem[];
  icons: ReactNode[];
  handlers: Record<string, () => void>;
};

interface IMenuContext {
  handle: IMenuHandle;
  native: RefObject<INativeMenuHandle | null>;
  scheme: TMenuScheme;
  items: TNativeMenuItem[];
  icons: ReactNode[];
  content: Omit<IMenuContent, "items" | "children">;
  select: (event: TMenuSelectEvent) => void;
  openChange?: (open: boolean) => void;
}

export {
  type IMenuContext,
  type INativeMenuHandle,
  type TNativeMenuItem,
  type TParsedMenu,
};
