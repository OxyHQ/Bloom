/**
 * The block editor's documents in Yjs: a `Y.Doc` layout for block trees, and a
 * binding that keeps an `EditorStore` and a `Y.Doc` the same. Platform-free:
 * a server reads and writes the same documents with it.
 */
export { YjsBinding, type YjsBindingOptions } from './binding';
export { diffDocuments } from './diff';
export { isFractionalKey, keyBetween } from './fractional';
export { BLOCKS_KEY, blocksMap } from './layout';
export { Materializer, materialize } from './materialize';
export {
  type BlockTextSelection,
  type RelativePositionJSON,
  type RelativeSelection,
  relativeToSelection,
  selectionToRelative,
} from './selection';
export { readSegments, updateSegments, writeSegments } from './text';
export { writeDocument, writeTransaction } from './write';
