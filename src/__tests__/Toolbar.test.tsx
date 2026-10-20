import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { BloomScope } from '../appearance';
import { render, fireEvent } from '@testing-library/react-native';
import { Toolbar, ScrollArea } from '../layout';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

it('keeps primary actions and summaries outside the tools scroller', () => {
  const create = jest.fn();
  const view = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Toolbar
        actions={<Button onPress={create}>Create</Button>}
        accessory={<Text>12 records</Text>}
      >
        <Text>Filters</Text>
        <Text>Sort</Text>
      </Toolbar>
    </BloomThemeProvider>,
  );
  const scroller = view.UNSAFE_getByType(ScrollArea);
  expect(scroller.props.horizontal).toBe(true);
  expect(scroller.findAll((node) => node.props.children === 'Filters')).not.toHaveLength(0);
  expect(scroller.findAll((node) => node.props.children === 'Create')).toHaveLength(0);
  expect(scroller.findAll((node) => node.props.children === '12 records')).toHaveLength(0);
  fireEvent.press(view.getByText('Create'));
  expect(create).toHaveBeenCalledTimes(1);
});

it('inherits app spacing, applies local size to its subtree, and preserves caller overrides', () => {
  const view = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size="lg">
        <Toolbar testID="inherited">
          <Text>Inherited</Text>
        </Toolbar>
        <Toolbar size="xs" testID="explicit" style={{ paddingLeft: 20 }}>
          <Text>Explicit</Text>
        </Toolbar>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(StyleSheet.flatten(view.getByTestId('inherited').props.style)).toMatchObject({
    paddingLeft: 12,
    gap: 6,
  });
  expect(StyleSheet.flatten(view.getByTestId('explicit').props.style)).toMatchObject({
    paddingLeft: 20,
    paddingRight: 4,
    gap: 2,
  });
  expect(
    view.UNSAFE_getAllByType(ScrollArea).map((node) => node.props.contentContainerStyle.gap),
  ).toEqual([12, 4]);
});
