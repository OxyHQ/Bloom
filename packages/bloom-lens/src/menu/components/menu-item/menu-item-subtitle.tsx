import type { FC } from "react";
import type { IMenuItemText } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

const MenuItemSubtitleBase: FC<IMenuItemText> = (
  _props: IMenuItemText & React.ComponentProps<typeof MenuItemSubtitleBase>,
): React.ReactNode & React.JSX.Element => <></>;

const MenuItemSubtitle = registerComponent(
  "MenuItemSubtitle",
  MenuItemSubtitleBase,
);

export { MenuItemSubtitle };
