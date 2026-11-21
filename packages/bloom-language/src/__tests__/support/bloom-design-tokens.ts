/** Bloom's elevation as its web file draws it: the role's box-shadow, read from Bloom's own table. */
import { SHADOW_BOX, type ShadowRole } from '../../../../../src/design-tokens/shadows';

export { SHADOW_BOX };
export function bloomShadowStyle(role: ShadowRole): { boxShadow: string } {
  return { boxShadow: SHADOW_BOX[role] };
}
