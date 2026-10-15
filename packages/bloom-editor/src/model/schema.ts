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
   * Children are laid out by the block itself (columns, tables) rather than
   * indented under it; nothing indents into or out of such a block.
   */
  isContainer?: boolean;
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
  { type: 'heading_1', hasText: true, canHaveChildren: false, revertOnBackspace: true },
  { type: 'heading_2', hasText: true, canHaveChildren: false, revertOnBackspace: true },
  { type: 'heading_3', hasText: true, canHaveChildren: false, revertOnBackspace: true },
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
