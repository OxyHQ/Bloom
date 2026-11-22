import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ContentPanel } from '../content-panel';
import { resolvedStyle } from './support/rendered-style';
import { mockWindowSize } from './support/window-size';

/** The style the outer surface node received. */
function surfaceStyle(node: ReturnType<typeof render>): Record<string, unknown> {
  const json = node.toJSON();
  const el = Array.isArray(json) ? json[0] : json;
  return resolvedStyle(el?.props?.style);
}

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

// The responsive framing breakpoint is configurable via `framedFrom`: the
// native surface draws its hairline once the window is at least that wide. The
// test window is 375 wide.
describe('ContentPanel framedFrom breakpoint', () => {
  const panel = (props: React.ComponentProps<typeof ContentPanel>) =>
    surfaceStyle(
      render(
        <ContentPanel {...props}>
          <Text>content</Text>
        </ContentPanel>,
      ),
    );

  it('frames from md (768) when omitted, so a phone window is unframed', () => {
    expect(panel({}).borderWidth).toBeUndefined();
  });

  it('frames at and above framedFrom', () => {
    expect(panel({ framedFrom: 500 }).borderWidth).toBeUndefined();
    const wide = mockWindowSize({ width: 500, height: 900 });
    expect(panel({ framedFrom: 500 })).toMatchObject({ borderWidth: 1, borderStyle: 'solid' });
    expect(panel({ framedFrom: 640 }).borderWidth).toBeUndefined();
    wide.mockRestore();
  });

  it('ignores framedFrom when framed is explicitly true (always framed)', () => {
    expect(panel({ framed: true, framedFrom: 500 })).toMatchObject({ borderWidth: 1 });
  });

  it('never frames when framed is false', () => {
    expect(panel({ framed: false, framedFrom: 500 }).borderWidth).toBeUndefined();
  });
});
