import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Props as IconProps } from '../icons/shared';
import type { SocialProvider } from '../social-button/providers';

/**
 * Any brand the design system already draws — the 24 `SocialButton` marks,
 * real artwork (Simple Icons / Bootstrap Icons paths).
 */
export type WebSearchBrand = SocialProvider;

export interface WebSearchSource {
  title: string;
  /** Shown on the right, e.g. `www.pcgamer.com`. Hidden below 640px wide (web). */
  domain: string;
  /**
   * Opens the source. On web the row renders a real `<a target="_blank">`; on
   * native it calls `Linking.openURL`. Rows without one are not pressable.
   */
  href?: string;
  /** Draws that site's real mark in its own colour. */
  brand?: WebSearchBrand;
  /**
   * The site's favicon, for a site with no brand mark: an image URL drawn 12×12
   * in the mark. A brand mark wins over it; an image that fails to load falls
   * back to the dot, so a missing icon never leaves a broken one.
   */
  faviconUrl?: string;
  /**
   * A glyph for anything outside the brand marks — a docs site, a customer's own
   * product. Supplied ready-made and sized by the caller (the slot is 12×12).
   * Takes precedence over `brand`.
   */
  icon?: ReactNode;
}

export interface WebSearchStep {
  /** The line, e.g. `Searched X for` or `Ran 3 searches`. Plain text: it is also the shimmer's label. */
  label: string;
  /** Query fragment set in mono after the label, as the agent sent it. */
  query?: string;
  /** Leading glyph: a real site mark. */
  brand?: WebSearchBrand;
  /** Leading glyph: any Bloom icon (drawn 16px, icon-secondary). Ignored when `brand` is set. */
  icon?: ComponentType<IconProps>;
  /** Right-aligned tally, e.g. `7 posts` or `5 results`. */
  meta?: string;
  /**
   * Milliseconds this step holds before the next one arrives, for work that
   * plainly took longer than a tick. Falls back to `stepInterval`. A step
   * shimmers for as long as it is the newest, so a longer dwell is what makes a
   * search read as a search rather than as a list being printed.
   */
  dwell?: number;
  /** What the step turned up. Branches into a Sources row beneath it. */
  sources?: ReadonlyArray<WebSearchSource>;
  /**
   * Marks this step as the head of the trail. Only the first step can be one.
   * It takes no branch of its own and everything after it nests beneath, so the
   * guide descends from its glyph and the opening line reads as the title the
   * search hangs off. A heading does not carry `sources`.
   */
  heading?: boolean;
}

/** The fixed strings, overridable for localisation. */
export interface WebSearchLabels {
  /** The collapsible sources row. Default `'Sources'`. */
  sources?: string;
}

export interface WebSearchProps {
  steps: ReadonlyArray<WebSearchStep>;
  /** Pauses and resumes. Change the element `key` to replay from the top. Default `true`. */
  run?: boolean;
  /** Milliseconds between reveals. Default 850. */
  stepInterval?: number;
  /** Milliseconds before the first reveal. Default 320. */
  startDelay?: number;
  /**
   * Drive the reveal from real events; disables the internal timer. Counts
   * UNITS: every step is one, and a (non-heading) step with sources is two — the
   * sources land as their own unit.
   */
  revealed?: number;
  /**
   * The indicator at the tail of the trail while the search is still running,
   * so the log always ends on the thing being worked on. Pass a label to change
   * it, or `false` to drop it. Default `'Working'`.
   */
  working?: string | false;
  /** Fires once, after the last step lands. */
  onComplete?: () => void;
  /** Skip every reveal and flight. Defaults to the system reduced-motion setting. */
  reduce?: boolean;
  labels?: WebSearchLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
