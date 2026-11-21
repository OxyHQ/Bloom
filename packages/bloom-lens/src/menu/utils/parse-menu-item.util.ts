import type { ReactElement, ReactNode } from "react";

import { MenuItemIcon } from "../components/menu-item/menu-item-icon";
import { MenuItemSubtitle } from "../components/menu-item/menu-item-subtitle";
import { MenuItemTitle } from "../components/menu-item/menu-item-title";
import { MENU_ICON_COLORS } from "../constants/menu.const";
import type { TNativeMenuItem } from "../context/interface";
import type {
  IMenuItem,
  IMenuItemIcon,
  IMenuItemText,
  TMenuScheme,
} from "../interface";
import {
  flattenElements,
  type TElementWithChildren,
} from "./flatten-elements.util";

const parseMenuItem = (
  element: ReactElement<IMenuItem>,
  index: number,
  scheme: TMenuScheme,
  icons: ReactNode[],
): TNativeMenuItem => {
  const props: IMenuItem = element.props;
  const parts: TElementWithChildren[] = flattenElements(props.children);
  const title: ReactElement<IMenuItemText> | undefined = parts.find(
    (part: TElementWithChildren): boolean => part.type === MenuItemTitle,
  ) as ReactElement<IMenuItemText> | undefined;
  const subtitle: ReactElement<IMenuItemText> | undefined = parts.find(
    (part: TElementWithChildren): boolean => part.type === MenuItemSubtitle,
  ) as ReactElement<IMenuItemText> | undefined;
  const icon: ReactElement<IMenuItemIcon> | undefined = parts.find(
    (part: TElementWithChildren): boolean => part.type === MenuItemIcon,
  ) as ReactElement<IMenuItemIcon> | undefined;
  const item: TNativeMenuItem = {
    id: props.id ?? `item-${index}`,
    title: title?.props.children ?? "",
    subtitle: subtitle?.props.children,
    checked: props.checked,
    destructive: props.destructive,
    disabled: props.disabled,
    keepOpen: props.keepOpen,
  };
  if (!icon) return item;
  const { name, path, children } = icon.props;
  if (children === undefined || children === null) {
    return { ...item, icon: name, iconPath: path };
  }
  const colors = MENU_ICON_COLORS[scheme];
  const color: string = props.destructive ? colors.destructive : colors.base;
  icons.push(typeof children === "function" ? children({ color }) : children);
  return { ...item, iconSlot: icons.length - 1 };
};

export { parseMenuItem };
