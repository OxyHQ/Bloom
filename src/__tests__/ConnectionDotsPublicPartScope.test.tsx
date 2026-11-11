import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Button } from '../button';
import { ConnectionDots } from '../connection-dots';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { hostNodes, resolvedStyle } from './support/rendered-style';

type Scenario = {
  name: string;
  outerSize?: BloomSize;
  nestedLeftSize?: BloomSize;
  leftButtonSize?: BloomSize;
  dotSize?: number;
  dotCount?: number;
  leftHeight: number;
  rightHeight: number;
  dotDiameter: number;
  dots: number;
};

function Subject({
  outerSize,
  nestedLeftSize,
  leftButtonSize,
  dotSize,
  dotCount,
}: Omit<Scenario, 'name' | 'leftHeight' | 'rightHeight' | 'dotDiameter' | 'dots'>) {
  const left = (
    <Button testID="left-endpoint" size={leftButtonSize}>
      <Text>Left</Text>
    </Button>
  );
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size={outerSize}>
        <ConnectionDots
          left={nestedLeftSize ? <BloomScope size={nestedLeftSize}>{left}</BloomScope> : left}
          right={
            <Button testID="right-endpoint">
              <Text>Right</Text>
            </Button>
          }
          dotSize={dotSize}
          dotCount={dotCount}
          reducedMotion
        />
      </BloomScope>
    </BloomThemeProvider>
  );
}

const cases: Scenario[] = [
  {
    name: 'default md controls',
    leftHeight: 36,
    rightHeight: 36,
    dotDiameter: 6,
    dots: 6,
  },
  {
    name: 'nearest xs scope',
    outerSize: 'xs',
    leftHeight: 24,
    rightHeight: 24,
    dotDiameter: 6,
    dots: 6,
  },
  {
    name: 'nested lg endpoint and explicit artwork dimensions',
    outerSize: 'xs',
    nestedLeftSize: 'lg',
    dotSize: 9,
    dotCount: 3,
    leftHeight: 44,
    rightHeight: 24,
    dotDiameter: 9,
    dots: 3,
  },
  {
    name: 'explicit endpoint size over nearest xs',
    outerSize: 'xs',
    leftButtonSize: 'lg',
    leftHeight: 44,
    rightHeight: 24,
    dotDiameter: 6,
    dots: 6,
  },
];

it.each(cases)('preserves caller endpoint scopes and $name', (scenario) => {
  const screen = render(<Subject {...scenario} />);
  expect(resolvedStyle(screen.getByTestId('left-endpoint').props.style).height).toBe(
    scenario.leftHeight,
  );
  expect(resolvedStyle(screen.getByTestId('right-endpoint').props.style).height).toBe(
    scenario.rightHeight,
  );

  const dots = hostNodes(screen.toJSON()).filter((node) => {
    const style = resolvedStyle(node.props.style);
    return (
      style.width === scenario.dotDiameter &&
      style.height === scenario.dotDiameter &&
      style.borderRadius === scenario.dotDiameter / 2
    );
  });
  expect(dots).toHaveLength(scenario.dots);
});
