import type { ServerStylePolicy } from '../styles/context';
import type { ReactNode } from 'react';
import type { ScrollRouterAdapter } from '../scroll/types';
import type { ImageResolver } from '../image-resolver';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import type { BloomThemeProviderProps } from '../theme';
import type { VectorAssetLoader } from '../agent-avatar/vector-types';

export interface BloomProviderProps extends Omit<BloomThemeProviderProps, 'children'> {
  children: ReactNode;
  /** Emit compositor CSS in server HTML. Opt in only when the host CSP permits
   * inline styles, or supply the matching style nonce on server and hydration. */
  ssrStyles?: ServerStylePolicy;
  /** Stable router adapter; omitted means automatic restoration is inactive. */
  scrollAdapter?: ScrollRouterAdapter;
  /**
   * The app's route Back, offered by every route screen's `PageHeader` that has
   * no history of its own. Expo apps pass `useBackWithFallback('/')` from
   * `@oxy.so/bloom/panel-routing/expo-router`: back through the router's
   * history, or to the fallback when a deep link left none. Omitted, a header
   * shows Back only when given `onBack` or inside a panel history.
   */
  back?: () => void;
  /**
   * Resolves bare media identifiers (Oxy file ids) to loadable URLs for every
   * Bloom surface that takes a `source` — `<Avatar>`, image galleries, cards.
   * Typically `(id, variant) => oxyServices.getFileDownloadUrl(id, variant)`.
   */
  imageResolver?: ImageResolver;
  /**
   * The host platform's surfaces (`@oxy.so/bloom/platform-surface`). An adapter
   * reporting `popup-surface` turns native menus into anchored panels in the
   * platform's popups (OxyOS compositor popups, which may extend beyond the
   * window); one reporting `window` makes the app's window chrome Bloom's
   * (`@oxy.so/bloom/window`: its controls and their room). Omitted, the
   * adapter of a provider around this one applies (the runtime's, which
   * registers it with `PlatformSurfaceProvider`), and without one every family
   * keeps its default presentation.
   */
  platform?: PlatformSurfaceAdapter;
  /**
   * `false` disables haptic feedback app-wide (honored by every `useHaptics()` call),
   * whatever the viewer's `haptics` preference says. The preference itself is
   * Bloom's (`@oxy.so/bloom/preferences`).
   */
  haptics?: boolean;
  /**
   * BCP 47 locale for every Bloom component below — dates, month names and
   * Bloom's own strings (Cancel, Apply, …). A component's own `locale` prop
   * wins. Unset, components follow the runtime's locale.
   */
  locale?: string;
  /** @deprecated All bot characters use bundled SVG assets; this value is ignored. */
  characterRuntimeUrl?: string;
  /**
   * The bot-character vector assets this app ships (`createVectorAssetLoader` in
   * `@oxy.so/bloom/agent-avatar`). Unset: Bloom's full catalog, linked lazily. With the
   * full catalog dropped from the bundle (docs/agent-avatar.mdx), only the ones given here ship.
   */
  avatarCatalog?: VectorAssetLoader;
}
