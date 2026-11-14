/** @jest-environment jsdom */
import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope, type BloomSize } from '../appearance';
import { Portal } from '../portal/Portal.web';
import { Rating, RatingInput } from '../rating';
import { Stepper, StepperRow } from '../stepper';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
  return <BloomThemeProvider fonts={false}>{inScopes(0)}</BloomThemeProvider>;
}

function measure() {
  const element = (testID: string) => {
    const node = document.body.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
    if (!node) throw new Error(`Missing rendered part ${testID}`);
    return node;
  };
  const squareSize = (testID: string, minimum: number) => {
    const star = Array.from(element(testID).querySelectorAll<HTMLElement>('*')).find((node) => {
      const style = getComputedStyle(node);
      const width = Number.parseFloat(node.getAttribute('width') ?? style.width);
      const height = Number.parseFloat(node.getAttribute('height') ?? style.height);
      return Number.isFinite(width) && width === height && width >= minimum;
    });
    if (!star) throw new Error(`Missing star geometry for ${testID}`);
    return Number.parseFloat(star.getAttribute('width') ?? getComputedStyle(star).width);
  };
  const buttonHeight = (testID: string) => {
    const style = getComputedStyle(element(testID));
    const height = Number.parseFloat(style.height);
    if (![32, 36].includes(height)) throw new Error(`Unexpected stepper button height ${height}`);
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
  '$name resolves on Rating, RatingInput, Stepper and StepperRow in DOM web',
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
      expect(measure()).toEqual(expected);
    } finally {
      act(() => root.unmount());
      host.remove();
      document.getElementById('bloom-portal-root')?.remove();
    }
  },
);
