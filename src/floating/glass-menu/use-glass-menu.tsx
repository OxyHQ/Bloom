/**
 * What every menu family shares to present as the native glass menu (Android 13+): reading its
 * rows as data, the open state across React and the native overlay, and the native view that
 * hosts the trigger. A family brings its own row parts and its own `Content` component.
 */
import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { View } from 'react-native';

import { useTheme } from '../../theme/use-theme';
import { useMenuPalette } from '../menu-palette';
import {
  GLASS_MENU_ICON_HOST_ID,
  type GlassMenuNativeHandle,
  type GlassMenuNativeItem,
  getNativeGlassMenu,
} from './native-glass-menu';
import { type GlassMenuParts, type ParsedGlassMenu, parseGlassMenu } from './parse-glass-menu';
import { useGlassPrimary } from './use-glass-primary';

/** A menu's rows, read as data for the native glass menu. */
export interface MenuGlass extends ParsedGlassMenu {
  nativeRef: RefObject<GlassMenuNativeHandle | null>;
  select: (id: string) => void;
  /** The native menu opened or closed itself. */
  openChange: (open: boolean) => void;
}

/** The element of `type` among `children`, looking through fragments only. */
function findElement(
  children: ReactNode,
  type: unknown,
): ReactElement<{ children?: ReactNode }> | null {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.type === type) return child as ReactElement<{ children?: ReactNode }>;
    if (child.type === Fragment) {
      const inner = findElement((child.props as { children?: ReactNode }).children, type);
      if (inner) return inner;
    }
  }
  return null;
}

export interface UseGlassMenuOptions {
  /** The family's root children, which hold its `Content`. */
  children: ReactNode;
  /** The family's `Content` component, whose children are the rows. */
  content: unknown;
  /** The family's row parts. */
  rows: GlassMenuParts;
  /** Whether the family's own state says the menu is open. */
  open: boolean;
  /** Sets the family's own open state. */
  setOpen: (open: boolean) => void;
}

/**
 * The menu as the native glass menu takes it (Android 13+, in a binary that has Bloom's module),
 * or `undefined` when it cannot: the menu then keeps its sheet. Rows outside the glass menu's
 * vocabulary (see `parseGlassMenu`) also keep the sheet.
 */
export function useGlassMenu({
  children,
  content,
  rows,
  open,
  setOpen,
}: UseGlassMenuOptions): MenuGlass | undefined {
  const available = getNativeGlassMenu() != null;
  const nativeRef = useRef<GlassMenuNativeHandle | null>(null);
  const nativeOpen = useRef(false);
  const element = available ? findElement(children, content) : null;
  const parsed = element ? parseGlassMenu(element.props.children, rows) : null;

  const handlers = useRef(parsed?.handlers ?? {});
  handlers.current = parsed?.handlers ?? {};
  const itemsKey = parsed ? JSON.stringify(parsed.items) : '';
  const items = useMemo<GlassMenuNativeItem[] | undefined>(
    () => (itemsKey ? JSON.parse(itemsKey) : undefined),
    [itemsKey],
  );
  const icons = parsed?.icons;
  const select = useCallback((id: string) => handlers.current[id]?.(), []);
  const openChange = useCallback(
    (next: boolean) => {
      nativeOpen.current = next;
      setOpen(next);
    },
    [setOpen],
  );

  // An open or close the owner makes through its own state reaches the native menu here; the
  // native menu's own opens and closes arrive through `openChange` first and find nothing to do.
  const present = items != null;
  useEffect(() => {
    if (!present || open === nativeOpen.current) return;
    nativeOpen.current = open;
    void (open ? nativeRef.current?.open() : nativeRef.current?.close());
  }, [present, open]);

  return useMemo(
    () =>
      items && icons
        ? { items, icons, handlers: handlers.current, nativeRef, select, openChange }
        : undefined,
    [items, icons, select, openChange],
  );
}

export interface GlassTriggerProps {
  glass: MenuGlass;
  /** Draw the trigger itself as glass (a fixed-layer control), not only the menu. */
  triggerGlass: boolean;
  tone: 'neutral' | 'primary';
  tint?: string;
  children: ReactNode;
}

/**
 * The native glass view around a trigger. It reads the theme, so it is a component of its own:
 * only a menu the native glass menu presents mounts it, and every other menu stays free of the
 * theme (as the sheet always was).
 */
export function GlassTrigger({ glass, triggerGlass, tone, tint, children }: GlassTriggerProps) {
  const NativeGlassMenu = getNativeGlassMenu();
  const dark = useTheme().isDark;
  const primary = useGlassPrimary().color;
  const { surface, border, text, textSecondary, destructive, trigger } = useMenuPalette();
  // Bloom's menu palette colours the glass: its surface tints the panel, its ink draws the rows.
  const config = useMemo(
    () => ({
      tintColor: surface,
      tintOpacity: dark ? 0.72 : 0.6,
      textColor: text,
      mutedColor: textSecondary,
      destructiveColor: destructive,
      separatorColor: border,
    }),
    [surface, border, text, textSecondary, destructive, dark],
  );
  const triggerConfig = tint
    ? { tintColor: tint, tintOpacity: 0.96 }
    : tone === 'primary'
      ? { tintColor: primary, tintOpacity: 0.96 }
      : { tintColor: trigger.background, tintOpacity: 0.5 };
  if (!NativeGlassMenu) return <>{children}</>;
  return (
    <NativeGlassMenu
      ref={glass.nativeRef}
      items={glass.items}
      glass={triggerGlass}
      colorScheme={dark ? 'dark' : 'light'}
      config={config}
      triggerConfig={triggerConfig}
      style={TRIGGER_STYLE}
      onItemSelect={(event) => glass.select(event.nativeEvent.id)}
      onMenuOpenChange={(event) => glass.openChange(event.nativeEvent.open)}
    >
      {children}
      <View
        nativeID={GLASS_MENU_ICON_HOST_ID}
        collapsable={false}
        pointerEvents="none"
        style={ICON_HOST_STYLE}
      >
        {glass.icons.map((icon, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the slot index is the identity the native side uses
          <View key={index} collapsable={false} style={ICON_SLOT_STYLE}>
            {icon}
          </View>
        ))}
      </View>
    </NativeGlassMenu>
  );
}

const TRIGGER_STYLE = { alignSelf: 'flex-start' } as const;
const ICON_HOST_STYLE = { position: 'absolute', left: 0, top: 0 } as const;
const ICON_SLOT_STYLE = { alignSelf: 'flex-start' } as const;
