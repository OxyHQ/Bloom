import type { Ref } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';

/**
 * The two text ramps a document is set in:
 *
 *   sm   body 13/18, headings from title-2 down (a chat bubble, a card)
 *   md   body 14/20, headings from title-1 down (a full reply)
 */
export type MarkdownSize = 'sm' | 'md';

export interface MarkdownProps {
  /** The Markdown source. Safe to grow token by token while `streaming`. */
  children: string;
  /**
   * The text is still arriving. An unfinished trailing construct (a code fence,
   * `**bold`, `[text](https://`) is closed implicitly instead of showing its raw
   * markers, and only the last block is re-read as the text grows.
   * Default `false`.
   */
  streaming?: boolean;
  /** Default `'md'`. */
  size?: MarkdownSize;
  /**
   * Called with a link's URL (`http(s):`, `mailto:` or relative; never another
   * scheme). Without it, native opens the URL with `Linking` and web follows
   * the anchor.
   */
  onLinkPress?: (url: string) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
  ref?: Ref<View>;
}

/** A run of text inside a block. Links are already vetted: an unsafe URL never becomes one. */
export type MarkdownInline =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'emphasis' | 'strong' | 'delete'; children: MarkdownInline[] }
  | { type: 'link'; url: string; children: MarkdownInline[] }
  | { type: 'break' };

export type MarkdownColumnAlign = 'left' | 'center' | 'right';

export interface MarkdownListItem {
  /** `true` / `false` for a task item (`[x]` / `[ ]`), `undefined` for a plain one. */
  checked?: boolean;
  children: MarkdownBlock[];
}

/**
 * A block. Blocks that hold running text keep it as SOURCE (`text`): the inline
 * pass runs where the block renders, so the tail can be read as streaming
 * without the finished blocks above it knowing.
 */
export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; language?: string; code: string }
  | { type: 'quote'; children: MarkdownBlock[] }
  | { type: 'list'; ordered: boolean; start: number; items: MarkdownListItem[] }
  | { type: 'rule' }
  | {
      type: 'table';
      align: Array<MarkdownColumnAlign | undefined>;
      header: string[];
      rows: string[][];
    };

/** A top-level block with the source lines it was read from, the key that keeps it stable. */
export interface MarkdownSegment {
  source: string;
  block: MarkdownBlock;
}
