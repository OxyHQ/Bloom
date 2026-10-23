import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RiLinksLine } from '../icons/remix/RiLinksLine';
import { ShareSheet } from '../share-sheet';

/**
 * The sheet's contract with the app: a person's tile reports the person and is
 * named for what pressing it does, a target is its own press, and the people
 * section is hidden, loading, empty or populated from `people` alone.
 */

function mount(ui: React.ReactElement) {
  return render(<BloomThemeProvider>{ui}</BloomThemeProvider>);
}

it('reports the pressed person and the pressed target', () => {
  const onPersonPress = jest.fn();
  const onCopy = jest.fn();
  const { getByLabelText } = mount(
    <ShareSheet
      people={[{ id: 'u1', name: 'Ana' }]}
      onPersonPress={onPersonPress}
      targets={[{ key: 'copy', label: 'Copy link', icon: RiLinksLine, onPress: onCopy }]}
    />,
  );
  fireEvent.press(getByLabelText('Send to Ana'));
  fireEvent.press(getByLabelText('Copy link'));
  expect(onPersonPress).toHaveBeenCalledWith('u1');
  expect(onCopy).toHaveBeenCalledTimes(1);
});

it('derives the people section from `people`', () => {
  const sheet = (props: Partial<React.ComponentProps<typeof ShareSheet>>) => (
    <ShareSheet testID="s" {...props} />
  );
  const view = mount(sheet({}));
  expect(view.queryByTestId('s-people')).toBeNull();

  view.rerender(
    <BloomThemeProvider>{sheet({ people: [], peopleLoading: true })}</BloomThemeProvider>,
  );
  expect(view.getByTestId('s-people-loading')).toBeTruthy();

  view.rerender(<BloomThemeProvider>{sheet({ people: [] })}</BloomThemeProvider>);
  expect(view.getByTestId('s-people-empty')).toBeTruthy();

  // A list already shown stays while it refetches.
  view.rerender(
    <BloomThemeProvider>
      {sheet({ people: [{ id: 'u1', name: 'Ana' }], peopleLoading: true })}
    </BloomThemeProvider>,
  );
  expect(view.getByTestId('s-person-u1')).toBeTruthy();
  expect(view.queryByTestId('s-people-loading')).toBeNull();
});
