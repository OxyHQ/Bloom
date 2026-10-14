/** One axis of a scroll container: the visible length, the whole length, and where it is scrolled to. */
export interface ScrollAxis {
  viewport: number;
  content: number;
  offset: number;
}

/** The thumb never shrinks below this, so a very long document still has something to grab. */
export const MIN_THUMB = 24;

export interface Thumb {
  /** There is something to scroll: the content is longer than the viewport. */
  scrollable: boolean;
  /** The thumb's length along the track. */
  size: number;
  /** The thumb's distance from the track's start. */
  position: number;
}

/**
 * Where the thumb sits on a track of length `track` for this axis: its length is the share of the
 * content that is visible, and its position the share that is above the viewport, both on the
 * track. The thumb at rest at either end touches that end exactly, and an offset beyond the
 * content (rubber-banding, a collapsed container) is clamped rather than drawn off the track.
 */
export function thumbOf({ viewport, content, offset }: ScrollAxis, track: number): Thumb {
  const range = content - viewport;
  if (range <= 0 || viewport <= 0 || track <= 0) return { scrollable: false, size: 0, position: 0 };
  const size = Math.min(track, Math.max(MIN_THUMB, (viewport / content) * track));
  const share = Math.min(1, Math.max(0, offset / range));
  return { scrollable: true, size, position: share * (track - size) };
}

/**
 * The scroll offset a thumb dragged to `position` stands for: the inverse of {@link thumbOf}, so
 * dragging the thumb to the end of the track scrolls to the end of the content.
 */
export function offsetOfThumb(
  position: number,
  { viewport, content }: Pick<ScrollAxis, 'viewport' | 'content'>,
  track: number,
  thumbSize: number,
): number {
  const free = track - thumbSize;
  const range = content - viewport;
  if (free <= 0 || range <= 0) return 0;
  return (Math.min(free, Math.max(0, position)) / free) * range;
}
