import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { BloomScope, type BloomSize } from '../appearance';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { Radio, RadioChip, RadioGroup, RadioSwatch } from '../radio';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { findHost, hostNodes, resolvedStyle } from './support/rendered-style';

function Subjects({ explicit }: { explicit?: boolean }) {
  const size = explicit ? 'lg' : undefined;
  return (
    <>
      <Radio value="a" label="Radio" checked size={size} testID="radio" />
      <RadioGroup
        label="Radio group"
        options={[{ value: 'a', label: 'Group radio', testID: 'group-radio' }]}
        size={size}
      />
      <RadioGroup
        label="Chip group"
        options={[{ value: 'a', label: 'Group chip', testID: 'group-chip' }]}
        size={size}
        variant="chip"
      />
      <RadioGroup
        label="Swatch group"
        options={[{ value: 'a', label: 'Group swatch', testID: 'group-swatch' }]}
        size={size}
        variant="swatch"
      />
      <RadioChip value="a" label="Chip" checked size={size} testID="chip" />
      <RadioSwatch value="a" label="Swatch" color="#3267EA" checked size={size} testID="swatch" />
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
  const styleFor = (testID: string) => {
    const host = findHost(tree as never, testID);
    if (!host) throw new Error(`Missing rendered part ${testID}`);
    return hostNodes(host).map((node) => resolvedStyle(node.props.style));
  };
  const indicatorSize = (testID: string) => {
    const styles = styleFor(testID);
    const indicator = styles.find(
      (style) => typeof style.width === 'number' && style.width === style.height,
    );
    if (!indicator) throw new Error(`Missing radio indicator geometry for ${testID}`);
    return indicator.width;
  };
  return {
    radio: indicatorSize('radio'),
    group: indicatorSize('group-radio'),
    groupChip: styleFor('group-chip')[0]?.minHeight,
    groupSwatch: styleFor('group-swatch')[0]?.width,
    chip: styleFor('chip')[0]?.minHeight,
    swatch: styleFor('swatch')[0]?.width,
  };
}

it.each([
  {
    name: 'default',
    scopes: [],
    expected: { radio: 16, group: 16, groupChip: 40, groupSwatch: 22, chip: 40, swatch: 22 },
  },
  {
    name: 'nearest xs',
    scopes: ['xs'],
    expected: { radio: 12, group: 12, groupChip: 32, groupSwatch: 16, chip: 32, swatch: 16 },
  },
  {
    name: 'nested lg over xs',
    scopes: ['xs', 'lg'],
    expected: { radio: 20, group: 20, groupChip: 44, groupSwatch: 26, chip: 44, swatch: 26 },
  },
  {
    name: 'actual portal with wrappers',
    scopes: ['sm'],
    portalled: true,
    omittedNestedScope: true,
    expected: { radio: 14, group: 14, groupChip: 36, groupSwatch: 18, chip: 36, swatch: 18 },
  },
  {
    name: 'explicit lg overrides xs',
    scopes: ['xs'],
    explicit: true,
    expected: { radio: 20, group: 20, groupChip: 44, groupSwatch: 26, chip: 44, swatch: 26 },
  },
] as const)(
  '$name is resolved by each radio public part',
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
