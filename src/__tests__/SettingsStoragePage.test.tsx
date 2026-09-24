import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SettingsStoragePage } from '../settings-modal';

const FILES = [
  { id: 'a', name: 'Invoice', kind: 'document', uploadedOn: 'Jan 1, 2026', uploadedAt: 1, size: 1024 },
];

function renderPage(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light" colorPreset="teal">{ui}</BloomThemeProvider>);
}

describe('SettingsStoragePage', () => {
  it('drops the dropzone for a read-only store, and keeps the table', () => {
    const { queryByTestId } = renderPage(<SettingsStoragePage testID="storage" files={FILES} upload={false} />);
    expect(queryByTestId('storage-dropzone')).toBeNull();
    expect(queryByTestId('storage-table')).not.toBeNull();
  });
});
