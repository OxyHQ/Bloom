import React from 'react';
import { Text } from 'react-native';
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
