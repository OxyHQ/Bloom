import type { ReactNode } from 'react';
import type { BloomImageSource } from '@oxy.so/bloom/image';

import {
  Node,
  type ActionBarView,
  type ActionGroupView,
  type ActionOptions,
  type ActionView,
  type AvatarOptions,
  type AvatarView,
  type ButtonView,
  type Child,
  type EmbedView,
  type IconComponent,
  type IconView,
  type ImageView,
  type LottieView,
  type SpacerView,
  type StackView,
  type TextRun,
  type TextView,
} from './node';

const NO_CHILDREN: readonly Child[] = [];
const HORIZONTAL = { axis: 'horizontal' } as const;
const VERTICAL = { axis: 'vertical' } as const;
const DEPTH = { axis: 'depth' } as const;

/** Children side by side, in reading order. */
export function HStack(...children: Child[]): StackView {
  return new Node('stack', HORIZONTAL, children);
}

/** Children top to bottom. */
export function VStack(...children: Child[]): StackView {
  return new Node('stack', VERTICAL, children);
}

/** Children over one another: the first sets the size, the rest cover it, later ones on top. */
export function ZStack(...children: Child[]): StackView {
  return new Node('stack', DEPTH, children);
}

/** Takes the free space along its stack's axis. */
export function Spacer(): SpacerView {
  return new Node('spacer', null, NO_CHILDREN);
}

/** Text. Runs are joined in order; a nested `Text` is an inline span with its own modifiers. */
export function Text(...runs: TextRun[]): TextView {
  return new Node('text', { runs }, NO_CHILDREN);
}

/** A Bloom icon component (`RiHeartLine`, `ReplyIcon`…), drawn at a size token in the current foreground. */
export function Icon(icon: IconComponent): IconView {
  return new Node('icon', { icon }, NO_CHILDREN);
}

/** Bloom `Avatar`. `source` is a URL or a file id the app's `ImageResolver` resolves. */
export function Avatar(source: string | null | undefined, options: AvatarOptions = {}): AvatarView {
  return new Node('avatar', { source, options }, NO_CHILDREN);
}

/**
 * A raster image, drawn by Bloom's `BloomImage`. `source` is a URL, a bundled
 * asset (`require()`) or a URI descriptor; `alt` names it for assistive technology.
 */
export function Image(source: BloomImageSource | null | undefined, alt?: string): ImageView {
  return new Node('image', { source, alt }, NO_CHILDREN);
}

/** Bloom `Button`. An `Icon` child is its glyph; `Text` children are its label. */
export function Button(...children: Child[]): ButtonView {
  return new Node('button', null, children);
}

/** Bloom `EngagementAction`: one glyph (and count) in an action bar. `label` names it for assistive technology. */
export function Action(
  icon: IconComponent,
  label: string,
  options: ActionOptions = {},
): ActionView {
  return new Node('action', { icon, label, options }, NO_CHILDREN);
}

/** Bloom `EngagementBar`: leading actions in reading order; `.trailing(...)` pushes the rest to the far edge. */
export function ActionBar(...children: Child[]): ActionBarView {
  return new Node('actionBar', null, children);
}

/** Bloom `EngagementGroup`: adjacent actions that read as one control. */
export function ActionGroup(...children: Child[]): ActionGroupView {
  return new Node('actionGroup', null, children);
}

/**
 * A React element inside a tree: a third-party component, or a Bloom/app
 * component the language has no node for yet. Pass a function to receive a
 * `render` that draws language nodes in the current environment, for an
 * element that takes them as children or props.
 */
export function Embed(
  content: ReactNode | ((render: (child: Child) => ReactNode) => ReactNode),
): EmbedView {
  return new Node('embed', { content }, NO_CHILDREN);
}

/**
 * A Lottie animation (a URL), drawn by Bloom's `Sticker`: the one Lottie path,
 * paused while its screen is not in front. `.fallback(Image(still, label))` is
 * the still it shows while loading, where it cannot play, and under reduced
 * motion; `.frame({ width })` its square edge.
 */
export function Lottie(source: string): LottieView {
  return new Node('lottie', { source }, NO_CHILDREN);
}
