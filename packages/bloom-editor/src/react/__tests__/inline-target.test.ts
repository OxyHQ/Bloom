import { inlineTargetAt } from '../inline-target';

const text = [
  { text: 'see ' },
  { text: 'the ', link: 'https://a.test' },
  { text: 'docs', link: 'https://a.test', bold: true },
  { text: ' or ' },
  { text: '@Ana', mention: { indicator: '@', attributes: { kind: 'user', id: 'u1' } } },
  { text: ' or ' },
  { text: 'b', link: 'https://b.test' },
];

describe('inlineTargetAt', () => {
  it('finds one link across segments, inside it or just after it', () => {
    const link = { kind: 'link', href: 'https://a.test', start: 4, end: 12 };
    expect(inlineTargetAt(text, 6)).toEqual(link);
    expect(inlineTargetAt(text, 12)).toEqual(link);
    expect(inlineTargetAt(text, 4)).toBeNull();
    expect(inlineTargetAt(text, 2)).toBeNull();
  });

  it('finds a mention, and tells links with different targets apart', () => {
    expect(inlineTargetAt(text, 20)).toMatchObject({ kind: 'mention', text: '@Ana', start: 16 });
    expect(inlineTargetAt(text, 25)).toEqual({
      kind: 'link',
      href: 'https://b.test',
      start: 24,
      end: 25,
    });
  });
});
