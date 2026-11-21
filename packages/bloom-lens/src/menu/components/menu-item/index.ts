import { createCompoundComponent } from "../../utils/create-compound-component.util";
import { MenuItem as MenuItemPart } from "./menu-item";
import { MenuItemIcon } from "./menu-item-icon";
import { MenuItemSubtitle } from "./menu-item-subtitle";
import { MenuItemTitle } from "./menu-item-title";

const MenuItem = createCompoundComponent("MenuItem", MenuItemPart, {
  Icon: MenuItemIcon,
  Title: MenuItemTitle,
  Subtitle: MenuItemSubtitle,
});

export { MenuItem };
