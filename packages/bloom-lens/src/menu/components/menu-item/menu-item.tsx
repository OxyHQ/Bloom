import type { FC } from "react";
import type { IMenuItem } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

const MenuItemBase: FC<IMenuItem> = (
  _props: IMenuItem & React.ComponentProps<typeof MenuItemBase>,
): React.ReactNode & React.JSX.Element => <></>;

const MenuItem = registerComponent("MenuItem", MenuItemBase);

export { MenuItem };
