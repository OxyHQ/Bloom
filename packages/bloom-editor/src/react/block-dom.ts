import type { BlockId } from '../model/document';

/** The DOM id prefix of a block's row on web; drag and drop finds blocks by it. */
export const BLOCK_DOM_PREFIX = 'bloom-block-';

export function blockDomId(id: BlockId): string {
  return `${BLOCK_DOM_PREFIX}${id}`;
}
