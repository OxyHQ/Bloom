/** Every string the editor draws itself. Apps pass their translations. */
export interface EditorLabels {
  placeholder: string;
  emptyHeading: string;
  emptyListItem: string;
  emptyToggle: string;
  slashNoResults: string;
  mentionNoResults: string;
  mentionSearching: string;
  slashGroups: Readonly<Record<string, string>>;
  turnInto: string;
  duplicate: string;
  delete: string;
  moveUp: string;
  moveDown: string;
  indent: string;
  outdent: string;
  color: string;
  background: string;
  /** The format bar's button for text colour and highlight. */
  textColor: string;
  /** The block menu's action that copies a link to the block (`onCopyBlockLink`). */
  copyBlockLink: string;
  /** A code block's language button and menu. */
  codeLanguage: string;
  /** The search field of the code language menu. */
  codeLanguageSearch: string;
  colorNames: Readonly<Record<string, string>>;
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  code: string;
  link: string;
  linkPlaceholder: string;
  removeLink: string;
  apply: string;
  cancel: string;
  open: string;
  mention: string;
  undo: string;
  redo: string;
  formatting: string;
  blockMenu: string;
  dragHandle: string;
  addBelow: string;
  toggleOpen: string;
  toggleClosed: string;
  checkbox: string;
}

export const DEFAULT_LABELS: EditorLabels = {
  placeholder: "Type '/' for commands",
  emptyHeading: 'Heading',
  emptyListItem: 'List',
  emptyToggle: 'Toggle',
  slashNoResults: 'No results',
  mentionNoResults: 'No matches',
  mentionSearching: 'Searching…',
  slashGroups: {
    basic: 'Basic blocks',
    media: 'Media',
    advanced: 'Advanced',
    embeds: 'Embeds',
    database: 'Database',
  },
  turnInto: 'Turn into',
  duplicate: 'Duplicate',
  delete: 'Delete',
  moveUp: 'Move up',
  moveDown: 'Move down',
  indent: 'Indent',
  outdent: 'Outdent',
  color: 'Color',
  background: 'Background',
  textColor: 'Text color',
  copyBlockLink: 'Copy link to block',
  codeLanguage: 'Language',
  codeLanguageSearch: 'Search languages',
  colorNames: {
    default: 'Default',
    gray: 'Gray',
    brown: 'Brown',
    orange: 'Orange',
    yellow: 'Yellow',
    green: 'Green',
    blue: 'Blue',
    purple: 'Purple',
    pink: 'Pink',
    red: 'Red',
  },
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strike: 'Strikethrough',
  code: 'Code',
  link: 'Link',
  linkPlaceholder: 'Paste a link',
  removeLink: 'Remove link',
  apply: 'Apply',
  cancel: 'Cancel',
  open: 'Open',
  mention: 'Mention',
  undo: 'Undo',
  redo: 'Redo',
  formatting: 'Formatting',
  blockMenu: 'Block options',
  dragHandle: 'Drag to move',
  addBelow: 'Add a block below',
  toggleOpen: 'Collapse',
  toggleClosed: 'Expand',
  checkbox: 'Done',
};
