import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ImageSource, Shape } from '../shapes';

/**
 * - `sm` a 48 icon beside two lines: a dense list, a search result.
 * - `md` a 64 icon beside up to three lines: a shelf of products (the default).
 * - `lg` a 128 icon beside a two-line title, with the action UNDER the text:
 *   the head of a product's own page.
 */
export type LockupSize = 'sm' | 'md' | 'lg';

export interface LockupProps {
  /** The product's name. */
  title: string;
  /** One line under the title: what it is, in a few words. */
  subtitle?: string | null;
  /**
   * A third line, under the subtitle: a `Rating`, a category, "In-app
   * purchases". Strings are drawn in the caption style; a node as given.
   */
  caption?: ReactNode;
  /**
   * The product's icon: a URL, an `ImageResolver` id or an image source, drawn
   * through `Avatar`. Missing or failing, the shape shows the title's initial.
   */
  icon?: string | ImageSource | null;
  /** The `ImageResolver` variant for an id `icon`. Default `thumb`, `full` at `lg`. */
  iconVariant?: string;
  /** The icon's outline. Default `squircle`. */
  iconShape?: Shape;
  /** A chart position, drawn between the icon and the text. */
  rank?: number;
  /**
   * The product's action — usually a small subtle `Button` ("Get", "Open").
   * At the row's end for `sm` / `md`, under the text for `lg`. It is a
   * sibling of the lockup's press target, never inside it, so it is its own
   * control in the tab order and to assistive technology.
   */
  action?: ReactNode;
  /** Default `md`. */
  size?: LockupSize;
  /** Makes the icon and text one link to the product. */
  onPress?: () => void;
  /** Link target; on web the press target is a real anchor. Pass `onPress` too for a router. */
  href?: string;
  /** The link's name. Defaults to the text it contains (title, subtitle, caption). */
  accessibilityLabel?: string;
  /**
   * A hairline under the text column (from the text's start to the row's
   * end). Inside a `paged` or `grid` shelf of more than one row it defaults to
   * every row but the last of its column.
   */
  divider?: boolean;
  /** Where the title truncates. Default `1`, `2` at `lg`. `0` never does. */
  titleNumberOfLines?: number;
  /** `lg`: the title's heading level. Default `1`. Other sizes are not headings. */
  headingLevel?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface LockupSkeletonProps {
  /** Default `md`. */
  size?: LockupSize;
  /** Draws the third line. Default `false`. */
  caption?: boolean;
  /** Draws the action's pill. Default `true`. */
  action?: boolean;
  /** As on `Lockup`; defaults the same way inside a `paged` or `grid` shelf. */
  divider?: boolean;
  /** The placeholder's name. Default "Loading". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
