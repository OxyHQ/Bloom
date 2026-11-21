import type { FC } from "react";
import type { ISubmenu } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

// Declarative only: parseMenuContent reads its props and children (Menu.Item entries).
const MenuSubmenuBase: FC<ISubmenu> = (
  _props: ISubmenu & React.ComponentProps<typeof MenuSubmenuBase>,
): React.ReactNode & React.JSX.Element => <></>;

const MenuSubmenu = registerComponent("MenuSubmenu", MenuSubmenuBase);

export { MenuSubmenu };
