/** A target's side: the box a control takes presses in. */
export const WINDOW_CONTROL_TARGET = 20;
/** A control's disc. */
export const WINDOW_CONTROL_DISC = 14;
/** The symbol inside a disc, shown while the pointer is over the group. */
export const WINDOW_CONTROL_SYMBOL = 10;
/** A pressed control's scale, before it springs back as it acts. */
export const WINDOW_CONTROL_PRESSED_SCALE = 0.88;
/** The plate's margin around the group, over full-bleed content. */
export const WINDOW_CONTROLS_PLATE_PADDING = 6;
/**
 * Two presses on a drag region this close together are a double press, which
 * zooms the window: a desktop's default double-click interval.
 */
export const WINDOW_DOUBLE_PRESS_MS = 500;

/**
 * A Mac's first mouse: react-native-macos's View prop `acceptsFirstMouse`
 * (NSView's `acceptsFirstMouse:`), which says that a press activating an
 * inactive window reaches this view instead of only activating the window. A
 * window's drag regions and its controls take it, as a Mac's title bar and
 * window buttons act on the first click; a button does not, so a click that
 * brings its window forward does not also press it. OxyOS's host honours it
 * (OxyOS ADR 0016, decision 9), react-native-macos does natively, and every
 * other platform drops the prop. Spread it on a view: React Native's own
 * `ViewProps` do not declare it.
 */
export const ACCEPTS_FIRST_MOUSE = { acceptsFirstMouse: true } as object;
