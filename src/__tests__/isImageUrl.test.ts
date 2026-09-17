import { isImageUrl } from '../image-resolver/is-image-url';

/**
 * `isImageUrl` routes an image `source`: `true` renders the string as a URI,
 * `false` hands it to the app's `ImageResolver`. Eleven families had their own
 * copy; this pins the one that survived.
 */
describe('isImageUrl', () => {
  it.each([
    'http://cdn.example/a.jpg',
    'https://cdn.example/a.jpg',
    'data:image/png;base64,iVBORw0KGgo=',
    'blob:https://app.example/9b1d',
    'file:///var/tmp/a.jpg',
  ])('accepts the scheme in %s', (value) => {
    expect(isImageUrl(value)).toBe(true);
  });

  it.each([
    'abc123',
    'file_68f0a1c2',
    'cover',
    '',
    'cdn.example/a.jpg',
    'C:\\images\\a.jpg',
  ])('treats %p as a resolver id', (value) => {
    expect(isImageUrl(value)).toBe(false);
  });

  /**
   * The one divergence between the eleven copies: `listing-card` accepted a
   * leading slash, the other ten did not. A path is a URL — a resolver can only
   * answer `undefined` for one, so the ten used to render nothing.
   */
  it.each(['/img/cover.jpg', '/', '//cdn.example/a.jpg'])(
    'accepts the root-relative path %p',
    (value) => {
      expect(isImageUrl(value)).toBe(true);
    },
  );
});
