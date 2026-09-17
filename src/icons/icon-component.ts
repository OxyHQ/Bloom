import type { ComponentType } from 'react';

/**
 * An icon COMPONENT a caller hands to a Bloom component — `RiHeart3Line`, or
 * anything else that draws at a size and a colour.
 *
 * ```tsx
 * <ListingFact icon={RiBedLine} label="2 beds" />
 * ```
 *
 * The three props are the ones every Bloom component sets on an icon it is
 * given; a component that accepts more (an `IconStyle`, a stroke width) takes
 * `Props` from `icons/shared` instead. All three are optional, which makes this
 * structurally the WIDEST icon a component can be handed — a component with
 * stricter props is not assignable, and that is on purpose.
 *
 * Twenty-six identical aliases of this type existed, one per family
 * (`SidebarIcon`, `TrackIconComponent`, `PlayerGlyph`, …). The public ones
 * survive as deprecated re-exports; the private ones are gone.
 */
export type BloomIconComponent = ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
}>;
