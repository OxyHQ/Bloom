import type { FC } from "react";
import { View } from "react-native";
import type { IMenuTrigger } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

const MenuTriggerBase: FC<IMenuTrigger> = ({
  style,
  children,
}: IMenuTrigger &
  React.ComponentProps<typeof MenuTriggerBase>): React.ReactNode &
  React.JSX.Element => <View style={style}>{children}</View>;

const MenuTrigger = registerComponent("MenuTrigger", MenuTriggerBase);

export { MenuTrigger };
