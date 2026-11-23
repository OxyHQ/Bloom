import type { FC } from "react";
import { registerComponent } from "../../utils/register-component.util";

const MenuSeparatorBase: FC = (): React.ReactNode & React.JSX.Element => <></>;
const MenuSeparator = registerComponent("MenuSeparator", MenuSeparatorBase);

export { MenuSeparator };
