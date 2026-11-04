import { Linking, Platform, type GestureResponderEvent } from 'react-native';

import { loadWebBrowser } from './web-browser-module';

/** Router callbacks only replace an unmodified primary activation of an anchor. */
export function isPlainLinkActivation(event: GestureResponderEvent): boolean {
  const native = event.nativeEvent as GestureResponderEvent['nativeEvent'] & {
    button?: number;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  };
  return (
    !event.defaultPrevented &&
    (native.button == null || native.button === 0) &&
    !native.metaKey &&
    !native.ctrlKey &&
    !native.shiftKey &&
    !native.altKey
  );
}

/**
 * Follow `href` as an activated link does, for a press with no anchor of its own
 * to follow: on native through `Linking.openURL`, on the web by navigating the
 * document. A URL nothing can open does nothing, as a dead link does; the
 * rejection is not surfaced.
 *
 * A component that renders a real `<a href>` on the web calls this on native
 * only (the anchor already navigates), which is why most callers guard it.
 */
export function openHref(href: string): void {
  if (Platform.OS === 'web') {
    globalThis.location?.assign(href);
    return;
  }
  void Linking.openURL(href).catch(() => undefined);
}

/** The schemes the in-app browser can show; anything else goes to the system. */
const WEB_PAGE = /^https?:/i;

/**
 * Open `href` outside the app — the companion of {@link openHref} for a link
 * that must not replace the app: a new tab on the web, the in-app browser on
 * native (the optional `expo-web-browser` peer), and the system handler
 * (`Linking.openURL`) for what the in-app browser cannot show (`mailto:`,
 * `tel:`) or when the peer is absent. A URL nothing can open does nothing, as a
 * dead link does; the rejection is not surfaced.
 */
export function openExternal(href: string): void {
  if (Platform.OS === 'web') {
    globalThis.open?.(href, '_blank', 'noopener,noreferrer');
    return;
  }
  const browser = WEB_PAGE.test(href) ? loadWebBrowser() : null;
  if (browser) {
    void browser.openBrowserAsync(href).catch(() => openWithSystem(href));
    return;
  }
  openWithSystem(href);
}

function openWithSystem(href: string): void {
  void Linking.openURL(href).catch(() => undefined);
}
