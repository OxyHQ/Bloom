import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Props for {@link LinkPreviewCard}.
 *
 * Structural by design — Bloom does NOT depend on `@oxyhq/contracts`. The shape
 * mirrors the subset of the Oxy SDK's `LinkPreview` DTO (`@oxyhq/core`
 * `getLinkPreview` / `getLinkPreviews`) that is needed to render a preview, so a
 * consumer can spread an SDK `LinkPreview` straight onto this component.
 */
export interface LinkPreviewCardProps {
  /** The previewed URL. Opened via `Linking.openURL` when `onPress` is omitted. */
  url: string;
  /** OpenGraph / page title. Falls back to the URL hostname when absent. */
  title?: string;
  /** OpenGraph / meta description. */
  description?: string;
  /**
   * Absolute cover-image URL (e.g. a `cloud.oxy.so` OG image). Rendered directly
   * with the RN `Image` primitive — NOT through `ImageResolver` / `Avatar`, which
   * are for bare Oxy file IDs.
   */
  image?: string;
  /** Site / brand name shown above the title. Falls back to the URL hostname. */
  siteName?: string;
  /** Press handler. When omitted, the card opens `url` via `Linking.openURL`. */
  onPress?: () => void;
  /** Extra NativeWind utilities merged onto the card surface. */
  className?: string;
  /** Extra style merged onto the card surface. */
  style?: StyleProp<ViewStyle>;
}
