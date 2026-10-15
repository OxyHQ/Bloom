import type { RichTextStyle } from '@oxy.so/bloom-text';
import type { EditorTheme } from './theme';

/** Type scale per block type, Notion's proportions. */
export function textStyleFor(type: string, theme: EditorTheme): RichTextStyle {
  const base: RichTextStyle = { color: theme.text, fontFamily: theme.fontFamily };
  switch (type) {
    case 'heading_1':
      return { ...base, fontSize: 30, lineHeight: 39, fontWeight: '700' };
    case 'heading_2':
      return { ...base, fontSize: 24, lineHeight: 31, fontWeight: '600' };
    case 'heading_3':
      return { ...base, fontSize: 20, lineHeight: 26, fontWeight: '600' };
    case 'code':
      return { ...base, fontSize: 14, lineHeight: 21, fontFamily: theme.monoFontFamily };
    case 'quote':
      return { ...base, fontSize: 18, lineHeight: 27 };
    default:
      return { ...base, fontSize: 16, lineHeight: 24 };
  }
}

/** Space above a block, so headings breathe as in Notion. */
export function blockSpacing(type: string): number {
  if (type === 'heading_1') return 24;
  if (type === 'heading_2') return 18;
  if (type === 'heading_3') return 12;
  return 2;
}
