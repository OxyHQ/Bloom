/**
 * `CappedChipRow` keeps every pill mounted once, hides the ones past the fit
 * behind a "+N" pill, and shows them all when that pill is pressed.
 */
import { act, fireEvent, render } from '@testing-library/react-native';

import { CappedChipRow, Chip } from '../chip';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const layoutOf = (width: number) => ({
  nativeEvent: { layout: { width, height: 24, x: 0, y: 0 } },
});

describe('CappedChipRow', () => {
  it('hides the pills past the fit behind "+N" and shows them on press', () => {
    const { getByTestId, getByLabelText, queryByTestId, queryByText, getByText } = render(
      <BloomThemeProvider mode="light">
        <CappedChipRow testID="row" maxLines={1}>
          <Chip testID="a">A</Chip>
          <Chip testID="b">B</Chip>
          <Chip testID="c">C</Chip>
        </CappedChipRow>
      </BloomThemeProvider>,
    );

    // Each pill is 40px and the row is 100px. "A" + "+N" (40 + 8 + 40) fits on
    // one line; "A" + "B" + "+N" does not, so "A" alone shows and two are hidden.
    act(() => {
      fireEvent(getByTestId('row'), 'layout', layoutOf(100));
      fireEvent(getByTestId('a').parent ?? getByTestId('a'), 'layout', layoutOf(40));
      fireEvent(getByTestId('b').parent ?? getByTestId('b'), 'layout', layoutOf(40));
      fireEvent(getByTestId('c').parent ?? getByTestId('c'), 'layout', layoutOf(40));
      fireEvent(getByTestId('row-more', { includeHiddenElements: true }), 'layout', layoutOf(40));
    });

    expect(queryByTestId('a')).not.toBeNull();
    expect(queryByTestId('b')).toBeNull();
    expect(queryByTestId('c')).toBeNull();
    expect(getByText('+2')).toBeTruthy();

    fireEvent.press(getByLabelText('Show 2 more'));
    expect(queryByTestId('b')).not.toBeNull();
    expect(queryByTestId('c')).not.toBeNull();
    expect(queryByText('+2')).toBeNull();
  });
});
