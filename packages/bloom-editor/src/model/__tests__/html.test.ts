import { DEFAULT_SCHEMA, extendSchema, htmlToSnapshot, isPlainSnapshot } from '../index';

describe('htmlToSnapshot', () => {
  it('reads headings, paragraphs and marks', () => {
    const snapshot = htmlToSnapshot(
      '<h1>Title</h1><p>Some <b>bold</b>, <em>italic</em>, <s>gone</s>, <u>under</u> and <code>x()</code>.</p><h4>Small</h4>',
    );
    expect(snapshot).toEqual([
      { type: 'heading_1', text: [{ text: 'Title' }] },
      {
        type: 'paragraph',
        text: [
          { text: 'Some ' },
          { text: 'bold', bold: true },
          { text: ', ' },
          { text: 'italic', italic: true },
          { text: ', ' },
          { text: 'gone', strike: true },
          { text: ', ' },
          { text: 'under', underline: true },
          { text: ' and ' },
          { text: 'x()', code: true },
          { text: '.' },
        ],
      },
      { type: 'heading_3', text: [{ text: 'Small' }] },
    ]);
  });

  it('keeps safe links only', () => {
    const [block] = htmlToSnapshot(
      '<p><a href="https://example.com">site</a> <a href="javascript:alert(1)">bad</a></p>',
    );
    expect(block?.text).toEqual([{ text: 'site', link: 'https://example.com' }, { text: ' bad' }]);
  });

  it('collapses whitespace as a browser does', () => {
    const snapshot = htmlToSnapshot('\n  <p>\n   one\n   two  </p>\n\n<p> three&nbsp;four </p>\n');
    expect(snapshot).toEqual([
      { type: 'paragraph', text: [{ text: 'one two' }] },
      { type: 'paragraph', text: [{ text: 'three four' }] },
    ]);
  });

  it('nests lists, numbers ordered ones and reads to-dos', () => {
    const snapshot = htmlToSnapshot(`
      <ul>
        <li>one
          <ol><li>inner</li></ol>
        </li>
        <li><input type="checkbox" checked disabled> done</li>
        <li><input type="checkbox"> open</li>
        <li>[x] typed</li>
      </ul>`);
    expect(snapshot).toEqual([
      {
        type: 'bulleted_list_item',
        text: [{ text: 'one' }],
        children: [{ type: 'numbered_list_item', text: [{ text: 'inner' }] }],
      },
      { type: 'todo', text: [{ text: 'done' }], props: { checked: true } },
      { type: 'todo', text: [{ text: 'open' }], props: { checked: false } },
      { type: 'todo', text: [{ text: 'typed' }], props: { checked: true } },
    ]);
  });

  it('reads Google Docs checklists and its font-weight spans', () => {
    const snapshot = htmlToSnapshot(
      '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1"><ul><li role="checkbox" aria-checked="true"><p><span style="font-weight:700">Ship</span><span> it</span></p></li></ul><p><span style="font-style:italic">soft</span></p></b>',
    );
    expect(snapshot).toEqual([
      {
        type: 'todo',
        text: [{ text: 'Ship', bold: true }, { text: ' it' }],
        props: { checked: true },
      },
      { type: 'paragraph', text: [{ text: 'soft', italic: true }] },
    ]);
  });

  it('reads quotes, code with its language and dividers', () => {
    const snapshot = htmlToSnapshot(
      '<blockquote><p>first</p><p>second</p></blockquote><pre><code class="language-ts">const a = 1;\n  return a;\n</code></pre><hr>',
    );
    expect(snapshot).toEqual([
      { type: 'quote', text: [{ text: 'first\nsecond' }] },
      { type: 'code', text: [{ text: 'const a = 1;\n  return a;' }], props: { language: 'ts' } },
      { type: 'divider' },
    ]);
  });

  it('makes images blocks after the text they sat in, or what the app says', () => {
    const html =
      '<p>See <img src="https://x.test/a.png" alt="A"> this</p><img src="data:image/png;base64,AAAA">';
    expect(htmlToSnapshot(html)).toEqual([
      { type: 'paragraph', text: [{ text: 'See this' }] },
      { type: 'image', props: { url: 'https://x.test/a.png', alt: 'A' } },
    ]);
    // Without an image type in the schema, an image leaves its description.
    expect(htmlToSnapshot(html, { schema: DEFAULT_SCHEMA })).toEqual([
      { type: 'paragraph', text: [{ text: 'See A this' }] },
    ]);
    expect(
      htmlToSnapshot(html, { image: ({ src }) => ({ type: 'file', props: { src } }) }).map(
        (b) => b.type,
      ),
    ).toEqual(['paragraph', 'file', 'file']);
  });

  it('turns tables into tables when the schema has them, else into lines', () => {
    const html = '<table><tr><th>a</th><th>b</th></tr><tr><td>1</td></tr></table>';
    expect(htmlToSnapshot(html, { schema: DEFAULT_SCHEMA })).toEqual([
      { type: 'paragraph', text: [{ text: 'a\tb' }] },
      { type: 'paragraph', text: [{ text: '1' }] },
    ]);
    const withTables = extendSchema(DEFAULT_SCHEMA, [
      { type: 'table', hasText: false, canHaveChildren: true, isContainer: true },
      { type: 'table_row', hasText: false, canHaveChildren: true, isContainer: true },
      { type: 'table_cell', hasText: true, canHaveChildren: false },
    ]);
    expect(htmlToSnapshot(html, { schema: withTables })).toEqual([
      {
        type: 'table',
        children: [
          {
            type: 'table_row',
            children: [
              { type: 'table_cell', text: [{ text: 'a' }] },
              { type: 'table_cell', text: [{ text: 'b' }] },
            ],
          },
          {
            type: 'table_row',
            children: [
              { type: 'table_cell', text: [{ text: '1' }] },
              { type: 'table_cell', text: [] },
            ],
          },
        ],
      },
    ]);
  });

  it('makes details a toggle, and line breaks soft breaks', () => {
    expect(
      htmlToSnapshot('<details><summary>More</summary><p>inside</p></details><p>a<br>b</p>'),
    ).toEqual([
      {
        type: 'toggle',
        text: [{ text: 'More' }],
        props: { expanded: true },
        children: [{ type: 'paragraph', text: [{ text: 'inside' }] }],
      },
      { type: 'paragraph', text: [{ text: 'a\nb' }] },
    ]);
  });

  it('drops scripts, styles and comments, and survives broken markup', () => {
    expect(
      htmlToSnapshot(
        '<style>p{color:red}</style><!--StartFragment--><p>ok<script>alert(1)</script></b></i><p>next <b>open',
      ),
    ).toEqual([
      { type: 'paragraph', text: [{ text: 'ok' }] },
      { type: 'paragraph', text: [{ text: 'next ' }, { text: 'open', bold: true }] },
    ]);
    expect(htmlToSnapshot('   ')).toEqual([]);
    expect(htmlToSnapshot('<p>1 &lt; 2 &amp;&amp; 3 &gt; 2 &#x1F600;</p>')[0]?.text).toEqual([
      { text: '1 < 2 && 3 > 2 😀' },
    ]);
  });

  it('reads a code editor copy (lines in white-space: pre) as code', () => {
    const snapshot = htmlToSnapshot(
      '<div style="white-space: pre;"><div><span>if (a) {</span></div><div><span>  b();</span></div><div><span>}</span></div></div>',
    );
    expect(snapshot).toEqual([{ type: 'code', text: [{ text: 'if (a) {\n  b();\n}' }] }]);
  });

  it('tells plain pastes from rich ones', () => {
    expect(isPlainSnapshot(htmlToSnapshot('<span>just text</span>'))).toBe(true);
    expect(isPlainSnapshot(htmlToSnapshot('<p>a</p><p>b</p>'))).toBe(true);
    expect(isPlainSnapshot(htmlToSnapshot('<p>a <b>b</b></p>'))).toBe(false);
    expect(isPlainSnapshot(htmlToSnapshot('<h2>a</h2>'))).toBe(false);
  });
});
