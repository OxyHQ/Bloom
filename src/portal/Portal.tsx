import type React from 'react';
import {
  createContext,
  Fragment,
  memo,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Z_INDEX } from '../styles/z-index';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { ThemeScopeContext } from '../theme/color-scope/context';
import { ThemeScopeBridge } from '../theme/color-scope/ThemeScopeBridge';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import {
  collectBridgedContexts,
  PortalContextBridge,
  PortalFiberAnchor,
  readBridgedContext,
  type PortalFiber,
} from './context-bridge';

type Component = React.ReactElement;

type Actions = {
  append(id: string, component: Component): void;
  remove(id: string): void;
};

type ComponentMap = {
  [id: string]: Component | null;
};

function createPortalGroup() {
  // Two contexts, not one. The actions never change, so a `<Portal>` that only
  // needs them is not re-rendered by every other portal's append; the outlet's
  // element changes on every append and only the outlet reads it.
  const ActionsContext = createContext<Actions>({ append: () => {}, remove: () => {} });
  ActionsContext.displayName = 'BloomPortalContext';
  const OutletContext = createContext<Component | null>(null);
  OutletContext.displayName = 'BloomPortalOutletContext';
  const OWN_CONTEXTS = [ActionsContext, OutletContext] as const;

  function Provider(props: React.PropsWithChildren<object>) {
    const map = useRef<ComponentMap>({});
    const [outlet, setOutlet] = useState<Component | null>(null);

    const actions = useMemo<Actions>(
      () => ({
        // Replacing an id keeps its place: order at the outlet is MOUNT order,
        // and an update must not move a surface above one opened after it.
        append: (id, component) => {
          map.current[id] = <Fragment key={id}>{component}</Fragment>;
          setOutlet(<>{Object.values(map.current)}</>);
        },
        remove: (id) => {
          if (!(id in map.current)) return;
          delete map.current[id];
          setOutlet(<>{Object.values(map.current)}</>);
        },
      }),
      [],
    );

    return (
      <ActionsContext.Provider value={actions}>
        <OutletContext.Provider value={outlet}>{props.children}</OutletContext.Provider>
      </ActionsContext.Provider>
    );
  }

  function Outlet() {
    const outlet = useContext(OutletContext);
    if (Platform.OS === 'web') {
      return (
        <View pointerEvents="box-none" style={styles.portalOutlet}>
          {outlet}
        </View>
      );
    }
    return outlet;
  }

  /**
   * Registers `element` under this portal's id while mounted. A layout effect,
   * so the outlet commits the content in the same frame as the tree that
   * rendered the portal — a context change above the portal reaches the
   * portaled content without a frame where the two disagree.
   */
  function usePortalEntry(element: Component) {
    const { append, remove } = useContext(ActionsContext);
    const id = useId();
    useLayoutEffect(() => {
      append(id, element);
    }, [id, element, append]);
    useLayoutEffect(() => () => remove(id), [id, remove]);
  }

  /** The content inside every context the portal itself sees (`./context-bridge`). */
  function BridgedPortal({ fiber, children }: React.PropsWithChildren<{ fiber: PortalFiber }>) {
    const contexts = collectBridgedContexts(fiber, OWN_CONTEXTS);
    // Subscribes this portal to every bridged context: a new value re-renders it
    // and re-registers the content with that value.
    const values = contexts.map((context) => readBridgedContext(context));
    const last = useRef<{
      contexts: unknown[];
      values: unknown[];
      children: React.ReactNode;
      element: Component;
    } | null>(null);
    const previous = last.current;
    const element =
      previous &&
      previous.children === children &&
      sameList(previous.contexts, contexts) &&
      sameList(previous.values, values) ? (
        previous.element
      ) : (
        <PortalContextBridge contexts={contexts} values={values}>
          {children}
        </PortalContextBridge>
      );
    last.current = { contexts, values, children, element };
    usePortalEntry(element);
    return null;
  }

  /** No fiber to walk (a React that hides it): Bloom's theme alone, as before. */
  function ThemedPortal({ children }: React.PropsWithChildren<object>) {
    const theme = useContext(BloomThemeContext);
    const scope = useContext(ThemeScopeContext);
    const element = useMemo(
      () => (
        <ThemeScopeBridge theme={theme} scope={scope}>
          {children}
        </ThemeScopeBridge>
      ),
      [theme, scope, children],
    );
    usePortalEntry(element);
    return null;
  }

  function Portal({ children }: React.PropsWithChildren<object>) {
    return (
      <PortalFiberAnchor>
        {(fiber) =>
          fiber ? (
            <BridgedPortal fiber={fiber}>{children}</BridgedPortal>
          ) : (
            <ThemedPortal>{children}</ThemedPortal>
          )
        }
      </PortalFiberAnchor>
    );
  }

  return { Provider, Outlet, Portal };
}

function sameList(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index++) if (!Object.is(a[index], b[index])) return false;
  return true;
}

type PortalGroup = ReturnType<typeof createPortalGroup>;

declare global {
  var __oxy_so_bloom_portal_group__: PortalGroup | undefined;
}

/**
 * `DefaultPortal` is a `globalThis`-guarded singleton so that every physical copy of
 * this module shares ONE portal group (one `Context`, one `Provider`/`Outlet`/`Portal`
 * triple).
 *
 * Why this is required: like the theme module, `exports["./portal"]` ships a
 * `react-native` → `./src/...` condition alongside the `lib/module` / `lib/commonjs`
 * forks, and the `Portal` component is consumed cross-subpath from `./tooltip`,
 * `./dialog`, `./select`, `./menu`, `./context-menu`, and `./popover`
 * while `PortalProvider`/`PortalOutlet` are mounted once at the app root via
 * `@oxy.so/bloom/portal`.
 * A bundler can resolve those subpaths through different export conditions, so without a
 * guard each physical copy runs its own `createPortalGroup()` and a `<Portal>` from copy
 * A would register against the `Provider`'s map in copy B — its content would never reach
 * the `Outlet`. Anchoring the group on `globalThis` (keyed by `__oxy_so_bloom_portal_group__`)
 * collapses all copies onto one group. Same src-vs-lib dual-instance class as
 * `BloomThemeContext`.
 */
const DefaultPortal: PortalGroup = (globalThis.__oxy_so_bloom_portal_group__ ??=
  createPortalGroup());

export const PortalProvider = DefaultPortal.Provider;
export const PortalOutlet = memo(DefaultPortal.Outlet);
export const Portal = DefaultPortal.Portal;

const styles = StyleSheet.create({
  // Applied only from the `Platform.OS === 'web'` branch of `Outlet`, which is
  // why the web-only `position` value is honest in this universal file.
  portalOutlet: {
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // `box-none` rides on the PROP above — react-native-web only resolves that
    // RN-only value from the prop path, so as a style entry it is silently
    // inert and this full-viewport outlet swallows every click in the app.
    zIndex: Z_INDEX.portalRoot,
  },
});
