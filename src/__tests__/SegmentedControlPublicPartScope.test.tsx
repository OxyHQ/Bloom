import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { BloomScope, type BloomSize } from '../appearance';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { findHost, resolvedStyle } from './support/rendered-style';

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
  return (
    <BloomThemeProvider mode="light">
      <PortalProvider>
        {inScopes(0)}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
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
  '$name resolves SegmentedControl geometry',
  ({ scopes, explicit, portalled, omittedNestedScope, expected }) => {
    const screen = render(
      <Tree
        scopes={[...scopes]}
        explicit={explicit}
        portalled={portalled}
        omittedNestedScope={omittedNestedScope}
      />,
    );
    const control = findHost(screen.toJSON() as never, 'segmented-control');
    if (!control) throw new Error('Missing rendered SegmentedControl');
    expect(resolvedStyle(control.props.style).height).toBe(expected);
    screen.unmount();
  },
);
