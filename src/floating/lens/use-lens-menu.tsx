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
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';

import { useTheme } from '../../theme/use-theme';
import { useMenuPalette } from '../menu-palette';
import { MENU_FONT_FAMILY } from '../menu-type';
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
  /** Whether the menu was open as these rows arrived: a native view mounted now opens itself. */
  open: boolean;
  /**
   * The rows arrive only as the menu opens (a `Content` the owner mounts only while it is open):
   * the native view, mounted with the trigger, opens itself as they arrive.
   */
  deferred: boolean;
  select: (id: string) => void;
  /** The native menu opened or closed itself. */
  openChange: (open: boolean) => void;
  /** The native menu has finished closing. */
  closed: () => void;
}

/**
 * Where a family's `Content` rendered out of its root's sight (by a component of the owner's,
 * such as one mounted only while the menu is open) hands the root its props.
 */
export interface LensContentProvider {
  /** Whether the native lens menu can draw a `Content` with these props. */
  accepts: (props: object) => boolean;
  /** The mounted `Content`'s props, or `null` as it unmounts. */
  provide: (props: object | null) => void;
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

export interface LensMenuState {
  /** The menu as the native lens menu takes it, or `undefined`: the menu keeps its sheet. */
  lens: MenuLens | undefined;
  /**
   * The native view around the trigger: `lens`, or, while the rows of a `Content` the root cannot
   * see have not arrived, the same view with no rows yet, waiting for them.
   */
  host: MenuLens | undefined;
  /**
   * Set when the native lens menu is available and the `Content` is not among the root's
   * children: the `Content` provides its props through `useLensContent` once it is mounted.
   */
  contentProvider: LensContentProvider | undefined;
}

/**
 * The menu as the native lens menu takes it (Android 13+, in a binary that has Bloom's module),
 * or `undefined` when it cannot: the menu then keeps its sheet. Rows outside the lens menu's
 * vocabulary (see `parseLensMenu`) also keep the sheet.
 *
 * The native view is the trigger, mounted with it: it draws the trigger, sees the press first and
 * opens natively from where it is, with no remount. The rows are read from the `Content` among
 * the root's children, before the menu opens, and a press is one call to the engine. When the
 * `Content` is rendered by a component of the owner's (one that mounts only while the menu is
 * open, so a closed menu does no row work), its rows arrive from the props that `Content`
 * provides as it mounts, and the view opens itself with them (`openWithItems`). Either way the
 * rows are kept until the native menu has finished closing, so its closing motion is not cut
 * short.
 */
export function useLensMenu({
  children,
  content,
  parse,
  open,
  setOpen,
}: UseLensMenuOptions): LensMenuState {
  const available = getNativeLens() != null;
  const nativeRef = useRef<LensNativeHandle | null>(null);
  const nativeOpen = useRef(false);
  const element = available ? findElement(children, content) : null;
  const [provided, setProvided] = useState<Record<string, unknown> | null>(null);
  const props = element ? (element.props as Record<string, unknown>) : provided;
  const parsed = props ? parse(props) : null;

  const parseRef = useRef(parse);
  parseRef.current = parse;
  // The native menu is open or still closing; a `Content` that unmounts meanwhile is withdrawn
  // once it has closed.
  const showing = useRef(false);
  const withdrawn = useRef(false);
  const provider = useMemo<LensContentProvider>(
    () => ({
      accepts: (next) => parseRef.current(next as Record<string, unknown>) != null,
      provide: (next) => {
        if (next == null && showing.current) {
          withdrawn.current = true;
          return;
        }
        withdrawn.current = false;
        setProvided(next as Record<string, unknown> | null);
      },
    }),
    [],
  );
  const closed = useCallback(() => {
    showing.current = false;
    if (!withdrawn.current) return;
    withdrawn.current = false;
    setProvided(null);
  }, []);

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
      if (next) showing.current = true;
      setOpen(next);
    },
    [setOpen],
  );

  // An open or close the owner makes through its own state reaches the native menu here; the
  // native menu's own opens and closes arrive through `openChange` first and find nothing to do.
  // A native view that mounts with the menu open opens itself (`MenuLens.open`): it cannot take
  // a call before it is mounted.
  const present = items != null;
  const mounted = useRef(false);
  useEffect(() => {
    if (!present) {
      mounted.current = false;
      nativeOpen.current = false;
      return;
    }
    const mounting = !mounted.current;
    mounted.current = true;
    if (open === nativeOpen.current) return;
    nativeOpen.current = open;
    if (mounting) return;
    void (open ? nativeRef.current?.open() : nativeRef.current?.close());
  }, [present, open]);

  // A `Content` the root cannot see brings its rows as the menu opens; the view waits for them.
  const deferred = available && !element;
  const host = useMemo(
    () =>
      (items && icons) || deferred
        ? {
            items: items ?? NO_ITEMS,
            icons: icons ?? NO_ICONS,
            handlers: handlers.current,
            nativeRef,
            open,
            deferred,
            select,
            openChange,
            closed,
          }
        : undefined,
    [items, icons, deferred, open, select, openChange, closed],
  );
  return {
    lens: items ? host : undefined,
    host,
    contentProvider: deferred ? provider : undefined,
  };
}

const NO_ITEMS: LensNativeItem[] = [];
const NO_ICONS: ReactNode[] = [];

/**
 * For a family's `Content`: provides its props to the root when the root cannot see it (see
 * `useLensMenu`), and says whether the native lens menu draws its rows, in which case the
 * `Content` renders nothing. Pass the `Content`'s props object itself, so a render that changes
 * nothing provides nothing new.
 */
export function useLensContent(provider: LensContentProvider | undefined, props: object): boolean {
  const draws = provider?.accepts(props) ?? false;
  useLayoutEffect(() => {
    if (!provider || !draws) return;
    provider.provide(props);
    return () => provider.provide(null);
  }, [provider, draws, props]);
  return draws;
}

/** What a trigger's own surface looks like, so the menu can morph out of it. */
export interface LensOrigin {
  /** The trigger's fill (`#rrggbb` or `rgb(...)`). */
  tint: string;
  /** The trigger's corner radius in dp. */
  radius: number;
}

const LensOriginContext = createContext<((origin: LensOrigin | null) => void) | null>(null);
LensOriginContext.displayName = 'BloomLensOriginContext';

/**
 * Where a control inside a lens trigger reports its own surface. A `Button` that is the trigger
 * of a menu publishes its fill and radius here, and the menu morphs out of that shape. Null
 * outside a lens trigger.
 */
export function useLensOriginReporter(): ((origin: LensOrigin | null) => void) | null {
  return useContext(LensOriginContext);
}

interface LensTriggerProps {
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
  const [origin, setOrigin] = useState<LensOrigin | null>(null);
  // Read once: a view that mounts with the menu open opens itself.
  const [openAtMount] = useState(lens.open);
  const triggerConfig = tint
    ? { tintColor: tint, tintOpacity: 0.96 }
    : tone === 'primary'
      ? { tintColor: primary, tintOpacity: 0.96 }
      : origin
        ? { tintColor: origin.tint, tintOpacity: 0.96 }
        : { tintColor: trigger.background, tintOpacity: 0.5 };
  if (!NativeLens) return <>{children}</>;
  return (
    <NativeLens
      ref={lens.nativeRef}
      items={lens.items}
      lens={triggerLens}
      morph
      cornerRadius={origin?.radius}
      colorScheme={dark ? 'dark' : 'light'}
      fontFamily={MENU_FONT_FAMILY.fontFamily}
      alignment="auto"
      config={config}
      triggerConfig={triggerConfig}
      openWithItems={lens.deferred || openAtMount}
      style={TRIGGER_STYLE}
      onItemSelect={(event) => lens.select(event.nativeEvent.id)}
      onMenuOpenChange={(event) => lens.openChange(event.nativeEvent.open)}
      onMenuClosed={lens.closed}
    >
      <LensOriginContext.Provider value={setOrigin}>{children}</LensOriginContext.Provider>
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
