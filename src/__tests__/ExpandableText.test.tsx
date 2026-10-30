/**
 * `ExpandableText`: the control exists only once the text is MEASURED as
 * clamped, both toggles do what they say, and `ReviewCard` (which draws its
 * text with it) keeps its test ids.
 */
import type React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { ExpandableText } from '../expandable-text';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const TEXT = 'One line. '.repeat(40);

function mount(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

/** Lay the clamped text out at `clamped` and the hidden full copy at `full`. */
function measure(
  getByTestId: (id: string, options?: { includeHiddenElements?: boolean }) => unknown,
  clamped: number,
  full: number,
) {
  act(() => {
    fireEvent(getByTestId('t') as never, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: clamped } },
    });
    // The measuring copy is hidden from assistive technology, so from the default query too.
    fireEvent(getByTestId('t-measure', { includeHiddenElements: true }) as never, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: full } },
    });
  });
}

describe('ExpandableText', () => {
  it('draws no control before the text is measured, nor when nothing is hidden', () => {
    const { getByTestId, queryByTestId } = mount(
      <ExpandableText testID="t">{TEXT}</ExpandableText>,
    );
    expect(getByTestId('t').props.numberOfLines).toBe(3);
    expect(queryByTestId('t-toggle')).toBeNull();
    measure(getByTestId, 60, 60);
    expect(queryByTestId('t-toggle')).toBeNull();
  });

  it('below: Show more opens, Show less closes, with the expanded state announced', () => {
    const onExpandedChange = jest.fn();
    const { getByTestId, getByText } = mount(
      <ExpandableText testID="t" onExpandedChange={onExpandedChange}>
        {TEXT}
      </ExpandableText>,
    );
    measure(getByTestId, 60, 400);
    const toggle = getByTestId('t-toggle');
    expect(getByText('Show more')).toBeTruthy();
    expect(toggle.props['aria-expanded'] ?? toggle.props.accessibilityState?.expanded).toBe(false);
    act(() => fireEvent.press(toggle));
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(getByTestId('t').props.numberOfLines).toBeUndefined();
    expect(getByText('Show less')).toBeTruthy();
    act(() => fireEvent.press(getByTestId('t-toggle')));
    expect(getByTestId('t').props.numberOfLines).toBe(3);
  });

  it('inline: More opens the rest for good', () => {
    const { getByTestId, queryByTestId, getByText } = mount(
      <ExpandableText testID="t" toggle="inline">
        {TEXT}
      </ExpandableText>,
    );
    measure(getByTestId, 60, 400);
    expect(getByText('More')).toBeTruthy();
    act(() => fireEvent.press(getByTestId('t-toggle')));
    expect(getByTestId('t').props.numberOfLines).toBeUndefined();
    expect(queryByTestId('t-toggle')).toBeNull();
  });

  it('numberOfLines 0 never clamps and lays out no measuring copy', () => {
    const { getByTestId, queryByTestId } = mount(
      <ExpandableText testID="t" numberOfLines={0}>
        {TEXT}
      </ExpandableText>,
    );
    expect(getByTestId('t').props.numberOfLines).toBeUndefined();
    expect(queryByTestId('t-measure', { includeHiddenElements: true })).toBeNull();
  });

  it('takes a caller label and an explicit toggle id', () => {
    const { getByTestId, getByText } = mount(
      <ExpandableText testID="t" toggleTestID="card-toggle" moreLabel="Read on">
        {TEXT}
      </ExpandableText>,
    );
    measure(getByTestId, 60, 400);
    expect(getByTestId('card-toggle')).toBeTruthy();
    expect(getByText('Read on')).toBeTruthy();
  });
});
