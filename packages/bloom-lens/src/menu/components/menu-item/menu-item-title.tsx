import type { FC } from "react";
import type { IMenuItemText } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

const MenuItemTitleBase: FC<IMenuItemText> = (
  _props: IMenuItemText & React.ComponentProps<typeof MenuItemTitleBase>,
): React.ReactNode & React.JSX.Element => <></>;

const MenuItemTitle = registerComponent("MenuItemTitle", MenuItemTitleBase);

export { MenuItemTitle };
