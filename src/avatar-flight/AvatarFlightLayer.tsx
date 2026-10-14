import { AvatarFlightHost } from './AvatarFlightHost';
import { createAvatarFlightLayer } from './create-avatar-flight-layer';

/** Draws the avatars that `useAvatarFlights` has in the air. Render it once, anywhere on the screen. */
export const AvatarFlightLayer = createAvatarFlightLayer(AvatarFlightHost);
