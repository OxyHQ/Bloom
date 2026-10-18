import {
  inlineMarkdownTextLength,
  parseInlineMarkdown,
  truncateInlineMarkdown,
} from '../markdown/inline';

describe('inline Markdown clipping', () => {
  it('counts displayed text instead of markers and destinations', () => {
    expect(
      inlineMarkdownTextLength(parseInlineMarkdown('**Deck** and [Oxy](https://oxy.so)')),
    ).toBe(12);
  });

  it('clips inside a styled link, keeping its original label and entire destination', () => {
    const source = parseInlineMarkdown('Hi [@**Alice**](/@alice) today');
    const original = JSON.stringify(source);
    expect(truncateInlineMarkdown(source, 6)).toEqual({
      isTruncated: true,
      nodes: [
        { type: 'text', value: 'Hi ' },
        {
          type: 'link',
          url: '/@alice',
          label: '@**Alice**',
          children: [
            { type: 'text', value: '@' },
            { type: 'strong', children: [{ type: 'text', value: 'Al…' }] },
          ],
        },
      ],
    });
    expect(JSON.stringify(source)).toBe(original);
  });

  it('keeps escapes, code and complete Unicode code points', () => {
    const source = parseInlineMarkdown('\\* 😀 `**code**`\nnext');
    const clipped = truncateInlineMarkdown(source, 3);
    expect(clipped.nodes).toEqual([{ type: 'text', value: '* 😀…' }]);
    expect(inlineMarkdownTextLength(source)).toBe(17);
    expect(truncateInlineMarkdown(source, 7).nodes).toEqual([
      { type: 'text', value: '* 😀 ' },
      { type: 'code', value: '**c…' },
    ]);
  });

  it('does not add an ellipsis at the exact boundary, infinity or on empty input', () => {
    const nodes = parseInlineMarkdown('**Deck**');
    for (const limit of [4, Infinity])
      expect(truncateInlineMarkdown(nodes, limit)).toEqual({ nodes, isTruncated: false });
    expect(truncateInlineMarkdown([], 0)).toEqual({ nodes: [], isTruncated: false });
  });

  it.each([0, -1, Number.NaN])('uses only an ellipsis for an exhausted limit %s', (limit) => {
    expect(truncateInlineMarkdown(parseInlineMarkdown('hello'), limit)).toEqual({
      nodes: [{ type: 'text', value: '…' }],
      isTruncated: true,
    });
  });
});
