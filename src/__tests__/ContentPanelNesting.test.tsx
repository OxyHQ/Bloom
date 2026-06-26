import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ContentPanel } from '../content-panel';

// Jest resolves `../content-panel` to the native variant (`index.tsx`), which
// does not read the theme — so these render without a BloomThemeProvider. The
// nesting guard lives in the shared `nesting-context` module exercised by both
// variants.
describe('ContentPanel nesting guard', () => {
  it('renders a single (non-nested) panel', () => {
    const { getByText } = render(
      <ContentPanel framed>
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(getByText('content')).toBeTruthy();
  });

  it('renders side-by-side sibling panels without tripping the guard', () => {
    const { getByText } = render(
      <React.Fragment>
        <ContentPanel framed>
          <Text>left</Text>
        </ContentPanel>
        <ContentPanel framed>
          <Text>right</Text>
        </ContentPanel>
      </React.Fragment>,
    );
    expect(getByText('left')).toBeTruthy();
    expect(getByText('right')).toBeTruthy();
  });

  it('throws when a ContentPanel is nested inside another ContentPanel', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <ContentPanel framed>
          <ContentPanel framed>
            <Text>nested</Text>
          </ContentPanel>
        </ContentPanel>,
      ),
    ).toThrow(
      'ContentPanel cannot be nested inside another ContentPanel. ' +
        'Render panels as siblings (e.g. side-by-side columns), not nested.',
    );
    consoleError.mockRestore();
  });
});
