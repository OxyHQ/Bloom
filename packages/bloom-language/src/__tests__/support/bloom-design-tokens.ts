/** Bloom's elevation as its web file draws it: the role's box-shadow, read from Bloom's own table. */
import { SHADOW_BOX, type ShadowRole } from '../../../../../src/design-tokens/shadows';

export { SHADOW_BOX };
/** Bloom's radius names and their values (`radius-16` is 16), read from Bloom's own table. */
export { RADIUS } from '../../../../../src/design-tokens/scales';
export function bloomShadowStyle(role: ShadowRole): { boxShadow: string } {
  return { boxShadow: SHADOW_BOX[role] };
}
