import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { BloomScope, type BloomSize } from '../appearance';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { Rating, RatingInput } from '../rating';
import { Stepper, StepperRow } from '../stepper';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { findHost, hostNodes, resolvedStyle } from './support/rendered-style';

function Subjects({ explicit }: { explicit?: boolean }) {
  return (
    <>
      <Rating value={4} size={explicit ? 'md' : undefined} testID="rating" />
      <RatingInput
        value={3}
        onChange={() => {}}
        size={explicit ? 'lg' : undefined}
        testID="rating-input"
      />
      <Stepper
        value={2}
        onValueChange={() => {}}
        accessibilityLabel="Quantity"
        size={explicit ? 'md' : undefined}
        testID="stepper"
      />
      <StepperRow
        title="Guests"
        value={2}
        onValueChange={() => {}}
        size={explicit ? 'md' : undefined}
        testID="stepper-row"
      />
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
    return hostNodes(host).map((node) => ({
      ...resolvedStyle(node.props.style),
      width:
        typeof node.props.width === 'number'
          ? node.props.width
          : resolvedStyle(node.props.style).width,
      height:
        typeof node.props.height === 'number'
          ? node.props.height
          : resolvedStyle(node.props.style).height,
    }));
  };
  const squareSize = (testID: string, minimum: number) => {
    const width = stylesFor(testID).find(
      (style) =>
        typeof style.width === 'number' && style.width === style.height && style.width >= minimum,
    )?.width;
    if (typeof width !== 'number') throw new Error(`Missing star geometry for ${testID}`);
    return width;
  };
  const buttonHeight = (testID: string) => {
    const height = stylesFor(testID).find(
      (style) => typeof style.height === 'number' && [32, 36].includes(style.height),
    )?.height;
    if (typeof height !== 'number')
      throw new Error(`Missing stepper button geometry for ${testID}`);
    return height;
  };
  return {
    rating: squareSize('rating', 14),
    ratingInput: squareSize('rating-input-star-3', 24),
    stepper: buttonHeight('stepper-decrement'),
    stepperRow: buttonHeight('stepper-row-decrement'),
  };
}

it.each([
  {
    name: 'default md',
    scopes: [],
    expected: { rating: 16, ratingInput: 32, stepper: 36, stepperRow: 36 },
  },
  {
    name: 'nearest xs maps to compact rungs',
    scopes: ['xs'],
    expected: { rating: 14, ratingInput: 24, stepper: 32, stepperRow: 32 },
  },
  {
    name: 'nested lg over xs',
    scopes: ['xs', 'lg'],
    expected: { rating: 16, ratingInput: 40, stepper: 36, stepperRow: 36 },
  },
  {
    name: 'actual portal with wrappers',
    scopes: ['sm'],
    portalled: true,
    omittedNestedScope: true,
    expected: { rating: 14, ratingInput: 24, stepper: 32, stepperRow: 32 },
  },
  {
    name: 'explicit sizes override xs',
    scopes: ['xs'],
    explicit: true,
    expected: { rating: 16, ratingInput: 40, stepper: 36, stepperRow: 36 },
  },
] as const)(
  '$name resolves on Rating, RatingInput, Stepper and StepperRow',
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
