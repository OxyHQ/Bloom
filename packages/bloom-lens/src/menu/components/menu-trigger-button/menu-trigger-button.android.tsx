import { useContext, useRef, type ComponentRef, type FC } from "react";
import { Pressable, type GestureResponderEvent } from "react-native";
import type { IMenuContext } from "../../context/interface";
import { MenuContext } from "../../context/menu.context";
import type { TMenuTriggerButton } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";

const MenuTriggerButtonBase: FC<TMenuTriggerButton> = ({
  onPress,
  ...rest
}: TMenuTriggerButton &
  React.ComponentProps<typeof MenuTriggerButtonBase>): React.ReactNode &
  React.JSX.Element => {
  const menu = useContext<IMenuContext | null>(MenuContext);
  const button = useRef<ComponentRef<typeof Pressable> | null>(null);

  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      ref={button}
      onPress={(event: GestureResponderEvent) => {
        onPress?.(event);
        button.current?.measureInWindow(
          (x: number, y: number, width: number, height: number) =>
            menu?.handle.open({ x, y, width, height }),
        );
      }}
    />
  );
};

const MenuTriggerButton = registerComponent(
  "MenuTriggerButton",
  MenuTriggerButtonBase,
);

export { MenuTriggerButton };
