import React from 'react';
import { Linking } from 'react-native';
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
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const onLinkPress = jest.fn();
    const first = renderMarkdown(
      <Markdown onLinkPress={onLinkPress}>{'[go](https://x.dev)'}</Markdown>,
    );
    fireEvent.press(first.getByText('go'), { preventDefault: jest.fn() });
    expect(onLinkPress).toHaveBeenCalledWith('https://x.dev');
    expect(open).not.toHaveBeenCalled();

    const second = renderMarkdown(<Markdown>{'[go](https://y.dev)'}</Markdown>);
    fireEvent.press(second.getByText('go'), { preventDefault: jest.fn() });
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
});
