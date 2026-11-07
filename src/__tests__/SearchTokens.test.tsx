/**
 * `Search`'s tokens (UIKit's `UISearchToken`, AppKit's search field tokens):
 * filters drawn inside the field before the text, each named by its label with
 * a remove button; Backspace at the start of the text removes the last; the
 * clear button clears the whole query through `onClearText` alone. Without
 * `tokens` the field is what it always was.
 */
import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Search, type SearchToken } from '../search';
import { RiFilePdf2Line } from '../icons/remix/RiFilePdf2Line';

const TOKENS: readonly SearchToken[] = [
  { key: 'kind', label: 'Kind: PDF', icon: RiFilePdf2Line },
  { key: 'tag', label: 'Tag: Work' },
];

/** A press event, which a chip's remove button stops from reaching the field. */
const PRESS = { stopPropagation: () => {} };

function renderSearch(props: Partial<React.ComponentProps<typeof Search>> = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <Search value="" onChangeText={() => {}} testID="search" {...props} />
    </BloomThemeProvider>,
  );
}

function backspace(input: ReturnType<ReturnType<typeof render>['getByTestId']>) {
  fireEvent(input, 'keyPress', { nativeEvent: { key: 'Backspace' } });
}

describe('Search without tokens', () => {
  it('draws no token row, keeps its placeholder and hides the clear button while empty', () => {
    const { queryByTestId, getByTestId } = renderSearch({ label: 'Search files' });
    expect(queryByTestId('searchTokens')).toBeNull();
    expect(queryByTestId('searchTextInputClearBtn')).toBeNull();
    expect(getByTestId('search').props.placeholder).toBe('Search files');
  });

  it('hands the caller’s key and selection handlers to the input untouched', () => {
    const onKeyPress = jest.fn();
    const onSelectionChange = jest.fn();
    const { getByTestId } = renderSearch({ onKeyPress, onSelectionChange });
    expect(getByTestId('search').props.onKeyPress).toBe(onKeyPress);
    expect(getByTestId('search').props.onSelectionChange).toBe(onSelectionChange);
  });

  it('keeps a placeholder the caller turned off', () => {
    const { getByTestId } = renderSearch({ placeholder: null });
    expect(getByTestId('search').props.placeholder).toBeUndefined();
  });
});

describe('Search tokens', () => {
  it('draws each token, in order, named by its label, with a remove button', () => {
    const onRemoveToken = jest.fn();
    const { getByTestId, getByLabelText } = renderSearch({ tokens: TOKENS, onRemoveToken });
    const row = getByTestId('searchTokens');
    const kind = getByTestId('searchToken-kind');
    const tag = getByTestId('searchToken-tag');
    expect(kind.props.accessibilityLabel).toBe('Kind: PDF');
    expect(tag.props.accessibilityLabel).toBe('Tag: Work');
    expect(row).toContainElement(kind);
    expect(row).toContainElement(tag);

    fireEvent.press(getByLabelText('Remove Tag: Work'), PRESS);
    fireEvent.press(getByLabelText('Remove Kind: PDF'), PRESS);
    expect(onRemoveToken.mock.calls).toEqual([['tag'], ['kind']]);
  });

  it('shows no placeholder beside tokens', () => {
    const { getByTestId } = renderSearch({ tokens: TOKENS, label: 'Search files' });
    expect(getByTestId('search').props.placeholder).toBeUndefined();
  });

  it('removes the last token on Backspace in empty text', () => {
    const onRemoveToken = jest.fn();
    const onKeyPress = jest.fn();
    const { getByTestId } = renderSearch({ tokens: TOKENS, onRemoveToken, onKeyPress });
    backspace(getByTestId('search'));
    expect(onRemoveToken.mock.calls).toEqual([['tag']]);
    expect(onKeyPress).toHaveBeenCalledTimes(1);
  });

  it('removes nothing for another key', () => {
    const onRemoveToken = jest.fn();
    const { getByTestId } = renderSearch({ tokens: TOKENS, onRemoveToken });
    fireEvent(getByTestId('search'), 'keyPress', { nativeEvent: { key: 'a' } });
    expect(onRemoveToken).not.toHaveBeenCalled();
  });

  it('removes the last token only with the caret at the start of the text and nothing selected', () => {
    const onRemoveToken = jest.fn();
    const onSelectionChange = jest.fn();
    const { getByTestId } = renderSearch({
      value: 'report',
      tokens: TOKENS,
      onRemoveToken,
      onSelectionChange,
    });
    const input = getByTestId('search');
    // No selection reported yet: the caret is where text puts it, at the end.
    backspace(input);
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 6, end: 6 } } });
    backspace(input);
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 0, end: 6 } } });
    backspace(input);
    expect(onRemoveToken).not.toHaveBeenCalled();

    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 0, end: 0 } } });
    backspace(input);
    expect(onRemoveToken.mock.calls).toEqual([['tag']]);
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
  });

  it('trusts only a reported caret when the field is uncontrolled', () => {
    const onRemoveToken = jest.fn();
    const { getByTestId } = renderSearch({ value: undefined, tokens: TOKENS, onRemoveToken });
    const input = getByTestId('search');
    // Its text is unknown: typed text is not empty text.
    backspace(input);
    expect(onRemoveToken).not.toHaveBeenCalled();
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 0, end: 0 } } });
    backspace(input);
    expect(onRemoveToken.mock.calls).toEqual([['tag']]);
  });

  it('shows the clear button for tokens alone, and clears the whole query through onClearText', () => {
    const onClearText = jest.fn();
    const onRemoveToken = jest.fn();
    const { getByTestId } = renderSearch({ tokens: TOKENS, onRemoveToken, onClearText });
    fireEvent.press(getByTestId('searchTextInputClearBtn'));
    expect(onClearText).toHaveBeenCalledTimes(1);
    expect(onRemoveToken).not.toHaveBeenCalled();
  });

  it('hides the clear button again once the tokens and the text are gone', () => {
    const { queryByTestId } = renderSearch({ tokens: [] });
    expect(queryByTestId('searchTextInputClearBtn')).toBeNull();
    expect(queryByTestId('searchTokens')).toBeNull();
  });

  it('disables the remove buttons with the field', () => {
    const { getByLabelText } = renderSearch({
      tokens: TOKENS,
      onRemoveToken: jest.fn(),
      disabled: true,
    });
    expect(getByLabelText('Remove Kind: PDF')).toBeDisabled();
    expect(getByLabelText('Remove Tag: Work')).toBeDisabled();
  });
});
