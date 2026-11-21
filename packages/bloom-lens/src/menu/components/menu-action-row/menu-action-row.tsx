import type { FC } from "react";
import type { IMenuActionRow } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

// Declarative only: parseMenuContent reads its items (the actions of the top row of the content).
const MenuActionRowBase: FC<IMenuActionRow> = (
  _props: IMenuActionRow & React.ComponentProps<typeof MenuActionRowBase>,
): React.ReactNode & React.JSX.Element => <></>;

const MenuActionRow = registerComponent("MenuActionRow", MenuActionRowBase);

export { MenuActionRow };
