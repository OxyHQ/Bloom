export interface AnimatedCheckRef {
  /** Replays the draw-on animation from the start. */
  play: () => void;
}

export interface AnimatedCheckProps {
  /** Width and height in px. Defaults to `24`. */
  size?: number;
  /** Stroke color of the ring and check. Defaults to the theme success color. */
  color?: string;
}
