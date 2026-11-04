import React from 'react';
import { act, render } from '@testing-library/react-native';

import { RiDeleteBin6Line } from '../icons/remix';
import { RowActions } from '../row-actions';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { pressHost } from './support/press-host';

it('names a button by its fuller label, forwards its press, and names the row menu', () => {
  const onDelete = jest.fn();
  const { getByLabelText, queryByLabelText } = render(
    <BloomThemeProvider mode="light" colorPreset="blue">
      <RowActions
        name="Invoice.pdf"
        actions={[
          {
            icon: RiDeleteBin6Line,
            label: 'Delete file',
            accessibilityLabel: 'Delete Invoice.pdf',
            onPress: onDelete,
          },
        ]}
        menu={[{ label: 'Rename' }]}
        menuAppearance="outline"
      />
    </BloomThemeProvider>,
  );
  expect(queryByLabelText('Delete file')).toBeNull();
  act(() => pressHost(getByLabelText('Delete Invoice.pdf')));
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(getByLabelText('More actions for Invoice.pdf')).toBeTruthy();
});
