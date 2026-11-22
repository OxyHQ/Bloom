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
import { useTheme } from '../../theme/use-theme';
import { useMenuPalette } from '../menu-palette';
import { MENU_FONT_FAMILY } from '../menu-type';
import {
  type LensHandle,
  type LensRow,
  getNativeLens,
  useInLensBase,
  useLensBaseMenu,
} from './native-lens';
import type { ParsedLensMenu } from './parse-lens-menu';
import { useLensTint } from './use-lens-tint';

/** A menu's rows, read as data for the native lens menu. */
export interface MenuLens extends ParsedLensMenu {
  /** The menu in its lens base: what opens and closes it. */
  nativeRef: RefObject<LensHandle | null>;
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
  const nativeRef = useRef<LensHandle | null>(null);
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

  const rows = parsed?.rows;
  const openChange = useCallback(
    (next: boolean) => {
      nativeOpen.current = next;
      if (next) showing.current = true;
      setOpen(next);
    },
    [setOpen],
  );

  // An open or close the owner makes through its own state reaches the native menu here (rows
  // that arrive only as it opens open it as they arrive); the native menu's own opens and closes
  // arrive through `openChange` first and find nothing to do.
  const present = rows != null;
  useEffect(() => {
    if (!present) {
      nativeOpen.current = false;
      return;
    }
    if (open === nativeOpen.current) return;
    nativeOpen.current = open;
    if (open) nativeRef.current?.open();
    else nativeRef.current?.close();
  }, [present, open]);

  // A `Content` the root cannot see brings its rows as the menu opens: the trigger is the lens
  // base's all the same, waiting for them.
  const deferred = available && !element;
  const host = useMemo(
    () => (rows || deferred ? { rows: rows ?? NO_ROWS, nativeRef, openChange, closed } : undefined),
    [rows, deferred, openChange, closed],
  );
  return {
    lens: rows ? host : undefined,
    host,
    contentProvider: deferred ? provider : undefined,
  };
}

const NO_ROWS: LensRow[] = [];

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
 * The trigger of a menu the native lens presents: inside a lens base (a lens group, a bar) the
 * menu is that base's and grows out of it; anywhere else the trigger is a base of its own. It
 * reads the theme, so it is a component of its own: only a menu the lens presents mounts it.
 */
export function LensTrigger({ lens, triggerLens, tone, tint, children }: LensTriggerProps) {
  const native = getNativeLens();
  const inBase = useInLensBase();
  const dark = useTheme().isDark;
  const primary = useLensTint().color;
  const [origin, setOrigin] = useState<LensOrigin | null>(null);
  // A coloured trigger (a tint, the primary tone, a filled Button) morphs out of its own colour;
  // any other out of the untinted lens, as the engine's upstream app does.
  const fill = tint ?? (tone === 'primary' ? primary : origin?.tint);
  const triggerConfig = useMemo(
    () => (fill ? { tintColor: fill, tintOpacity: 0.96 } : undefined),
    [fill],
  );
  if (!native) return <>{children}</>;
  const opener = <LensOpener lens={lens}>{children}</LensOpener>;
  if (inBase) return opener;
  const { LensBase } = native;
  return (
    <LensBase
      lens={triggerLens}
      colorScheme={dark ? 'dark' : 'light'}
      cornerRadius={origin?.radius}
      config={triggerConfig}
      style={TRIGGER_STYLE}
    >
      <LensOriginContext.Provider value={setOrigin}>{opener}</LensOriginContext.Provider>
    </LensBase>
  );
}

/** The menu in the nearest base: Bloom's menu palette colours the panel and inks the rows. */
function LensOpener({ lens, children }: { lens: MenuLens; children: ReactNode }) {
  const { surface, border, text, textSecondary, destructive } = useMenuPalette();
  const { rows, openChange, closed } = lens;
  const menu = useMemo(
    () =>
      rows.length > 0
        ? {
            rows,
            config: {
              tintColor: surface,
              textColor: text,
              mutedColor: textSecondary,
              destructiveColor: destructive,
              separatorColor: border,
            },
            fontFamily: MENU_FONT_FAMILY.fontFamily,
            onOpenChange: openChange,
            onClosed: closed,
          }
        : null,
    [rows, surface, border, text, textSecondary, destructive, openChange, closed],
  );
  const handle = useLensBaseMenu(menu);
  useLayoutEffect(() => {
    lens.nativeRef.current = handle;
  }, [lens.nativeRef, handle]);
  return <>{children}</>;
}

const TRIGGER_STYLE = { alignSelf: 'flex-start' } as const;
