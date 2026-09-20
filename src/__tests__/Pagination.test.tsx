import React from 'react';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Pagination, paginationRange } from '../pagination';
import { borderRadius } from '../styles/tokens';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('paginationRange', () => {
  it('shows every page when they fit', () => {
    expect(paginationRange(2, 4, 1)).toEqual([1, 2, 3, 4]);
    expect(paginationRange(1, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses runs around the current page, keeping first and last', () => {
    expect(paginationRange(1, 10, 1)).toEqual([1, 2, 3, 4, 5, 'dots', 10]);
    expect(paginationRange(5, 10, 1)).toEqual([1, 'dots', 4, 5, 6, 'dots', 10]);
    expect(paginationRange(10, 10, 1)).toEqual([1, 'dots', 6, 7, 8, 9, 10]);
    expect(paginationRange(5, 10, 0)).toEqual([1, 'dots', 5, 'dots', 10]);
  });
});

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { queryByTestId } = renderWithTheme(
      <Pagination page={1} totalPages={1} onChange={() => {}} testID="p" />,
    );
    expect(queryByTestId('p')).toBeNull();
  });

  it('is a named landmark whose pages are named buttons', () => {
    const onChange = jest.fn();
    const { getByTestId, getByLabelText } = renderWithTheme(
      <Pagination page={5} totalPages={10} onChange={onChange} testID="p" />,
    );
    expect(getByTestId('p').props.role).toBe('navigation');
    expect(getByLabelText('Pagination')).toBeTruthy();
    const six = getByLabelText('Go to page 6');
    expect(six.props.role).toBe('button');
    pressHost(six);
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('marks the current page selected and paints it as the bordered, shadowed cell', () => {
    const { getByLabelText } = renderWithTheme(
      <Pagination page={5} totalPages={10} onChange={() => {}} />,
    );
    const current = getByLabelText('Go to page 5');
    const other = getByLabelText('Go to page 4');
    expect(current.props.accessibilityState).toMatchObject({ selected: true });
    expect(other.props.accessibilityState).toMatchObject({ selected: false });
    const style = resolvedStyle(current.props.style);
    expect(style).toMatchObject({ width: 32, height: 32, borderWidth: 1, borderRadius: borderRadius.full });
    expect(style.boxShadow).toBeTruthy();
    expect(resolvedStyle(other.props.style).borderWidth).toBeUndefined();
    expect(resolvedStyle(other.props.style).backgroundColor).toBe('transparent');
  });

  it('steps with small plain Previous / Next buttons, each disabled at its end', () => {
    const buttons = (page: number, onChange = jest.fn()) => {
      const { UNSAFE_root } = renderWithTheme(
        <Pagination page={page} totalPages={3} onChange={onChange} />,
      );
      // The outermost element `Pagination` rendered with Button's props.
      const find = (label: string) =>
        UNSAFE_root.find((node) => node.props.appearance === 'plain' && node.props.tone === 'neutral' && node.props.children === label).props;
      return { previous: find('Previous'), next: find('Next'), onChange };
    };
    const first = buttons(1);
    expect(first.previous).toMatchObject({ appearance: 'plain', tone: 'neutral', size: 'sm', disabled: true, children: 'Previous' });
    expect(first.next).toMatchObject({ disabled: false, children: 'Next' });
    expect(buttons(3).next.disabled).toBe(true);

    const middle = buttons(2);
    act(() => middle.next.onPress());
    act(() => middle.previous.onPress());
    expect(middle.onChange.mock.calls).toEqual([[3], [1]]);
  });

  it('goes compact below 420px: icon-only named Previous/Next and no siblings', () => {
    const { getByTestId, getByLabelText, queryByText, queryByLabelText } = renderWithTheme(
      <Pagination page={5} totalPages={10} onChange={() => {}} testID="p" />,
    );
    expect(queryByLabelText('Go to page 4')).toBeTruthy();
    act(() => {
      getByTestId('p').props.onLayout({ nativeEvent: { layout: { width: 360, height: 32, x: 0, y: 0 } } });
    });
    expect(queryByText('Previous')).toBeNull();
    expect(getByLabelText('Previous')).toBeTruthy();
    expect(getByLabelText('Next')).toBeTruthy();
    expect(queryByLabelText('Go to page 4')).toBeNull();
  });
});
