/**
 * How long `flyTo` will wait for `<MediaFlightLayer>` to commit the surface
 * before letting the caller carry on regardless (ms).
 *
 * The wait is a COMMIT, not a network round-trip: the surface only has to be
 * mounted, because that is what puts it in expo-video's `_mountedVideos` set
 * while the origin is still there — which is the whole mechanism that carries
 * `currentTime` across. One React commit is a frame or two. Painting is a
 * separate, slower thing that the poster covers (see `MediaSurface`), so it is
 * deliberately NOT waited on here: blocking a tap on a decode would trade a
 * problem nobody can see for one everybody can feel.
 *
 * The timeout exists for the case where no layer is mounted at all. Without it
 * the promise never settles and the consumer never navigates — an app that
 * forgot one line at its root would appear to have a dead feed.
 */
export const SURFACE_MOUNT_TIMEOUT_MS = 250;

/*
 * There is deliberately NO hand-off timeout.
 *
 * The obvious one — release the flying surface after N seconds if no destination
 * ever claims it — would have to be wrong in one direction or the other, because
 * the layer cannot tell "the destination failed" from "the caller meant the
 * layer to keep painting this". And the failure it would guard against is not
 * actually bad: a destination that never loads leaves the flying surface
 * showing the video, playing, at exactly the rect the destination wanted, over a
 * destination showing its poster. Going back calls `flyBack`, which releases it.
 *
 * `flyBack(id)` and `releaseFlight(id)` are the escape hatches, and they are
 * the caller's to use.
 */

/**
 * How many CONSECUTIVE renders a video slot may arrive new on before Bloom says
 * so.
 *
 * `renderVideo` is compared by identity — and on web it is part of what a host
 * publishes to the layer — so an unmemoised slot re-renders the surface on
 * every render of the row it lives in, silently and only under load.
 *
 * Consecutive, never a lifetime total. A correctly memoised slot changes
 * identity whenever the state it reads changes (`isWatched` on a reel slide,
 * say), so ANY fixed lifetime total is reached eventually by a consumer with
 * nothing to fix — and the warning's own advice, `useCallback` over the props
 * the slot reads, is what such a consumer already wrote. Five in a row is
 * unreachable that way: it takes five commits where nothing the slot reads
 * changed and the slot was rebuilt anyway.
 */
export const SLOT_IDENTITY_CHURN_LIMIT = 5;

/**
 * How long a run of {@link SLOT_IDENTITY_CHURN_LIMIT} new slots may take and
 * still be reported (ms).
 *
 * "Consecutive" alone is not enough for the consumer who memoised the surface's
 * other props as well: `memo` then skips every render where only the parent
 * changed, so the surface commits ONLY when the slot changes and the run never
 * breaks — with nothing to fix and, because the renders were skipped, no cost
 * paid either.
 *
 * Rate is what separates them, and it is what the warning was always about. A
 * slot rebuilt per render changes as fast as its row renders, which in a
 * scrolling feed is five times in a fraction of a frame budget. A slot rebuilt
 * when the state it reads changes moves at the speed of a finger, and half a
 * second is far too short for five activations of ONE surface.
 */
export const SLOT_IDENTITY_CHURN_WINDOW_MS = 500;

/**
 * How far a media element may sit from the box it is supposed to fill, in px,
 * before Bloom says so.
 *
 * Two, not zero: subpixel layout and a box mid-animation both land within a
 * pixel, and the defect this catches is not subtle — a `<video>` that never
 * received Bloom's sizing style paints at its intrinsic 300x150 inside whatever
 * box it was given.
 */
export const SLOT_FILL_TOLERANCE_PX = 2;
