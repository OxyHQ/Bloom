/**
 * A block's text as styled runs, for drawing it where the input cannot: the
 * colours and highlights only the value carries, and highlighted code. Pure,
 * so the mapping is tested without a renderer.
 */
import type { RichTextStyle } from '@oxy.so/bloom-text';
import type { Segment } from '@oxy.so/bloom-text/model';
import type { CodeToken } from './context';
import type { EditorTheme } from './theme';

/** The style of one run, in React Native's terms. */
export interface RunStyle {
  color?: string;
  backgroundColor?: string;
  fontWeight?: '700';
  fontStyle?: 'italic';
  fontFamily?: string;
  textDecorationLine?: 'underline' | 'line-through' | 'underline line-through';
}

export interface TextRun {
  text: string;
  style: RunStyle;
}

/** Whether a text carries marks the input does not show (a colour, a highlight). */
export function hasValueOnlyMarks(segments: readonly Segment[]): boolean {
  return segments.some(
    (segment) =>
      (segment.color !== undefined && segment.color !== 'default') ||
      (segment.background !== undefined && segment.background !== 'default'),
  );
}

/** The runs of a text, styled as the input styles them, plus colours and highlights. */
export function segmentRuns(
  segments: readonly Segment[],
  theme: EditorTheme,
  textStyle: RichTextStyle,
  monoFontFamily: string,
): TextRun[] {
  return segments.map((segment) => {
    const style: RunStyle = {};
    if (segment.bold) style.fontWeight = '700';
    if (segment.italic) style.fontStyle = 'italic';
    const underline = segment.underline || segment.link !== undefined;
    if (underline && segment.strike) style.textDecorationLine = 'underline line-through';
    else if (underline) style.textDecorationLine = 'underline';
    else if (segment.strike) style.textDecorationLine = 'line-through';
    if (segment.code) {
      style.fontFamily = theme.monoFontFamily ?? monoFontFamily;
      if (textStyle.codeColor) style.color = textStyle.codeColor;
      if (textStyle.codeBackgroundColor) style.backgroundColor = textStyle.codeBackgroundColor;
    }
    if (segment.link && textStyle.linkColor) style.color = textStyle.linkColor;
    if (segment.mention) {
      if (textStyle.mentionColor) style.color = textStyle.mentionColor;
      if (textStyle.mentionBackgroundColor)
        style.backgroundColor = textStyle.mentionBackgroundColor;
    }
    const color = segment.color ? theme.colors[segment.color]?.text : undefined;
    if (color) style.color = color;
    const background = segment.background
      ? theme.colors[segment.background]?.background
      : undefined;
    if (background) style.backgroundColor = background;
    return { text: segment.text, style };
  });
}

/**
 * Highlighted code as runs: the tokens of each line, lines joined by line
 * breaks. Null when the tokens do not spell `code` exactly — a highlighter
 * that drops or adds text must never show a page what it does not hold.
 */
export function codeRuns(code: string, lines: readonly (readonly CodeToken[])[]): TextRun[] | null {
  const runs: TextRun[] = [];
  lines.forEach((tokens, i) => {
    if (i > 0) runs.push({ text: '\n', style: {} });
    for (const token of tokens) {
      if (token.text)
        runs.push({ text: token.text, style: token.color ? { color: token.color } : {} });
    }
  });
  return runs.map((run) => run.text).join('') === code ? runs : null;
}
