/** Explicit Expo adapter. Never changes Expo's global router or browser history. */
import React, { useEffect, useMemo } from 'react';
import * as Expo from 'expo-router';
import { PanelRouteSlot, useOptionalPanelRouter } from '../PanelRouter';
import { resolvePanelHref } from '../routes';
export type { Href } from 'expo-router';

export const useRouter: typeof Expo.useRouter = () => {
  const global = Expo.useRouter();
  const panel = useOptionalPanelRouter();
  return useMemo(() => {
    if (!panel) return global;
    const external = (href: Expo.Href) =>
      /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(typeof href === 'string' ? href : href.pathname);
    return {
      ...global,
      ...panel,
      push: (href: Expo.Href, options?: Parameters<typeof global.push>[1]) =>
        external(href) ? global.push(href, options) : panel.push(href),
      replace: (href: Expo.Href, options?: Parameters<typeof global.replace>[1]) =>
        external(href) ? global.replace(href, options) : panel.replace(href),
      navigate: (href: Expo.Href, options?: Parameters<typeof global.navigate>[1]) =>
        external(href) ? global.navigate(href, options) : panel.navigate(href),
    } as ReturnType<typeof Expo.useRouter>;
  }, [global, panel]);
};
export const usePathname: typeof Expo.usePathname = () => {
  const pathname = Expo.usePathname();
  return useOptionalPanelRouter()?.pathname ?? pathname;
};
export const useLocalSearchParams: typeof Expo.useLocalSearchParams = () => {
  const params = Expo.useLocalSearchParams();
  return (useOptionalPanelRouter()?.params ?? params) as ReturnType<
    typeof Expo.useLocalSearchParams
  >;
};
export const useGlobalSearchParams: typeof Expo.useGlobalSearchParams = () => {
  const params = Expo.useGlobalSearchParams();
  return (useOptionalPanelRouter()?.params ?? params) as ReturnType<
    typeof Expo.useGlobalSearchParams
  >;
};
export const useIsFocused: typeof Expo.useIsFocused = () => {
  const focused = Expo.useIsFocused();
  return useOptionalPanelRouter()?.active ?? focused;
};
export const useFocusEffect: typeof Expo.useFocusEffect = (effect) => {
  const panel = useOptionalPanelRouter();
  const globalEffect = React.useCallback(() => (panel ? undefined : effect()), [panel, effect]);
  Expo.useFocusEffect(globalEffect);
  const panelKey = panel?.active ? panel.key : undefined;
  useEffect(() => (panelKey ? effect() : undefined), [panelKey, effect]);
};
export const Slot = Object.assign(function Slot(props: React.ComponentProps<typeof Expo.Slot>) {
  return useOptionalPanelRouter() ? <PanelRouteSlot /> : <Expo.Slot {...props} />;
}, Expo.Slot);
export function Redirect(props: React.ComponentProps<typeof Expo.Redirect>) {
  const panel = useOptionalPanelRouter();
  const href = Expo.Link.resolveHref(props.href);
  useEffect(() => {
    if (panel && resolvePanelHref(href, panel.href) !== panel.href) panel.replace(href);
  }, [panel, href]);
  return panel ? null : <Expo.Redirect {...props} />;
}
export const Link: typeof Expo.Link = Object.assign(function Link(
  props: React.ComponentProps<typeof Expo.Link>,
) {
  const panel = useOptionalPanelRouter();
  if (!panel) return <Expo.Link {...props} />;
  const href = resolvePanelHref(props.href, panel.href);
  return (
    <Expo.Link
      {...props}
      href={href as Expo.Href}
      onPress={(event) => {
        props.onPress?.(event);
        const click = event as typeof event & {
          metaKey?: boolean;
          ctrlKey?: boolean;
          shiftKey?: boolean;
          altKey?: boolean;
          button?: number;
        };
        if (
          event.defaultPrevented ||
          click.metaKey ||
          click.ctrlKey ||
          click.shiftKey ||
          click.altKey ||
          (click.button != null && click.button !== 0) ||
          props.target === '_blank' ||
          /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)
        )
          return;
        event.preventDefault();
        if (props.replace) panel.replace(href);
        else if (props.push) panel.push(href);
        else panel.navigate(href);
      }}
    />
  );
}, Expo.Link);
