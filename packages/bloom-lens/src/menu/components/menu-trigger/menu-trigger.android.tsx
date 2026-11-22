import { useContext, type FC, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MENU_ICON_HOST_ID } from "../../constants/menu.const";
import type { IMenuContext } from "../../context/interface";
import { MenuContext } from "../../context/menu.context";
import type { IMenuTrigger, TMenuSelectEvent } from "../../interface";
import { registerComponent } from "../../utils/register-component.util";
import { NativeMenu } from "./native-menu.android";

const MenuTriggerBase: FC<IMenuTrigger> = ({
  lens,
  morph,
  cornerRadius,
  config,
  openOnPress = true,
  openWithItems,
  onMenuClosed,
  restBackdrop,
  openOnTap,
  accessibilityLabel,
  style,
  children,
}: IMenuTrigger &
  React.ComponentProps<typeof MenuTriggerBase>): React.ReactNode &
  React.JSX.Element => {
  const menu = useContext<IMenuContext | null>(MenuContext);

  return (
    <NativeMenu
      ref={menu?.native}
      items={menu?.items ?? []}
      colorScheme={menu?.scheme}
      menuWidth={menu?.content.width}
      fontFamily={menu?.content.fontFamily}
      alignment={menu?.content.alignment}
      config={menu?.content.config}
      lens={lens}
      morph={morph}
      cornerRadius={cornerRadius}
      triggerConfig={config}
      openWithItems={openWithItems}
      onMenuClosed={onMenuClosed}
      restBackdrop={restBackdrop}
      openOnTap={openOnTap}
      style={style}
      onItemSelect={(event: { nativeEvent: TMenuSelectEvent }): void =>
        menu?.select(event.nativeEvent)
      }
      onMenuOpenChange={(event: { nativeEvent: { open: boolean } }): void =>
        menu?.openChange?.(event.nativeEvent.open)
      }
    >
      {children}
      {openOnPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={StyleSheet.absoluteFill}
          onPress={() => menu?.handle.open()}
        />
      ) : null}
      <View
        nativeID={MENU_ICON_HOST_ID}
        collapsable={false}
        pointerEvents="none"
        style={styles.iconHost}
      >
        {(menu?.icons ?? []).map(
          (icon: ReactNode, index: number): React.JSX.Element => (
            <View key={index} collapsable={false} style={styles.iconSlot}>
              {icon}
            </View>
          ),
        )}
      </View>
    </NativeMenu>
  );
};

const styles = StyleSheet.create({
  iconHost: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  iconSlot: {
    alignSelf: "flex-start",
  },
});

const MenuTrigger = registerComponent("MenuTrigger", MenuTriggerBase);

export { MenuTrigger };
