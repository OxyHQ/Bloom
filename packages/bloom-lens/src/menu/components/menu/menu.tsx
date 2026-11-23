import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type FC,
  type ReactElement,
  type RefObject,
} from "react";
import { useColorScheme } from "react-native";
import type {
  IMenuContext,
  INativeMenuHandle,
  TNativeMenuItem,
  TParsedMenu,
} from "../../context/interface";
import { MenuContext } from "../../context/menu.context";
import type {
  IMenu,
  IMenuContent,
  IMenuHandle,
  TMenuRect,
  TMenuSelectEvent,
} from "../../interface";
import { findMenuContent } from "../../utils/find-menu-content.util";
import { parseMenuContent } from "../../utils/parse-menu-content.util";
import { registerComponent } from "../../utils/register-component.util";

const MenuBase: FC<IMenu> = ({
  ref,
  colorScheme = "auto",
  onSelect,
  onOpenChange,
  children,
}: IMenu & React.ComponentProps<typeof MenuBase>): React.ReactNode &
  React.JSX.Element => {
  const system = useColorScheme();
  const scheme =
    colorScheme === "auto"
      ? system === "light"
        ? "light"
        : "dark"
      : colorScheme;
  const native: RefObject<INativeMenuHandle | null> =
    useRef<INativeMenuHandle | null>(null);

  const handle = useMemo<IMenuHandle>(
    () => ({
      open: (from?: TMenuRect) =>
        void native.current?.open(from?.x, from?.y, from?.width, from?.height),
      close: (): void => void native.current?.close(),
    }),
    [],
  );
  useImperativeHandle<IMenuHandle, IMenuHandle>(ref, () => handle, [handle]);

  const contentElement: ReactElement<IMenuContent> | null =
    findMenuContent(children);
  const contentProps = contentElement?.props ?? null;
  const parsed: TParsedMenu = parseMenuContent(contentProps, scheme);
  const itemsKey = JSON.stringify(parsed.items);
  const items = useMemo<TNativeMenuItem[]>(
    () => JSON.parse(itemsKey) as TNativeMenuItem[],
    [itemsKey],
  );

  const handlers = parsed.handlers;
  const select = useCallback(
    (event: TMenuSelectEvent) => {
      handlers[event.id]?.();
      onSelect?.(event);
    },
    [handlers, onSelect],
  );

  const value: IMenuContext = {
    handle,
    native,
    scheme,
    items,
    icons: parsed.icons,
    content: {
      width: contentProps?.width,
      alignment: contentProps?.alignment,
      fontFamily: contentProps?.fontFamily,
      config: contentProps?.config,
    },
    select,
    openChange: onOpenChange,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

const MenuRoot = registerComponent("Menu", MenuBase);

export { MenuRoot };
