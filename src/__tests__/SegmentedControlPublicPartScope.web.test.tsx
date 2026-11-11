/** @jest-environment jsdom */
import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope, type BloomSize } from '../appearance';
import { Portal } from '../portal/Portal.web';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ explicit }: { explicit?: boolean }) {
  return (
    <SegmentedControl
      label="View"
      type="radio"
      value="list"
      size={explicit ? 'lg' : undefined}
      testID="segmented-control"
    >
      <SegmentedControlItem value="list">
        <SegmentedControlItemText>List</SegmentedControlItemText>
      </SegmentedControlItem>
      <SegmentedControlItem value="grid">
        <SegmentedControlItemText>Grid</SegmentedControlItemText>
      </SegmentedControlItem>
    </SegmentedControl>
  );
}

function Tree({
  scopes,
  explicit = false,
  portalled = false,
  omittedNestedScope = false,
}: {
  scopes: BloomSize[];
  explicit?: boolean;
  portalled?: boolean;
  omittedNestedScope?: boolean;
}) {
  const subject = <Subject explicit={explicit} />;
  const wrapped = <View>{portalled ? <Portal>{subject}</Portal> : subject}</View>;
  const base = omittedNestedScope ? <BloomScope>{wrapped}</BloomScope> : wrapped;
  const inScopes = (index: number): ReactNode => {
    const size = scopes[index];
    return size === undefined ? (
      base
    ) : (
      <BloomScope key={`${index}-${size}`} size={size}>
        {inScopes(index + 1)}
      </BloomScope>
    );
  };
  return <BloomThemeProvider fonts={false}>{inScopes(0)}</BloomThemeProvider>;
}

it.each([
  { name: 'default md', scopes: [], expected: 36 },
  { name: 'nearest xs', scopes: ['xs'], expected: 28 },
  { name: 'nested lg over xs', scopes: ['xs', 'lg'], expected: 44 },
  {
    name: 'actual portal with wrappers',
    scopes: ['sm'],
    portalled: true,
    omittedNestedScope: true,
    expected: 32,
  },
  { name: 'explicit lg overrides xs', scopes: ['xs'], explicit: true, expected: 44 },
] as const)(
  '$name resolves SegmentedControl geometry in DOM web',
  ({ scopes, explicit, portalled, omittedNestedScope, expected }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          <Tree
            scopes={[...scopes]}
            explicit={explicit}
            portalled={portalled}
            omittedNestedScope={omittedNestedScope}
          />,
        ),
      );
      const control = document.body.querySelector<HTMLElement>('[data-testid="segmented-control"]');
      if (!control) throw new Error('Missing rendered SegmentedControl');
      expect(Number.parseFloat(getComputedStyle(control).height)).toBe(expected);
    } finally {
      act(() => root.unmount());
      host.remove();
      document.getElementById('bloom-portal-root')?.remove();
    }
  },
);
