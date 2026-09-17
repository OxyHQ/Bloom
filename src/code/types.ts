import type { ReactNode } from 'react';
import type { StyleProp, TextProps, TextStyle, ViewStyle } from 'react-native';

/**
 * A language hint. `js`, `jsx`, `ts`, `tsx`, `javascript` and `typescript` are
 * highlighted; any other value renders the code as plain text.
 */
export type CodeLanguage = 'js' | 'jsx' | 'ts' | 'tsx' | 'javascript' | 'typescript' | (string & {});

/** What a highlighted run is. See `tokenizeCode`. */
export type CodeTokenKind =
  | 'plain'
  | 'keyword'
  | 'operator'
  | 'string'
  | 'comment'
  | 'constant'
  | 'className'
  | 'function'
  | 'attrName'
  | 'attrValue'
  | 'punctuation';

export interface CodeToken {
  kind: CodeTokenKind;
  text: string;
}

export interface CodeProps extends TextProps {
  style?: StyleProp<TextStyle>;
}

export interface PreProps extends Omit<TextProps, 'style'> {
  /** The block's own box: margins, width, a different surface. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Text style over the monospace run. */
  style?: StyleProp<TextStyle>;
  /** Highlight the contents (`tsx`, `ts`, `js`…). Omit for plain text. */
  language?: CodeLanguage;
  /** Number the lines. Default `false`. */
  lineNumbers?: boolean;
}

/**
 * The two type ramps a code view is drawn at:
 *
 *   sm   JetBrains Mono 11/18, numbers 12 wide, 12 to the code (a card in a chat reply)
 *   md   JetBrains Mono 13/23, numbers 20 wide, 13 to the code (a full panel)
 */
export type CodeLinesSize = 'sm' | 'md';

export interface CodeLinesProps {
  code: string;
  /** The grammar. Omit for plain text. */
  language?: CodeLanguage;
  /** Identifiers painted as class names wherever they appear. */
  highlight?: ReadonlyArray<string>;
  /** Number the lines. Default `true`. */
  lineNumbers?: boolean;
  /**
   * Soft-wrap long lines under themselves (numbers stay on their first row).
   * Default `false`: the lines keep their width and the view scrolls sideways.
   */
  wrap?: boolean;
  /** Default `'sm'`. */
  size?: CodeLinesSize;
  /** The scroll box (padding goes here, so it scrolls with the code). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CodeBlockLabels {
  /** Default `'Copy code'`. */
  copy?: string;
  /** Default `'Code copied'`. */
  copied?: string;
}

export interface CodeBlockProps {
  code: string;
  /** The grammar, and — upper-cased — the chip in the header. Omit for plain text and no chip. */
  language?: CodeLanguage;
  /** Chip text when it should differ from the upper-cased `language`. */
  languageLabel?: string;
  /** Header file name, e.g. `theme-toggle.tsx`. */
  filename?: string;
  /** Diff counts in the header. */
  additions?: number;
  deletions?: number;
  /** Identifiers painted as class names wherever they appear. */
  highlight?: ReadonlyArray<string>;
  /** Number the lines. Default `true`. */
  lineNumbers?: boolean;
  /** Soft-wrap instead of scrolling sideways. Default `false`. */
  wrap?: boolean;
  /** Show the copy button. Default `true`. */
  copyable?: boolean;
  /** Copy handler; the glyph shows a check for 1.6s after. Default on web: the clipboard. */
  onCopy?: (code: string) => void | Promise<void>;
  /** Extra header content before the diff counts. */
  headerAccessory?: ReactNode;
  labels?: CodeBlockLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
