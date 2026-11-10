/**
 * What every menu family shares to present as the native lens menu (Android 13+): reading its
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
  LENS_ICON_HOST_ID,
  type LensNativeHandle,
  type LensNativeItem,
  getNativeLens,
} from './native-lens';
import type { ParsedLensMenu } from './parse-lens-menu';
import { useLensTint } from './use-lens-tint';

/** A menu's rows, read as data for the native lens menu. */
export interface MenuLens extends ParsedLensMenu {
  nativeRef: RefObject<LensNativeHandle | null>;
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

export interface UseLensMenuOptions {
  /** The family's root children, which hold its `Content`. */
  children: ReactNode;
  /** The family's `Content` component, whose children are the rows. */
  content: unknown;
  /** Reads the `Content` element's props as rows; `null` when they leave the vocabulary. */
  parse: (props: Record<string, unknown>) => ParsedLensMenu | null;
  /** Whether the family's own state says the menu is open. */
  open: boolean;
  /** Sets the family's own open state. */
  setOpen: (open: boolean) => void;
}

/**
 * The menu as the native lens menu takes it (Android 13+, in a binary that has Bloom's module),
 * or `undefined` when it cannot: the menu then keeps its sheet. Rows outside the lens menu's
 * vocabulary (see `parseLensMenu`) also keep the sheet.
 */
export function useLensMenu({
  children,
  content,
  parse,
  open,
  setOpen,
}: UseLensMenuOptions): MenuLens | undefined {
  const available = getNativeLens() != null;
  const nativeRef = useRef<LensNativeHandle | null>(null);
  const nativeOpen = useRef(false);
  const element = available ? findElement(children, content) : null;
  const parsed = element ? parse(element.props as Record<string, unknown>) : null;

  const handlers = useRef(parsed?.handlers ?? {});
  handlers.current = parsed?.handlers ?? {};
  const itemsKey = parsed ? JSON.stringify(parsed.items) : '';
  const items = useMemo<LensNativeItem[] | undefined>(
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

export interface LensTriggerProps {
  lens: MenuLens;
  /** Draw the trigger itself as lens (a fixed-layer control), not only the menu. */
  triggerLens: boolean;
  tone: 'neutral' | 'primary';
  tint?: string;
  children: ReactNode;
}

/**
 * The native lens view around a trigger. It reads the theme, so it is a component of its own:
 * only a menu the native lens menu presents mounts it, and every other menu stays free of the
 * theme (as the sheet always was).
 */
export function LensTrigger({ lens, triggerLens, tone, tint, children }: LensTriggerProps) {
  const NativeLens = getNativeLens();
  const dark = useTheme().isDark;
  const primary = useLensTint().color;
  const { surface, border, text, textSecondary, destructive, trigger } = useMenuPalette();
  // Bloom's menu palette colours the lens: its surface tints the panel, its ink draws the rows.
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
  if (!NativeLens) return <>{children}</>;
  return (
    <NativeLens
      ref={lens.nativeRef}
      items={lens.items}
      lens={triggerLens}
      colorScheme={dark ? 'dark' : 'light'}
      config={config}
      triggerConfig={triggerConfig}
      style={TRIGGER_STYLE}
      onItemSelect={(event) => lens.select(event.nativeEvent.id)}
      onMenuOpenChange={(event) => lens.openChange(event.nativeEvent.open)}
    >
      {children}
      <View
        nativeID={LENS_ICON_HOST_ID}
        collapsable={false}
        pointerEvents="none"
        style={ICON_HOST_STYLE}
      >
        {lens.icons.map((icon, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the slot index is the identity the native side uses
          <View key={index} collapsable={false} style={ICON_SLOT_STYLE}>
            {icon}
          </View>
        ))}
      </View>
    </NativeLens>
  );
}

const TRIGGER_STYLE = { alignSelf: 'flex-start' } as const;
const ICON_HOST_STYLE = { position: 'absolute', left: 0, top: 0 } as const;
const ICON_SLOT_STYLE = { alignSelf: 'flex-start' } as const;
