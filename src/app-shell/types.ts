import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { NotificationCenterItem, NotificationCenterTab } from '../notification-center/types';
import type { SidebarProps } from '../sidebar/types';

/**
 * How the sidebar reaches a narrow screen (below `lg`):
 *
 * - `overlay`  a drawer over the page with a 40% black backdrop
 * - `reveal`   the sidebar waits beneath the page, which slides 272px right and
 *              rounds its corner to 32 as the rail scales in from 0.94
 */
export type AppShellDrawer = 'overlay' | 'reveal';

export interface AppShellProps {
  /**
   * The rail. Rendered in flow at `lg` and up (`sm` and up with
   * `variant: 'rail'`); below it, the same props drive the drawer (`mobile`,
   * and `flat` for `reveal`), always as the panel.
   */
  sidebar?: Omit<SidebarProps, 'mobile' | 'onClose' | 'flat'>;
  drawer?: AppShellDrawer;
  /**
   * Heading over the content. Optional: without it (and without `breadcrumb` /
   * `actions`) the header still renders the menu button while the sidebar is a
   * drawer, and nothing otherwise. A page with its own `header` opens the
   * drawer with `AppShellMenuButton` or `useAppShell()`.
   */
  title?: string;
  /** Breadcrumb trail above the heading (a `Breadcrumb`). */
  breadcrumb?: ReactNode;
  /** Header actions on the right (`NotificationBell`, buttons). */
  actions?: ReactNode;
  /**
   * Replaces the whole header. Put an `AppShellMenuButton` in it to keep the
   * drawer reachable on narrow screens.
   */
  header?: ReactNode;
  /**
   * A second column on the right of the page (a detail panel, activity, a
   * chat). In flow from `asideFrom`; below it, stacked under the content or
   * hidden (`asideCollapse`). Pinned like the sidebar — with document scroll
   * it is sticky and scrolls its own overflow.
   */
  aside?: ReactNode;
  /** The aside column's width. Defaults to 320. */
  asideWidth?: number;
  /** The breakpoint the aside sits beside the content from. Defaults to `xl` (1280). */
  asideFrom?: 'md' | 'lg' | 'xl';
  /** Below `asideFrom`: `stack` (default) renders it after the content, `hidden` drops it. */
  asideCollapse?: 'stack' | 'hidden';
  children?: ReactNode;
  /** The content column's max width. Defaults to 1300. */
  contentMaxWidth?: number;
  /** Floating extras rendered last, e.g. a `ProOfferCard`. */
  overlay?: ReactNode;
  /** Controlled drawer state (below `lg`). */
  drawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
  /**
   * What scrolls the page.
   *
   * - `document` (default) — WEB: the page grows the document and the browser
   *   scrolls it, like a `ContentPanel` page: scroll restoration, the mobile
   *   address bar collapsing, anchor links and `window.scrollTo` all work, and
   *   the in-flow sidebar stays pinned (`position: sticky`). Native has no
   *   document and treats it as `container`.
   * - `container` — the shell fills its parent and the page scrolls inside its
   *   own `ScrollView`. For a shell embedded in a bounded box.
   * - `fixed` — the shell is exactly one screen tall and NOTHING scrolls: the
   *   header stays, and the content fills the rest of the height (`flex: 1`),
   *   so the page owns its own scrolling — a chat, a map, a board. On web the
   *   frame is `100dvh`; on native it fills its parent.
   */
  scroll?: 'document' | 'container' | 'fixed';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AppShellMenuButtonProps {
  /** Defaults to `"Open navigation"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AppShellHeaderProps {
  /** Optional: a header can be just the menu button, breadcrumb or actions. */
  title?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  /** Shows the hamburger (below `lg`); omit for no menu button. */
  onMenuPress?: () => void;
  /** Swaps the hamburger for a close glyph while the drawer is open. */
  menuOpen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface NotificationBellProps {
  notifications?: NotificationCenterItem[];
  /** Overrides the count on the glyph; defaults to the unread items. */
  unreadCount?: number;
  onAction?: (notificationId: string, actionId: string) => void;
  onMarkAllRead?: () => void;
  defaultTab?: NotificationCenterTab;
  /** Popover width. Default 440. */
  width?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export interface ProOfferCardProps {
  title: ReactNode;
  description: ReactNode;
  /** The call to action's label. */
  ctaLabel: string;
  onCtaPress?: () => void;
  /** Called by the close control; persisting the dismissal is the host's call. */
  onDismiss: () => void;
  /** The mark above the copy (an animated Pro logo). */
  logo?: ReactNode;
  /** Light across the top, masked out before it reaches the copy. */
  backdrop?: ReactNode;
  backdropHeight?: number;
  accessibilityLabel?: string;
  dismissLabel?: string;
  /**
   * `fixed` (default) anchors bottom-left of the viewport (web) / the nearest
   * positioned parent (native); `inline` renders in flow.
   */
  placement?: 'fixed' | 'inline';
  /** Delay before the card rises in, ms. Defaults to 1200. */
  enterDelay?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
