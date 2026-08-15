import React, {
  createContext,
  Fragment,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Z_INDEX } from '../styles/z-index';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';

type Component = React.ReactElement;

type ContextType = {
  outlet: Component | null;
  append(id: string, component: Component): void;
  remove(id: string): void;
};

type ComponentMap = {
  [id: string]: Component | null;
};

function createPortalGroup() {
  const Context = createContext<ContextType>({
    outlet: null,
    append: () => {},
    remove: () => {},
  });
  Context.displayName = 'BloomPortalContext';

  function Provider(props: React.PropsWithChildren<object>) {
    const map = useRef<ComponentMap>({});
    const [outlet, setOutlet] = useState<ContextType['outlet']>(null);

    const append = useCallback<ContextType['append']>((id, component) => {
      map.current[id] = <Fragment key={id}>{component}</Fragment>;
      setOutlet(<>{Object.values(map.current)}</>);
    }, []);

    const remove = useCallback<ContextType['remove']>((id) => {
      delete map.current[id];
      setOutlet(<>{Object.values(map.current)}</>);
    }, []);

    const contextValue = useMemo(
      () => ({ outlet, append, remove }),
      [outlet, append, remove],
    );

    return (
      <Context.Provider value={contextValue}>
        {props.children}
      </Context.Provider>
    );
  }

  function Outlet() {
    const ctx = useContext(Context);
    if (Platform.OS === 'web') {
      return <View pointerEvents="box-none" style={styles.portalOutlet}>{ctx.outlet}</View>;
    }
    return ctx.outlet;
  }

  function Portal({ children }: React.PropsWithChildren<object>) {
    const { append, remove } = useContext(Context);
    const id = useId();

    useEffect(() => {
      append(id, children as Component);
      return () => remove(id);
    }, [id, children, append, remove]);

    return null;
  }

  return { Provider, Outlet, Portal };
}

type PortalGroup = ReturnType<typeof createPortalGroup>;

declare global {
  // eslint-disable-next-line no-var
  var __oxyhq_bloom_portal_group__: PortalGroup | undefined;
}

/**
 * `DefaultPortal` is a `globalThis`-guarded singleton so that every physical copy of
 * this module shares ONE portal group (one `Context`, one `Provider`/`Outlet`/`Portal`
 * triple).
 *
 * Why this is required: like the theme module, `exports["./portal"]` ships a
 * `react-native` → `./src/...` condition alongside the `lib/module` / `lib/commonjs`
 * forks, and the `Portal` component is consumed cross-subpath from `./tooltip`,
 * `./prompt-input`, `./dialog`, `./select`, `./menu`, `./context-menu`, and `./popover`
 * while `PortalProvider`/`PortalOutlet` are mounted once at the app root via
 * `@oxyhq/bloom/portal`.
 * A bundler can resolve those subpaths through different export conditions, so without a
 * guard each physical copy runs its own `createPortalGroup()` and a `<Portal>` from copy
 * A would register against the `Provider`'s map in copy B — its content would never reach
 * the `Outlet`. Anchoring the group on `globalThis` (keyed by `__oxyhq_bloom_portal_group__`)
 * collapses all copies onto one group. Same src-vs-lib dual-instance class as
 * `BloomThemeContext`.
 */
const DefaultPortal: PortalGroup = (globalThis.__oxyhq_bloom_portal_group__ ??=
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
