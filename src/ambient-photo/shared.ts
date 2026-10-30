/** Default cross-fade between two photos, in ms. */
export const DEFAULT_FADE_MS = 2500;
/** Default drift of a resting photo, in ms. */
export const DEFAULT_DRIFT_MS = 42000;
/**
 * Default drift scale. Measured on a Chromecast: a zoom past the screen's own
 * pixels costs rasterization for the whole drift, and 1.04 reads the same as
 * more.
 */
export const DEFAULT_DRIFT_SCALE = 1.04;
/**
 * Slack after a cross-fade before the photo that left lets go of its image, so
 * a late frame of the fade never paints an empty layer.
 */
export const RELEASE_SLACK_MS = 100;
