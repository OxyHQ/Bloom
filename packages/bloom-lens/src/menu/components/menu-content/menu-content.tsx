import type { FC } from "react";
import type { IMenuContent } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

const MenuContentBase: FC<IMenuContent> = (
  _props: IMenuContent & React.ComponentProps<typeof MenuContentBase>,
): React.ReactNode & React.JSX.Element => <></>;

const MenuContent = registerComponent("MenuContent", MenuContentBase);

export { MenuContent };
