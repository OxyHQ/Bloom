import { mergeText } from '../merge';
import { segmentsToPlainText } from '../segments';
import type { Segment } from '../types';

const t = (text: string): Segment[] => [{ text }];
const plain = (segments: Segment[]) => segmentsToPlainText(segments);

describe('mergeText', () => {
  it('keeps both when each typed somewhere else', () => {
    expect(plain(mergeText(t('the plan'), t('the new plan'), t('the plan today')))).toBe(
      'the new plan today',
    );
    expect(plain(mergeText(t('the plan'), t('the plan today'), t('the new plan')))).toBe(
      'the new plan today',
    );
  });

  it('keeps both insertions at the same place, theirs first', () => {
    expect(plain(mergeText(t('ab'), t('aXb'), t('aYb')))).toBe('aXYb');
  });

  it('takes one side when the other did nothing', () => {
    expect(mergeText(t('same'), t('same'), t('theirs'))).toEqual(t('theirs'));
    expect(mergeText(t('same'), t('mine'), t('same'))).toEqual(t('mine'));
  });

  it('keeps what theirs typed inside a range mine deleted', () => {
    // Mine deleted "cdef"; theirs replaced "de" with "XY".
    expect(plain(mergeText(t('abcdefgh'), t('abgh'), t('abcXYfgh')))).toBe('abXYgh');
  });

  it('deletes what either deleted, once', () => {
    expect(plain(mergeText(t('abcdef'), t('af'), t('abef')))).toBe('af');
    expect(plain(mergeText(t('abcdef'), t('abef'), t('af')))).toBe('af');
  });

  it('keeps marks on both sides', () => {
    const base = t('hello world');
    const mine: Segment[] = [{ text: 'hello ' }, { text: 'world', bold: true }];
    const theirs = t('hello world!');
    expect(mergeText(base, mine, theirs)).toEqual([
      { text: 'hello ' },
      { text: 'world', bold: true },
      { text: '!' },
    ]);
  });

  it('never splits a mention', () => {
    const ana: Segment = { text: '@Ana', mention: { indicator: '@', attributes: { id: 'a' } } };
    const ben: Segment = { text: '@Ben', mention: { indicator: '@', attributes: { id: 'b' } } };
    const base = [{ text: 'ask ' }, ana];
    const mine = [{ text: 'ask ' }, ben];
    const theirs = [{ text: 'please ask ' }, ana];
    expect(mergeText(base, mine, theirs)).toEqual([{ text: 'please ask ' }, ben]);
  });

  it('keeps emoji whole', () => {
    expect(plain(mergeText(t('a👍b'), t('a👍👍b'), t('a👍b!')))).toBe('a👍👍b!');
  });
});
