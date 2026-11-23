import type { FC } from "react";
import { Pressable } from "react-native";

import type { TMenuTriggerButton } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

const MenuTriggerButtonBase: FC<TMenuTriggerButton> = (
  props: TMenuTriggerButton &
    React.ComponentProps<typeof MenuTriggerButtonBase>,
): React.ReactNode & React.JSX.Element => <Pressable {...props} />;

const MenuTriggerButton = registerComponent(
  "MenuTriggerButton",
  MenuTriggerButtonBase,
);

export { MenuTriggerButton };
