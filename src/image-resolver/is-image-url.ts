/**
 * `true` when `value` is something an `<Image>` can load as-is; `false` means it
 * is an opaque {@link ImageResolver} id and has to go through the app's
 * resolver.
 *
 * ONE copy for the whole package — eleven families had grown their own, under
 * two names (`isUrl` and `isImageUrl`).
 *
 * A LEADING SLASH counts as a URL: `/img/cover.jpg` is a root-relative path to
 * an asset the app already serves, not an id. (Ten of the eleven copies
 * rejected it and handed it to the resolver, which can only answer `undefined`
 * for a path — so a local asset silently rendered nothing. `listing-card` had
 * already fixed this for itself; its rule is the one that survived.)
 *
 * Deliberately NOT a general URL parser: it decides a route, and every string
 * that is not one of these shapes is an id.
 */
export function isImageUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('file:') ||
    value.startsWith('/')
  );
}
