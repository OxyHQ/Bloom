/**
 * `OverlayInertBoundary` — the app content's half of a modal overlay.
 *
 * A modal Bloom surface renders at the portal outlet, which is the app
 * content's SIBLING. It can mark itself modal (`accessibilityViewIsModal`, which
 * iOS honours by hiding the siblings), but it cannot hide the app on Android:
 * TalkBack only skips a subtree whose OWN root says
 * `importantForAccessibility="no-hide-descendants"`, and that root belongs to
 * the app. Without it, TalkBack walked from the settings modal straight into
 * the Home feed behind it (OxyHQ/Mention#1126).
 *
 * The app wraps its content — everything that is NOT the `PortalOutlet` — in
 * this boundary. While any modal overlay is open (`./modal-registry.ts`) it
 * takes that content out of the accessibility tree:
 *
 *   - Android: `importantForAccessibility="no-hide-descendants"`.
 *   - iOS: `accessibilityElementsHidden`, alongside the surface's own
 *     `accessibilityViewIsModal` (either alone is enough; both costs nothing).
 *   - Web: `inert`, which removes the subtree from the tab order AND the
 *     accessibility tree, plus `aria-hidden` for engines that lag on `inert`.
 *     The web portal root is a child of `document.body`, never of the app
 *     root, so the surface itself is untouched. Web dialogs set no focus trap
 *     of their own, so nothing is applied twice.
 *
 * Layout: on web the boundary is `display: contents`, so it generates no box
 * and a document-scrolling page lays out exactly as without it. On native it is
 * a `flex: 1` view — the content it wraps already fills the root there — and it
 * is never collapsed, because flattening a layout-only view would drop the
 * accessibility prop the moment it is needed.
 */
import { Platform, StyleSheet, View } from 'react-native';

import type { OverlayInertBoundaryProps } from './types';
import { useModalOverlayActive } from './use-modal-overlay-active';

export function OverlayInertBoundary({ children, style, testID }: OverlayInertBoundaryProps) {
  const active = useModalOverlayActive();

  if (Platform.OS === 'web') {
    return (
      <View
        testID={testID}
        style={[styles.web, style]}
        aria-hidden={active ? true : undefined}
        {...(active ? { inert: true } : null)}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      collapsable={false}
      style={[styles.native, style]}
      importantForAccessibility={active ? 'no-hide-descendants' : 'auto'}
      accessibilityElementsHidden={active}
    >
      {children}
    </View>
  );
}

OverlayInertBoundary.displayName = 'OverlayInertBoundary';

const styles = StyleSheet.create({
  native: { flex: 1 },
  // No box of its own on web: the wrapped content lays out against the
  // boundary's parent, flex tree or document scroll alike.
  web: { display: 'contents' },
});
