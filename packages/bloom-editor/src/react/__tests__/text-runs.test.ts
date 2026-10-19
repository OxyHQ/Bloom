import { DEFAULT_THEME } from '../theme';
import { codeRuns, hasValueOnlyMarks, segmentRuns } from '../text-runs';

const textStyle = {
  linkColor: 'blue',
  codeColor: 'crimson',
  codeBackgroundColor: 'whitesmoke',
  mentionColor: 'teal',
};

describe('segmentRuns', () => {
  it('draws marks as the input does, and the colours only the value carries', () => {
    const runs = segmentRuns(
      [
        { text: 'red', color: 'red' },
        { text: ' hi', background: 'yellow', bold: true },
        { text: ' x', code: true },
        { text: ' link', link: 'https://a.test', strike: true },
        { text: '@Ann', mention: { indicator: '@', attributes: {} } },
      ],
      DEFAULT_THEME,
      textStyle,
      'monospace',
    );
    expect(runs).toEqual([
      { text: 'red', style: { color: DEFAULT_THEME.colors.red?.text } },
      {
        text: ' hi',
        style: { fontWeight: '700', backgroundColor: DEFAULT_THEME.colors.yellow?.background },
      },
      {
        text: ' x',
        style: { fontFamily: 'monospace', color: 'crimson', backgroundColor: 'whitesmoke' },
      },
      { text: ' link', style: { textDecorationLine: 'underline line-through', color: 'blue' } },
      { text: '@Ann', style: { color: 'teal' } },
    ]);
  });

  it('tells a text with colours from one without', () => {
    expect(hasValueOnlyMarks([{ text: 'a', bold: true }])).toBe(false);
    expect(hasValueOnlyMarks([{ text: 'a', color: 'default' }])).toBe(false);
    expect(hasValueOnlyMarks([{ text: 'a' }, { text: 'b', background: 'blue' }])).toBe(true);
  });
});

describe('codeRuns', () => {
  it('joins the lines of tokens with line breaks', () => {
    expect(
      codeRuns('const a\nb', [
        [{ text: 'const', color: 'purple' }, { text: ' a' }],
        [{ text: 'b', color: 'green' }],
      ]),
    ).toEqual([
      { text: 'const', style: { color: 'purple' } },
      { text: ' a', style: {} },
      { text: '\n', style: {} },
      { text: 'b', style: { color: 'green' } },
    ]);
  });

  it('refuses tokens that do not spell the code', () => {
    expect(codeRuns('abc', [[{ text: 'ab' }]])).toBeNull();
    expect(codeRuns('a\nb', [[{ text: 'a' }, { text: 'b' }]])).toBeNull();
  });
});
