import { parseInline } from '../markdown/parse-inline';
import { parseMarkdown } from '../markdown/parse-blocks';
import { safeUrl } from '../markdown/safe-url';
import type { MarkdownBlock, MarkdownInline } from '../markdown/types';

const blocks = (text: string): MarkdownBlock[] => parseMarkdown(text).map((s) => s.block);
const text = (value: string): MarkdownInline => ({ type: 'text', value });

describe('markdown blocks', () => {
  it('reads headings by level and ignores a missing space', () => {
    expect(blocks('# One\n\n###### Six\n\n#nope')).toEqual([
      { type: 'heading', level: 1, text: 'One' },
      { type: 'heading', level: 6, text: 'Six' },
      { type: 'paragraph', text: '#nope' },
    ]);
  });

  it('joins wrapped lines with a space and keeps a two-space hard break', () => {
    expect(blocks('one\ntwo  \nthree')).toEqual([{ type: 'paragraph', text: 'one two\nthree' }]);
  });

  it('reads a fenced block verbatim, with its language, to the closing fence', () => {
    expect(blocks('```ts\nconst a = 1;\n\n# not a heading\n```\nafter')).toEqual([
      { type: 'code', language: 'ts', code: 'const a = 1;\n\n# not a heading' },
      { type: 'paragraph', text: 'after' },
    ]);
  });

  it('closes an unfinished fence at the end of the text', () => {
    expect(blocks('```js\nlet x')).toEqual([{ type: 'code', language: 'js', code: 'let x' }]);
  });

  it('does not take inline triple backticks for a fence', () => {
    expect(blocks('```code``` in a sentence')).toEqual([
      { type: 'paragraph', text: '```code``` in a sentence' },
    ]);
  });

  it('reads quotes (with blocks inside), rules and tables', () => {
    expect(blocks('> a\n> - b')).toEqual([
      {
        type: 'quote',
        children: [
          { type: 'paragraph', text: 'a' },
          {
            type: 'list',
            ordered: false,
            start: 1,
            items: [{ children: [{ type: 'paragraph', text: 'b' }] }],
          },
        ],
      },
    ]);
    expect(blocks('---')).toEqual([{ type: 'rule' }]);
    expect(blocks('| a | b |\n|:-|--:|\n| 1 | 2 \\| 3 |\n| 4 |')).toEqual([
      {
        type: 'table',
        align: ['left', 'right'],
        header: ['a', 'b'],
        rows: [
          ['1', '2 | 3'],
          ['4', ''],
        ],
      },
    ]);
  });

  it('reads nested, ordered and task lists, with loose items and blank lines', () => {
    const [list] = blocks('3. one\n   - nested\n     more\n\n4. two\n5. [x] done\n6. [ ] todo');
    expect(list).toMatchObject({ type: 'list', ordered: true, start: 3 });
    const items = (list as Extract<MarkdownBlock, { type: 'list' }>).items;
    expect(items).toHaveLength(4);
    expect(items[0]?.children).toEqual([
      { type: 'paragraph', text: 'one' },
      {
        type: 'list',
        ordered: false,
        start: 1,
        items: [{ children: [{ type: 'paragraph', text: 'nested more' }] }],
      },
    ]);
    expect(items[2]).toMatchObject({ checked: true });
    expect(items[3]).toMatchObject({ checked: false });
  });

  it('nests a list indented by two spaces under an ordered item', () => {
    const [list] = blocks('1. a\n  - b');
    const first = (list as Extract<MarkdownBlock, { type: 'list' }>).items[0];
    expect(first?.children.map((b) => b.type)).toEqual(['paragraph', 'list']);
  });

  it('keeps a code fence inside a list item', () => {
    const [list] = blocks('- run:\n\n  ```sh\n  bun test\n  ```\n- next');
    const items = (list as Extract<MarkdownBlock, { type: 'list' }>).items;
    expect(items).toHaveLength(2);
    expect(items[0]?.children[1]).toEqual({ type: 'code', language: 'sh', code: 'bun test' });
  });

  it('does not let a number other than 1 interrupt a paragraph', () => {
    expect(blocks('It was\n2020. A year')).toEqual([
      { type: 'paragraph', text: 'It was 2020. A year' },
    ]);
    expect(blocks('Steps\n1. go')).toHaveLength(2);
  });

  it('shows raw HTML as text', () => {
    expect(blocks('<script>alert(1)</script>')).toEqual([
      { type: 'paragraph', text: '<script>alert(1)</script>' },
    ]);
    expect(parseInline('<b>x</b> <img src=x onerror=alert(1)>')).toEqual([
      text('<b>x</b> <img src=x onerror=alert(1)>'),
    ]);
  });
});

describe('markdown inline', () => {
  it('reads emphasis, strong, strikethrough and code', () => {
    expect(parseInline('a *b* **c** ~~d~~ `e`')).toEqual([
      text('a '),
      { type: 'emphasis', children: [text('b')] },
      text(' '),
      { type: 'strong', children: [text('c')] },
      text(' '),
      { type: 'delete', children: [text('d')] },
      text(' '),
      { type: 'code', value: 'e' },
    ]);
  });

  it('nests strong in emphasis and handles a triple run', () => {
    expect(parseInline('***both***')).toEqual([
      { type: 'emphasis', children: [{ type: 'strong', children: [text('both')] }] },
    ]);
    expect(parseInline('**bold *em***')).toEqual([
      { type: 'strong', children: [text('bold '), { type: 'emphasis', children: [text('em')] }] },
    ]);
  });

  it('leaves arithmetic and snake_case alone', () => {
    expect(parseInline('2 * 3 * 4 and snake_case_name')).toEqual([
      text('2 * 3 * 4 and snake_case_name'),
    ]);
  });

  it('honours escapes and hard breaks', () => {
    expect(parseInline('\\*not\\* a\\\nb')).toEqual([
      text('*not* a'),
      { type: 'break' },
      text('b'),
    ]);
  });

  it('reads links, titles and images as a link carrying its label', () => {
    expect(parseInline('[a **b**](https://x.dev/a_(b) "t") ![alt](/i.png)')).toEqual([
      {
        type: 'link',
        url: 'https://x.dev/a_(b)',
        label: 'a **b**',
        children: [text('a '), { type: 'strong', children: [text('b')] }],
      },
      text(' '),
      { type: 'link', url: '/i.png', label: 'alt', children: [text('alt')] },
    ]);
  });

  it('links a bare URL without its closing punctuation', () => {
    expect(parseInline('see https://x.dev/a, and (https://y.dev).')).toEqual([
      text('see '),
      { type: 'link', url: 'https://x.dev/a', children: [text('https://x.dev/a')] },
      text(', and ('),
      { type: 'link', url: 'https://y.dev', children: [text('https://y.dev')] },
      text(').'),
    ]);
  });

  it('never makes a link of an unsafe scheme', () => {
    for (const url of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      ' javascript:alert(1)',
      'java\tscript:alert(1)',
      'data:text/html;base64,AAAA',
      'vbscript:x',
      'file:///etc/passwd',
      '//evil.example',
    ]) {
      const nodes = parseInline(`[click](${url})`);
      expect(nodes.some((node) => node.type === 'link')).toBe(false);
    }
    expect(parseInline('[click](javascript:alert(1))')).toEqual([text('click')]);
    expect(parseInline('[click](<javascript:alert(1)>)')).toEqual([text('click')]);
  });

  it('accepts http, https, mailto and relative targets', () => {
    for (const url of [
      'http://a.dev',
      'https://a.dev/x?y=1#z',
      'mailto:a@b.dev',
      '/x',
      'a/b',
      '#top',
      '../up',
    ]) {
      expect(safeUrl(url)).toBe(url);
    }
  });

  describe('while streaming', () => {
    it('closes an open span at the end instead of showing its markers', () => {
      expect(parseInline('a **bold and *it', true)).toEqual([
        text('a '),
        {
          type: 'strong',
          children: [text('bold and '), { type: 'emphasis', children: [text('it')] }],
        },
      ]);
      expect(parseInline('use `code', true)).toEqual([
        text('use '),
        { type: 'code', value: 'code' },
      ]);
      expect(parseInline('~~gone', true)).toEqual([{ type: 'delete', children: [text('gone')] }]);
    });

    it('drops a marker with nothing after it yet', () => {
      expect(parseInline('so far **', true)).toEqual([text('so far ')]);
    });

    it('shows a link whose destination is still arriving as its label', () => {
      expect(parseInline('see [the docs](https://x.d', true)).toEqual([text('see the docs')]);
      expect(parseInline('see [the docs](', true)).toEqual([text('see the docs')]);
    });

    it('leaves the same text literal when it is not streaming', () => {
      expect(parseInline('a **bold')).toEqual([text('a **bold')]);
      expect(parseInline('use `code')).toEqual([text('use `code')]);
    });
  });
});

const SAMPLE = [
  '# Title',
  '',
  'A paragraph with **bold**, *em*, ~~gone~~, `code` and a [link](https://x.dev/a_(b) "t").',
  'It wraps  ',
  'and breaks.',
  '',
  '> quoted **text**',
  '> - inside',
  '',
  '1. one',
  '   - nested [x](https://y.dev)',
  '2. two',
  '',
  '- [x] done',
  '- [ ] todo',
  '',
  '| a | b |',
  '|---|--:|',
  '| 1 | `2` |',
  '',
  '---',
  '',
  '```ts',
  'const a = "**not bold**";',
  '```',
  '',
  'Last <b>line</b> with https://z.dev.',
].join('\n');

describe('streaming prefixes', () => {
  it('parses every prefix of a document without throwing', () => {
    for (let end = 0; end <= SAMPLE.length; end += 1) {
      const prefix = SAMPLE.slice(0, end);
      expect(() => {
        for (const segment of parseMarkdown(prefix)) {
          const visit = (block: MarkdownBlock): void => {
            if (block.type === 'paragraph' || block.type === 'heading')
              parseInline(block.text, true);
            if (block.type === 'quote') block.children.forEach(visit);
            if (block.type === 'list') block.items.forEach((item) => item.children.forEach(visit));
            if (block.type === 'table')
              [...block.header, ...block.rows.flat()].forEach((c) => parseInline(c, true));
          };
          visit(segment.block);
        }
      }).not.toThrow();
    }
  });

  it('keeps finished blocks as the same objects while the tail grows', () => {
    let previous = parseMarkdown('');
    const history: Array<ReturnType<typeof parseMarkdown>> = [];
    for (let end = 0; end <= SAMPLE.length; end += 1) {
      previous = parseMarkdown(SAMPLE.slice(0, end), previous);
      history.push(previous);
    }
    const final = history[history.length - 1] ?? [];
    expect(final.length).toBeGreaterThan(8);
    // Once a block has a block after it, it is finished: it must not change identity again.
    for (let step = 1; step < history.length; step += 1) {
      const before = history[step - 1] ?? [];
      const after = history[step] ?? [];
      for (let index = 0; index < before.length - 1; index += 1) {
        if (before[index]?.source === after[index]?.source) {
          expect(after[index]).toBe(before[index]);
        }
      }
    }
    // And the finished document is the same as a one-shot parse.
    expect(final.map((s) => s.block)).toEqual(parseMarkdown(SAMPLE).map((s) => s.block));
  });
});
