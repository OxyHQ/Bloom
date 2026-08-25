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
