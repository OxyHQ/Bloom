import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ContentPanel } from '../content-panel';
import { classNamesOn } from './support/rendered-style';

/**
 * The classes the outer surface node received.
 *
 * They arrive INSIDE `style`, not as a `className` prop: the panel wires them
 * through Bloom's own `styled()`, and react-native-css merges each class in as a
 * `{ $$css: true, className }` descriptor. Reading `props.className` — what this
 * used to do — reads the prop as WRITTEN rather than as interpreted, which is
 * exactly the difference between a class that resolves to a style and one that
 * sits inert on an element react-native never looks at.
 */
function surfaceClassName(node: ReturnType<typeof render>): string {
  const json = node.toJSON();
  const el = Array.isArray(json) ? json[0] : json;
  return classNamesOn(el?.props?.style).join(' ');
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

// The responsive framing breakpoint is configurable via `framedFrom` and is
// resolved entirely with literal NativeWind classes. These assert the native
// surface picks up the pre-shipped literal bundle for each breakpoint value.
describe('ContentPanel framedFrom breakpoint', () => {
  it('defaults to the md (768) named-screen bundle when omitted', () => {
    const className = surfaceClassName(
      render(
        <ContentPanel>
          <Text>content</Text>
        </ContentPanel>,
      ),
    );
    expect(className).toContain('md:rounded-radius-28');
    expect(className).toContain('md:border');
    expect(className).not.toContain('min-[500px]:');
  });

  it('uses the arbitrary min-[500px] bundle for framedFrom={500}', () => {
    const className = surfaceClassName(
      render(
        <ContentPanel framedFrom={500}>
          <Text>content</Text>
        </ContentPanel>,
      ),
    );
    expect(className).toContain('min-[500px]:rounded-radius-28');
    expect(className).toContain('min-[500px]:border');
    expect(className).not.toContain('md:');
  });

  it('uses named sm (640) and lg (1024) bundles', () => {
    expect(
      surfaceClassName(
        render(
          <ContentPanel framedFrom={640}>
            <Text>content</Text>
          </ContentPanel>,
        ),
      ),
    ).toContain('sm:rounded-radius-28');
    expect(
      surfaceClassName(
        render(
          <ContentPanel framedFrom={1024}>
            <Text>content</Text>
          </ContentPanel>,
        ),
      ),
    ).toContain('lg:rounded-radius-28');
  });

  it('ignores framedFrom when framed is explicitly true (always framed)', () => {
    const className = surfaceClassName(
      render(
        <ContentPanel framed framedFrom={500}>
          <Text>content</Text>
        </ContentPanel>,
      ),
    );
    // Always-framed uses unconditional (non-breakpoint) rounding + border.
    expect(className).toContain('rounded-radius-28');
    expect(className).not.toContain('min-[500px]:');
    expect(className).not.toContain('md:');
  });
});
