import { createCompoundComponent } from "../../utils/create-compound-component.util";
import { MenuActionRow } from "../menu-action-row";
import { MenuContent } from "../menu-content";
import { MenuItem } from "../menu-item";
import { MenuLabel } from "../menu-label";
import { MenuSeparator } from "../menu-separator";
import { MenuSubmenu } from "../menu-submenu";
import { MenuTrigger } from "../menu-trigger";
import { MenuTriggerButton } from "../menu-trigger-button";
import { MenuRoot } from "./menu";
const Menu = createCompoundComponent("Menu", MenuRoot, {
  Trigger: MenuTrigger,
  TriggerButton: MenuTriggerButton,
  Content: MenuContent,
  Item: MenuItem,
  Separator: MenuSeparator,
  ActionRow: MenuActionRow,
  Submenu: MenuSubmenu,
  Label: MenuLabel,
});

export { Menu };
