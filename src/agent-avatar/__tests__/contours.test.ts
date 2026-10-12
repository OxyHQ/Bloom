import { createHash } from 'node:crypto';
import { avatarContours } from '../avatar-contours';
import { DEFAULT_CONFIG, type AvatarConfig } from '../model';
import golden from './contour-golden.json';

/** SHA baselines captured before removing the paint renderer. These preserve
 * all source points and their ordering, not just approximate bounds. */
it.each(golden)('preserves saved silhouette $patch', ({ patch, sha256 }) => {
  const config = { ...DEFAULT_CONFIG, ...patch } as AvatarConfig;
  const before = JSON.stringify(config);
  expect(
    createHash('sha256')
      .update(JSON.stringify(avatarContours(config)))
      .digest('hex'),
  ).toBe(sha256);
  expect(JSON.stringify(config)).toBe(before);
});
