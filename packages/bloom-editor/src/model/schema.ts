import { type BlockId, type EditorDocument, getBlock, positionOf } from './document';

/**
 * What each block type does under the editor's commands. The schema is data,
 * so an application adds its own block types without touching the commands.
 */
export interface BlockSpec {
  type: string;
  /** Carries inline text edited with a rich text input. */
  hasText: boolean;
  /** Return inserts a line break instead of splitting (code). */
  multiline?: boolean;
  /** May hold child blocks (indentation, toggles, containers). */
  canHaveChildren: boolean;
  /**
   * May hold children while this prop is true, though `canHaveChildren` is
   * false: a heading made a toggle (`toggleable`). See `acceptsChildren`.
   */
  childrenWhen?: string;
  /**
   * Children are laid out by the block itself (columns, tables) rather than
   * indented under it; nothing indents into or out of such a block.
   */
  isContainer?: boolean;
  /** The only types its children may be: a table's rows, a row's cells. */
  childTypes?: readonly string[];
  /**
   * A part of its parent's layout (a row, a cell, a column): it lives only in
   * a block of one of these types, never at the top or elsewhere, and is not
   * dragged or handled on its own.
   */
  parentTypes?: readonly string[];
  /**
   * The type of the block Return creates after this one when the caret is at
   * the end. Lists continue themselves; headings and quotes give a paragraph.
   * Defaults to `'paragraph'`.
   */
  continueAs?: string;
  /** Return in an empty block of this type leaves it (outdent, then paragraph). */
  exitOnEmptyReturn?: boolean;
  /** Backspace at the very start turns the block into a paragraph first. */
  revertOnBackspace?: boolean;
  /** Props a new block of this type starts with. */
  defaultProps?: Readonly<Record<string, unknown>>;
  /**
   * The props this type keeps, when the application's storage accepts only
   * those. Commands drop any other prop (turning a to-do into a paragraph
   * loses `checked`), so the editor never holds what the server would
   * discard. When absent, every prop is kept.
   */
  props?: readonly string[];
  /**
   * Props that do not carry over when Return continues the type (a new to-do
   * starts unchecked).
   */
  resetOnContinue?: readonly string[];
}

export type Schema = Readonly<Record<string, BlockSpec>>;

/** The block types every Bloom editor understands. */
export const DEFAULT_SCHEMA: Schema = defineSchema([
  { type: 'paragraph', hasText: true, canHaveChildren: true },
  {
    type: 'heading_1',
    hasText: true,
    canHaveChildren: false,
    childrenWhen: 'toggleable',
    revertOnBackspace: true,
  },
  {
    type: 'heading_2',
    hasText: true,
    canHaveChildren: false,
    childrenWhen: 'toggleable',
    revertOnBackspace: true,
  },
  {
    type: 'heading_3',
    hasText: true,
    canHaveChildren: false,
    childrenWhen: 'toggleable',
    revertOnBackspace: true,
  },
  {
    type: 'bulleted_list_item',
    hasText: true,
    canHaveChildren: true,
    continueAs: 'bulleted_list_item',
    exitOnEmptyReturn: true,
    revertOnBackspace: true,
  },
  {
    type: 'numbered_list_item',
    hasText: true,
    canHaveChildren: true,
    continueAs: 'numbered_list_item',
    exitOnEmptyReturn: true,
    revertOnBackspace: true,
  },
  {
    type: 'todo',
    hasText: true,
    canHaveChildren: true,
    continueAs: 'todo',
    exitOnEmptyReturn: true,
    revertOnBackspace: true,
    defaultProps: { checked: false },
    resetOnContinue: ['checked'],
  },
  {
    type: 'toggle',
    hasText: true,
    canHaveChildren: true,
    continueAs: 'toggle',
    exitOnEmptyReturn: true,
    revertOnBackspace: true,
    defaultProps: { expanded: true },
  },
  {
    type: 'quote',
    hasText: true,
    canHaveChildren: true,
    exitOnEmptyReturn: true,
    revertOnBackspace: true,
  },
  { type: 'callout', hasText: true, canHaveChildren: true, revertOnBackspace: true },
  {
    type: 'code',
    hasText: true,
    canHaveChildren: false,
    multiline: true,
    defaultProps: { language: 'plain' },
  },
  { type: 'divider', hasText: false, canHaveChildren: false },
]);

export function defineSchema(specs: readonly BlockSpec[]): Schema {
  const out: Record<string, BlockSpec> = {};
  for (const spec of specs) out[spec.type] = spec;
  return out;
}

/** A schema with `specs` added or replacing types of the same name. */
export function extendSchema(base: Schema, specs: readonly BlockSpec[]): Schema {
  return { ...base, ...defineSchema(specs) };
}

/**
 * A block's props under `spec`: the type's defaults under `props`, without
 * the props the type does not keep.
 */
export function propsFor(
  spec: BlockSpec,
  props: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...spec.defaultProps, ...props };
  if (!spec.props) return merged;
  const kept: Record<string, unknown> = {};
  for (const key of spec.props) if (key in merged) kept[key] = merged[key];
  return kept;
}

/** The spec for `type`; unknown types behave as plain, childless, textless blocks. */
export function specOf(schema: Schema, type: string): BlockSpec {
  return schema[type] ?? { type, hasText: false, canHaveChildren: false };
}

/**
 * Whether a block of `type` may sit in `parent` (null: the top of the page),
 * as far as either one's `childTypes` and `parentTypes` say.
 */
export function canHold(schema: Schema, parent: { type: string } | null, type: string): boolean {
  const parents = specOf(schema, type).parentTypes;
  if (parents && (parent === null || !parents.includes(parent.type))) return false;
  const children = parent ? specOf(schema, parent.type).childTypes : undefined;
  return !children || children.includes(type);
}

/** The block `id` sits in; null at the top of the page. */
export function parentOf(doc: EditorDocument, id: BlockId): { type: string } | null {
  const { parent } = getBlock(doc, id);
  return parent === null ? null : getBlock(doc, parent);
}

/**
 * Where blocks of `types` go after `afterId` (null: the end of the page):
 * just after it, or — when its parent cannot hold them (a cell's row, a
 * row's table) — just after the nearest ancestor whose parent can.
 */
export function placeAfter(
  doc: EditorDocument,
  schema: Schema,
  afterId: BlockId | null,
  types: readonly string[],
): { parent: BlockId | null; index: number } {
  let anchor = afterId;
  while (anchor !== null) {
    const parent = parentOf(doc, anchor);
    if (types.every((type) => canHold(schema, parent, type))) {
      const pos = positionOf(doc, anchor);
      return { parent: pos.parent, index: pos.index + 1 };
    }
    anchor = getBlock(doc, anchor).parent;
  }
  return { parent: null, index: doc.root.length };
}

/** Whether blocks of `type` are part of their parent's layout (`parentTypes`). */
export function isStructural(schema: Schema, type: string): boolean {
  return specOf(schema, type).parentTypes !== undefined;
}

/** Whether `block` may hold children now (its type always, or while a prop says so). */
export function acceptsChildren(
  schema: Schema,
  block: { type: string; props: Readonly<Record<string, unknown>> },
): boolean {
  const spec = specOf(schema, block.type);
  if (spec.canHaveChildren) return true;
  return spec.childrenWhen !== undefined && block.props[spec.childrenWhen] === true;
}

/** Whether `block` folds its children away like a toggle (a toggle, a toggle heading). */
export function isToggle(
  schema: Schema,
  block: { type: string; props: Readonly<Record<string, unknown>> },
): boolean {
  if (block.type === 'toggle') return true;
  const spec = specOf(schema, block.type);
  return spec.childrenWhen !== undefined && block.props[spec.childrenWhen] === true;
}
