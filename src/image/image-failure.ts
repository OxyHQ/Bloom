import { Platform } from 'react-native';

/**
 * Whether asking for a failed image again could succeed.
 *
 * - `transient`: the server was overloaded or unreachable (429, 5xx, a timeout,
 *   no connection). The same request can succeed a moment later.
 * - `permanent`: the server answered that the image is not there or not yours
 *   (404, 410, 403, ...). Asking again only repeats the answer.
 * - `unknown`: the renderer did not say. A browser hides an `<img>`'s status, so
 *   every web failure arrives as this; a decode error on a device does too.
 */
export type ImageFailureKind = 'transient' | 'permanent' | 'unknown';

/** 408, 425, 429 and every 5xx: the server's state, not the request, failed it. */
export function isTransientHttpStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

/**
 * The status in a renderer's message: SDWebImage (iOS) writes "invalid response
 * status code 404", Glide (Android) "Failed to connect or obtain data, status
 * code: 404". Read before the network words below, because Glide's HTTP message
 * also says "Failed to connect".
 */
const STATUS_IN_MESSAGE = /status code:?\s*(\d{3})\b/i;

/**
 * A request that never got an answer: NSURLError's "timed out", "appears to be
 * offline", "network connection was lost", "could not connect to the server",
 * "hostname could not be found"; Java's "timeout", "Unable to resolve host",
 * "Failed to connect".
 */
const NETWORK_FAILURE =
  /timed? ?out|offline|network|connection|could not connect|hostname could not be found|unable to resolve host|failed to connect/i;

/** Classify the `{ error }` message a {@link BloomImage} reported. */
export function classifyImageFailure(error: unknown): ImageFailureKind {
  const message = typeof error === 'string' ? error : '';
  const status = STATUS_IN_MESSAGE.exec(message)?.[1];
  if (status) return isTransientHttpStatus(Number(status)) ? 'transient' : 'permanent';
  return NETWORK_FAILURE.test(message) ? 'transient' : 'unknown';
}

/**
 * Whether {@link probeImageFailure} can learn what an `unknown` failure was: on
 * web, for an http(s) URL. A device's renderers report the status themselves.
 */
export function canProbeImageFailure(uri: string | undefined): uri is string {
  return (
    Platform.OS === 'web' &&
    typeof fetch === 'function' &&
    typeof uri === 'string' &&
    /^https?:\/\//i.test(uri)
  );
}

/**
 * Ask the server the status the browser hid from the `<img>`: one `HEAD`. A
 * host that does not allow a cross-origin read, or no answer at all, stays
 * `unknown` — never guessed transient, so a missing image is never re-requested.
 */
export async function probeImageFailure(
  uri: string,
  signal: AbortSignal,
): Promise<ImageFailureKind> {
  try {
    const response = await fetch(uri, { method: 'HEAD', cache: 'no-store', signal });
    // It answers now, so the failure was the moment's, not the image's.
    if (response.ok) return 'transient';
    return isTransientHttpStatus(response.status) ? 'transient' : 'permanent';
  } catch {
    return 'unknown';
  }
}
