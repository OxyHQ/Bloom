import type { FC } from "react";
import type { IMenuItemIcon } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";
const MenuItemIconBase: FC<IMenuItemIcon> = (
  _props: IMenuItemIcon & React.ComponentProps<typeof MenuItemIconBase>,
): React.ReactNode & React.JSX.Element => <></>;

const MenuItemIcon = registerComponent("MenuItemIcon", MenuItemIconBase);

export { MenuItemIcon };
