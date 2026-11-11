/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Button } from '../button/Button.web';
import { ConnectionDots } from '../connection-dots/ConnectionDots.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Scenario = {
  name: string;
  outerSize?: BloomSize;
  nestedLeftSize?: BloomSize;
  leftButtonSize?: BloomSize;
  dotSize?: number;
  dotCount?: number;
  leftHeight: string;
  rightHeight: string;
  dotDiameter: string;
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
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
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
    leftHeight: '36px',
    rightHeight: '36px',
    dotDiameter: '6px',
    dots: 6,
  },
  {
    name: 'nearest xs scope',
    outerSize: 'xs',
    leftHeight: '24px',
    rightHeight: '24px',
    dotDiameter: '6px',
    dots: 6,
  },
  {
    name: 'nested lg endpoint and explicit artwork dimensions',
    outerSize: 'xs',
    nestedLeftSize: 'lg',
    dotSize: 9,
    dotCount: 3,
    leftHeight: '44px',
    rightHeight: '24px',
    dotDiameter: '9px',
    dots: 3,
  },
  {
    name: 'explicit endpoint size over nearest xs',
    outerSize: 'xs',
    leftButtonSize: 'lg',
    leftHeight: '44px',
    rightHeight: '24px',
    dotDiameter: '6px',
    dots: 6,
  },
];

it.each(cases)('preserves caller endpoint scopes and $name', (scenario) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<Subject {...scenario} />));
    const left = host.querySelector<HTMLElement>('[data-testid="left-endpoint"]');
    const right = host.querySelector<HTMLElement>('[data-testid="right-endpoint"]');
    if (!left || !right) throw new Error('ConnectionDots endpoints did not render');
    expect(getComputedStyle(left).height).toBe(scenario.leftHeight);
    expect(getComputedStyle(right).height).toBe(scenario.rightHeight);

    const dots = Array.from(host.querySelectorAll<HTMLElement>('[data-bloom-connection-dot]'));
    expect(dots).toHaveLength(scenario.dots);
    expect(dots.map((dot) => getComputedStyle(dot).width)).toEqual(
      Array(scenario.dots).fill(scenario.dotDiameter),
    );
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
