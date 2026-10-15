import {
  applyMarks,
  applyPlainTextChange,
  applyTextEdit,
  diffText,
  htmlToSegments,
  reconcileInputValue,
  segmentsEqual,
  segmentsToHtml,
  segmentsToPlainText,
  transformSelection,
  type Segment,
} from '../model';

// "Hello **bold** world" with a link on "world".
const rich: Segment[] = [
  { text: 'Hello ' },
  { text: 'bold', bold: true },
  { text: ' ' },
  { text: 'world', link: 'https://oxy.so' },
];

describe('diffText', () => {
  it('returns null for equal strings', () => {
    expect(diffText('abc', 'abc')).toBeNull();
  });
  it('finds an insertion, a deletion and a replacement', () => {
    expect(diffText('Hello world', 'Hello big world')).toEqual({
      index: 6,
      deleteCount: 0,
      insert: 'big ',
    });
    expect(diffText('Hello world', 'Hello')).toEqual({ index: 5, deleteCount: 6, insert: '' });
    expect(diffText('teh cat', 'the cat')).toEqual({ index: 1, deleteCount: 2, insert: 'he' });
  });
  it('keeps prefix and suffix from overlapping on repeated characters', () => {
    expect(diffText('aaa', 'aaaa')).toEqual({ index: 3, deleteCount: 0, insert: 'a' });
    expect(diffText('aaaa', 'aa')).toEqual({ index: 2, deleteCount: 2, insert: '' });
  });
  it('never splits a surrogate pair', () => {
    expect(diffText('a😀b', 'a😃b')).toEqual({ index: 1, deleteCount: 2, insert: '😃' });
  });
});

describe('applyTextEdit', () => {
  it('keeps marks outside the edit', () => {
    expect(applyTextEdit(rich, { index: 0, deleteCount: 5, insert: 'Hi' })).toEqual([
      { text: 'Hi ' },
      { text: 'bold', bold: true },
      { text: ' ' },
      { text: 'world', link: 'https://oxy.so' },
    ]);
  });
  it("gives typed text its left neighbour's marks", () => {
    expect(applyTextEdit(rich, { index: 10, deleteCount: 0, insert: 'er' })[1]).toEqual({
      text: 'bolder',
      bold: true,
    });
  });
  it('gives text typed over a selection the replaced marks', () => {
    const next = applyTextEdit(rich, { index: 11, deleteCount: 5, insert: 'there' });
    expect(next[next.length - 1]).toEqual({ text: 'there', link: 'https://oxy.so' });
  });
  it('never extends a mention', () => {
    const value: Segment[] = [
      { text: '@Ana', mention: { indicator: '@', attributes: { id: '1' } } },
    ];
    expect(applyTextEdit(value, { index: 4, deleteCount: 0, insert: ' hi' })).toEqual([
      value[0],
      { text: ' hi' },
    ]);
  });
  it('preserves formatting across a whole-string change', () => {
    expect(applyPlainTextChange(rich, 'Hello bold world!')).toEqual([
      { text: 'Hello ' },
      { text: 'bold', bold: true },
      { text: ' ' },
      { text: 'world!', link: 'https://oxy.so' },
    ]);
  });
});

describe('applyMarks', () => {
  it('sets and clears marks on a range', () => {
    const bolded = applyMarks([{ text: 'abcdef' }], 2, 4, { bold: true, color: 'blue' });
    expect(bolded).toEqual([
      { text: 'ab' },
      { text: 'cd', bold: true, color: 'blue' },
      { text: 'ef' },
    ]);
    expect(applyMarks(bolded, 0, 6, { bold: false, color: 'default' })).toEqual([
      { text: 'abcdef' },
    ]);
  });
});

describe('HTML', () => {
  it('round-trips every mark the input knows', () => {
    const value: Segment[] = [
      { text: 'a', bold: true },
      { text: 'b', italic: true, underline: true },
      { text: 'c', strike: true, code: true },
      { text: 'link', link: 'https://oxy.so/x?a=1&b=2' },
      { text: ' ' },
      { text: '@Ana', mention: { indicator: '@', attributes: { id: 'u1', kind: 'user' } } },
      { text: ' <tag> & "quotes"' },
    ];
    expect(segmentsEqual(htmlToSegments(segmentsToHtml(value)), value)).toBe(true);
  });

  it('writes the dialect the input reads', () => {
    expect(segmentsToHtml([{ text: 'Hi ' }, { text: 'there', bold: true }])).toBe(
      '<html>\n<p>Hi <b>there</b></p>\n</html>',
    );
    expect(segmentsToHtml([])).toBe('<html>\n<p></p>\n</html>');
  });

  it('maps paragraphs and <br> to newlines', () => {
    const value: Segment[] = [{ text: 'one\ntwo\n\nfour' }];
    expect(segmentsToPlainText(htmlToSegments(segmentsToHtml(value)))).toBe('one\ntwo\n\nfour');
    expect(segmentsToPlainText(htmlToSegments('<p>a<br>b</p>'))).toBe('a\nb');
  });

  it('accepts what the input emits around its markup', () => {
    expect(htmlToSegments('<html>\n<p>Hello <strong>you</strong></p>\n</html>')).toEqual([
      { text: 'Hello ' },
      { text: 'you', bold: true },
    ]);
  });

  it('drops unknown tags, scripts and unsafe links but keeps their text', () => {
    const parsed = htmlToSegments(
      '<p>a<span style="x">b</span><script>alert(1)</script><a href="javascript:alert(1)">c</a><img src=x onerror=y>d</p>',
    );
    expect(parsed).toEqual([{ text: 'abcd' }]);
  });

  it('decodes entities', () => {
    expect(segmentsToPlainText(htmlToSegments('<p>&lt;&amp;&gt;&quot;&#39;&#x1F600;</p>'))).toBe(
      '<&>"\'😀',
    );
  });
});

describe('reconcileInputValue', () => {
  it('keeps colours the input cannot show while the user types', () => {
    const previous: Segment[] = [{ text: 'red', color: 'red' }, { text: ' plain' }];
    const fromInput = htmlToSegments('<p>reddish plain</p>');
    const { segments, edit } = reconcileInputValue(previous, fromInput);
    expect(edit).toEqual({ index: 3, deleteCount: 0, insert: 'dish' });
    expect(segments).toEqual([{ text: 'reddish', color: 'red' }, { text: ' plain' }]);
  });

  it("takes the input's word on the marks it knows", () => {
    const previous: Segment[] = [{ text: 'hello', color: 'blue', bold: true }];
    const { segments, edit } = reconcileInputValue(previous, [{ text: 'hello', italic: true }]);
    expect(edit).toBeNull();
    expect(segments).toEqual([{ text: 'hello', color: 'blue', italic: true }]);
  });
});

describe('transformSelection', () => {
  const edit = { index: 2, deleteCount: 1, insert: 'XYZ' };
  it('keeps a caret before the edit and shifts one after it', () => {
    expect(transformSelection({ start: 1, end: 1 }, edit)).toEqual({ start: 1, end: 1 });
    expect(transformSelection({ start: 5, end: 6 }, edit)).toEqual({ start: 7, end: 8 });
  });
  it('moves a caret inside the replaced span to after the replacement', () => {
    expect(
      transformSelection({ start: 3, end: 3 }, { index: 2, deleteCount: 2, insert: 'Q' }),
    ).toEqual({
      start: 3,
      end: 3,
    });
  });
});
