import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { BloomScope, type BloomSize } from '../appearance';
import { Checkbox, CheckboxCard } from '../checkbox';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { Switch } from '../switch';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { findHost, hostNodes, resolvedStyle } from './support/rendered-style';

function Subjects({ explicit }: { explicit?: boolean }) {
  const size = explicit ? 'lg' : undefined;
  return (
    <>
      <Checkbox label="Accept terms" checked size={size} testID="checkbox" />
      <CheckboxCard title="Weekly digest" checked testID="checkbox-card" />
      <Switch accessibilityLabel="Notifications" checked size={size} testID="switch" />
    </>
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
  const subjects = <Subjects explicit={explicit} />;
  const wrapped = <View>{portalled ? <Portal>{subjects}</Portal> : subjects}</View>;
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

function readGeometry(tree: unknown) {
  const stylesFor = (testID: string) => {
    const host = findHost(tree as never, testID);
    if (!host) throw new Error(`Missing rendered part ${testID}`);
    return hostNodes(host).map((node) => resolvedStyle(node.props.style));
  };
  const checkboxSize = stylesFor('checkbox').find(
    (style) => typeof style.width === 'number' && style.width === style.height,
  )?.width;
  const checkboxCardBox = stylesFor('checkbox-card').find(
    (style) => typeof style.width === 'number' && style.width === 16 && style.height === 16,
  )?.width;
  const track = stylesFor('switch').find(
    (style) =>
      typeof style.width === 'number' &&
      style.width >= 30 &&
      typeof style.height === 'number' &&
      style.height >= 18,
  );
  if (checkboxSize === undefined || checkboxCardBox === undefined || !track)
    throw new Error('Missing control geometry');
  return {
    checkbox: checkboxSize,
    checkboxCard: checkboxCardBox,
    switch: [track.width, track.height],
  };
}

it.each([
  { name: 'default', scopes: [], expected: { checkbox: 16, checkboxCard: 16, switch: [44, 26] } },
  {
    name: 'nearest xs',
    scopes: ['xs'],
    expected: { checkbox: 12, checkboxCard: 16, switch: [30, 18] },
  },
  {
    name: 'nested lg over xs',
    scopes: ['xs', 'lg'],
    expected: { checkbox: 20, checkboxCard: 16, switch: [52, 30] },
  },
  {
    name: 'actual portal with wrappers',
    scopes: ['sm'],
    portalled: true,
    omittedNestedScope: true,
    expected: { checkbox: 14, checkboxCard: 16, switch: [36, 22] },
  },
  {
    name: 'explicit lg overrides xs',
    scopes: ['xs'],
    explicit: true,
    expected: { checkbox: 20, checkboxCard: 16, switch: [52, 30] },
  },
] as const)(
  '$name is resolved by Checkbox and Switch',
  ({ scopes, explicit, portalled, omittedNestedScope, expected }) => {
    const screen = render(
      <Tree
        scopes={[...scopes]}
        explicit={explicit}
        portalled={portalled}
        omittedNestedScope={omittedNestedScope}
      />,
    );
    expect(readGeometry(screen.toJSON())).toEqual(expected);
    screen.unmount();
  },
);
