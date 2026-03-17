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
      return <View style={styles.portalOutlet}>{ctx.outlet}</View>;
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

const DefaultPortal = createPortalGroup();

export const Provider = DefaultPortal.Provider;
export const Outlet = memo(DefaultPortal.Outlet);
export const Portal = DefaultPortal.Portal;

const styles = StyleSheet.create({
  portalOutlet: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
    zIndex: 999999,
  },
});
