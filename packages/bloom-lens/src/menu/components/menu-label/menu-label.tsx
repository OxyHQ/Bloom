import type { FC } from "react";
import type { IMenuLabel } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

const MenuLabelBase: FC<IMenuLabel> = (
  _props: IMenuLabel & React.ComponentProps<typeof MenuLabelBase>,
): React.ReactNode & React.JSX.Element => <></>;

const MenuLabel = registerComponent("MenuLabel", MenuLabelBase);

export { MenuLabel };
