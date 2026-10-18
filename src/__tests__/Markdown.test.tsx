import React from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { Markdown } from '../markdown';
import * as parseBlocks from '../markdown/parse-blocks';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderMarkdown(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Markdown', () => {
  it('sets a heading as a heading role on the ramp for its size', () => {
    const { getByText } = renderMarkdown(<Markdown>{'# Title'}</Markdown>);
    expect(getByText('Title').props.role).toBe('heading');
  });

  it('hands a link to onLinkPress, and opens it itself when there is none', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const onLinkPress = jest.fn();
    const first = renderMarkdown(
      <Markdown onLinkPress={onLinkPress}>{'[go](https://x.dev)'}</Markdown>,
    );
    fireEvent.press(first.getByText('go'), {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    });
    expect(onLinkPress).toHaveBeenCalledWith('https://x.dev');
    expect(open).not.toHaveBeenCalled();

    const second = renderMarkdown(<Markdown>{'[go](https://y.dev)'}</Markdown>);
    fireEvent.press(second.getByText('go'), {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    });
    expect(open).toHaveBeenCalledWith('https://y.dev');
    open.mockRestore();
  });

  it('does not render a javascript: link as a link', () => {
    const { getByText } = renderMarkdown(<Markdown>{'[go](javascript:alert(1))'}</Markdown>);
    expect(getByText('go').props.role).toBeUndefined();
  });

  it('numbers ordered items from their start and sets a bullet per depth', () => {
    const { getByText } = renderMarkdown(<Markdown>{'3. a\n4. b\n   - c'}</Markdown>);
    expect(getByText('3.')).toBeTruthy();
    expect(getByText('4.')).toBeTruthy();
    expect(getByText('◦', { includeHiddenElements: true })).toBeTruthy();
  });

  it('re-reads only the tail as text is appended', () => {
    const spy = jest.spyOn(parseBlocks, 'parseMarkdown');
    const view = renderMarkdown(<Markdown streaming>{'First block.\n\nSecond'}</Markdown>);
    view.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Markdown streaming>{'First block.\n\nSecond block'}</Markdown>
      </BloomThemeProvider>,
    );
    const [first, second] = spy.mock.results.map(
      (r) => r.value as ReturnType<typeof parseBlocks.parseMarkdown>,
    );
    expect(second?.[0]).toBe(first?.[0]);
    expect(second?.[1]).not.toBe(first?.[1]);
    expect(view.getByText('Second block')).toBeTruthy();
    spy.mockRestore();
  });

  it('sets the lg size at 16/28 with 18 and 16/22 headings, and the face on the block', () => {
    const { getByText } = renderMarkdown(
      <Markdown size="lg">{'# Big\n\n## Small\n\nBody text'}</Markdown>,
    );
    const flat = (text: string) => StyleSheet.flatten(getByText(text).props.style);
    expect(flat('Body text')).toMatchObject({ fontSize: 16, lineHeight: 28 });
    expect(flat('Big')).toMatchObject({ fontSize: 18, lineHeight: 26, fontWeight: '600' });
    expect(flat('Small')).toMatchObject({ fontSize: 16, lineHeight: 22, fontWeight: '600' });
    // The face is set on the block's Text; nested marks inherit it, no defaultProps needed.
    expect(flat('Body text').fontFamily).toBe('Inter');
  });

  it('keeps md at 14/20', () => {
    const { getByText } = renderMarkdown(<Markdown>{'Body text'}</Markdown>);
    expect(StyleSheet.flatten(getByText('Body text').props.style)).toMatchObject({
      fontSize: 14,
      lineHeight: 20,
    });
  });

  it('draws a fence through renderCodeBlock and shows what it returns', () => {
    const renderCodeBlock = jest.fn((code: string, language?: string) => (
      <Text>{`slot:${language}:${code}`}</Text>
    ));
    const { getByText } = renderMarkdown(
      <Markdown renderCodeBlock={renderCodeBlock}>{'```ts\nconst a = 1\n```'}</Markdown>,
    );
    expect(renderCodeBlock).toHaveBeenCalledWith('const a = 1', 'ts');
    expect(getByText('slot:ts:const a = 1')).toBeTruthy();
  });

  it('stays tolerant of unfinished fence, bold and link at size lg', () => {
    for (const source of ['```ts\nconst a', 'so **bold and *it', 'see [the docs](https://x.']) {
      const view = renderMarkdown(
        <Markdown size="lg" streaming>
          {source}
        </Markdown>,
      );
      expect(view.toJSON()).toBeTruthy();
      expect(JSON.stringify(view.toJSON())).not.toMatch(/\*\*|\]\(/);
      view.unmount();
    }
  });
});
