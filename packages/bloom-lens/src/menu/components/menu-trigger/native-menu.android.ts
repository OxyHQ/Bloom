import { requireNativeView } from "expo";
import type { ComponentType } from "react";
import { MENU_NATIVE_VIEW } from "../../constants/menu.const";
import type { INativeMenu } from "./interface";

const NativeMenu: ComponentType<INativeMenu> =
  requireNativeView<INativeMenu>(MENU_NATIVE_VIEW);

export { NativeMenu };
