/**
 * The consumer-facing handle on the flight layer.
 *
 * Every member is a module-level function over a `globalThis`-anchored registry,
 * so the object is a frozen constant rather than something rebuilt per render:
 * a caller may hold it in a dependency array, a callback ref or a gesture
 * closure without any of them going stale, and there is no provider to mount.
 */
import {
  flightProgress,
  flyBack,
  flyTo,
  handOffFlight,
  measureAnchor,
  registerAnchor,
} from './store';
import type { MediaFlightController } from './types';

/**
 * `flyTo` / `flyBack` / `registerAnchor` / `measureAnchor`, plus the shared
 * `progress` value of the most recent leg.
 *
 * `progress` is resolved through a getter rather than captured at module load,
 * because `resetMediaFlight()` (the test seam) replaces the registry — a
 * captured value would keep pointing at the discarded one and every assertion
 * about progress would read a box nothing writes.
 */
const controller: MediaFlightController = Object.freeze({
  registerAnchor,
  measureAnchor,
  flyTo,
  flyBack,
  handOff: handOffFlight,
  get progress() {
    return flightProgress();
  },
});

/** The media-flight controller. Stable for the life of the bundle. */
export function useMediaFlight(): MediaFlightController {
  return controller;
}
