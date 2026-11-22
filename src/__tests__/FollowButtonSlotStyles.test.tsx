import React from 'react';
import { View, Text as RNText } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { FollowButton } from '../media-header';
import { resolvedStyle } from './support/rendered-style';
it('puts its styles on the Button and every animated/measuring label, preserving loading content', () => {
  const change = jest.fn();
  const ui = (loading = false) => (
    <BloomThemeProvider>
      <FollowButton
        following={false}
        onFollowChange={change}
        material="flat"
        appearance="outline"
        style={{
          height: 40,
          paddingLeft: 16,
          paddingRight: 16,
          backgroundColor: '#eef0f1',
          borderRadius: 20,
        }}
        textStyle={{ fontSize: 16, fontWeight: '600', color: '#123456' }}
        loading={loading}
        testID="follow"
      />
    </BloomThemeProvider>
  );
  const api = render(ui());
  expect(resolvedStyle(api.getByTestId('follow').props.style)).toMatchObject({
    height: 40,
    paddingLeft: 16,
    backgroundColor: '#eef0f1',
    borderRadius: 20,
  });
  const labels = () =>
    api
      .UNSAFE_getAllByType(RNText)
      .filter((node) => node.props.children === 'Follow' || node.props.children === 'Following');
  expect(labels()).toHaveLength(4);
  for (const label of labels())
    expect(resolvedStyle(label.props.style)).toMatchObject({
      fontSize: 16,
      fontWeight: '600',
      color: '#123456',
    });
  const before = labels();
  api.rerender(ui(true));
  expect(labels()).toEqual(before);
  expect(api.getByTestId('follow').props.disabled).toBe(true);
  expect(api.getByTestId('follow').props.onPress).toBeUndefined();
  expect(change).not.toHaveBeenCalled();
  api.rerender(ui());
  fireEvent.press(api.getByTestId('follow'), { stopPropagation: jest.fn() });
  expect(change).toHaveBeenCalledWith(true);
  expect(api.UNSAFE_getAllByType(View).length).toBeGreaterThan(0);
});
