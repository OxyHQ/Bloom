import { DEFAULT_THEME } from '../theme';
import { textStyleFor } from '../typography';

describe('textStyleFor', () => {
  it('scales sizes and line heights for small text, and keeps the font', () => {
    const theme = { ...DEFAULT_THEME, textScale: 0.875, fontFamily: 'Serif' };
    expect(textStyleFor('paragraph', theme)).toMatchObject({
      fontSize: 14,
      lineHeight: 21,
      fontFamily: 'Serif',
    });
    expect(textStyleFor('heading_1', theme)).toMatchObject({ fontSize: 26, lineHeight: 34 });
    expect(textStyleFor('paragraph', DEFAULT_THEME)).toMatchObject({
      fontSize: 16,
      lineHeight: 24,
    });
  });
});
