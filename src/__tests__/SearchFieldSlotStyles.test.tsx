import React from 'react';
import { View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Search } from '../search';
import { resolvedStyle } from './support/rendered-style';
const CHROME = {
  borderWidth: 1,
  borderColor: '#abcdef',
  borderRadius: 14,
  backgroundColor: '#eef0f1',
};
const field = (disabled = false, invalid = false) => (
  <BloomThemeProvider>
    <Search
      label="Find"
      value="query"
      disabled={disabled}
      invalid={invalid}
      containerStyle={{ width: 360, marginTop: 8 }}
      fieldStyle={{ height: 44, paddingLeft: 12, paddingRight: 12 }}
      fieldChromeStyle={CHROME}
    />
  </BloomThemeProvider>
);
it('puts container, layout and surface styles on distinct native hosts', () => {
  const api = render(field());
  const views = api.UNSAFE_getAllByType(View).map((node) => resolvedStyle(node.props.style));
  expect(views.some((s) => s.width === 360 && s.marginTop === 8)).toBe(true);
  expect(views.some((s) => s.height === 44 && s.paddingLeft === 12 && s.paddingRight === 12)).toBe(
    true,
  );
  expect(
    views.some(
      (s) =>
        s.position === 'absolute' &&
        s.borderWidth === 1 &&
        s.borderRadius === 14 &&
        s.backgroundColor === '#eef0f1',
    ),
  ).toBe(true);
  expect(api.getByLabelText('Find').props.value).toBe('query');
});
it('preserves focus, invalid and disabled state paint over the resting surface recipe', () => {
  const api = render(field());
  const chrome = () =>
    api
      .UNSAFE_getAllByType(View)
      .map((node) => resolvedStyle(node.props.style))
      .find((s) => s.position === 'absolute' && s.borderRadius === 14)!;
  expect(chrome().borderColor).toBe('#abcdef');
  fireEvent(api.getByLabelText('Find'), 'focus', {});
  expect(chrome().borderColor).not.toBe('#abcdef');
  api.rerender(field(true));
  expect(chrome().backgroundColor).not.toBe('#eef0f1');
  expect(api.getByLabelText('Find').props.editable).toBe(false);
  api.rerender(field(false, true));
  expect(chrome().backgroundColor).not.toBe('#eef0f1');
  expect(api.getByLabelText('Find').props['aria-invalid']).toBe(true);
});
