import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EdgeScrim } from '../page-header/EdgeScrim';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { TYPE_SCALE } from '../typography/scale';
import { fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SubscriptionPlans } from '../subscription-plans';
import type { SubscriptionPlan } from '../subscription-plans';
import { Button } from '../button';

const plans: SubscriptionPlan[] = [
  {
    id: 'basic',
    label: 'Basic',
    price: '€4 / month',
    subtitle: 'For everyday use',
    benefits: [
      {
        id: 'space',
        title: 'More space',
        description: 'Keep your files together',
        icon: <View testID="benefit-icon" />,
      },
    ],
  },
  {
    id: 'plus',
    label: 'Plus',
    price: '€9 / month',
    benefits: [{ id: 'help', title: 'Priority help' }],
  },
];
function wrap(ui: React.ReactNode) {
  return render(<BloomThemeProvider>{ui}</BloomThemeProvider>);
}

it('selects plans through the controlled API and updates the displayed benefits and price', () => {
  const onChange = jest.fn();
  const props = {
    productName: 'Example',
    plans,
    selectorLabel: 'Choose a plan',
    onValueChange: onChange,
  };
  const screen = wrap(<SubscriptionPlans {...props} value="basic" />);
  expect(screen.getByText('€4 / month')).toBeTruthy();
  expect(screen.getByText('More space')).toBeTruthy();
  fireEvent.press(screen.getByText('Plus'));
  expect(onChange).toHaveBeenCalledWith('plus');
  expect(screen.getByText('More space')).toBeTruthy();
  screen.rerender(
    <BloomThemeProvider>
      <SubscriptionPlans {...props} value="plus" />
    </BloomThemeProvider>,
  );
  expect(screen.getByText('€9 / month')).toBeTruthy();
  expect(screen.queryByText('More space')).toBeNull();
  expect(screen.getByText('Priority help')).toBeTruthy();
});

it('forwards explicit actions and composes consumer billing controls and footer', () => {
  const purchase = jest.fn();
  const more = jest.fn();
  const screen = wrap(
    <SubscriptionPlans
      productName="Example"
      plans={plans}
      value="basic"
      onValueChange={jest.fn()}
      selectorLabel="Plan"
      controls={<View testID="billing" />}
      footer={<View testID="footer" />}
      terms="Terms apply"
      primaryAction={{ label: 'Continue', onPress: purchase }}
      moreBenefits={{ label: 'Explore benefits', onPress: more }}
    />,
  );
  fireEvent.press(screen.getByText('Continue'));
  fireEvent.press(screen.getByText('Explore benefits'));
  expect(purchase).toHaveBeenCalledTimes(1);
  expect(more).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('billing')).toBeTruthy();
  expect(screen.getByTestId('footer')).toBeTruthy();
  expect(screen.getByText('Terms apply')).toBeTruthy();
});

it.each(['missing', 'disabled', 'loading'])(
  'prevents purchase for %s selection without fabricating a plan',
  (state) => {
    const screen = wrap(
      <SubscriptionPlans
        productName="Example"
        plans={state === 'disabled' ? [{ ...plans[0]!, disabled: true }] : plans}
        value={state === 'missing' ? 'unknown' : 'basic'}
        onValueChange={jest.fn()}
        selectorLabel="Plan"
        fallback={<View testID="fallback" />}
        primaryAction={{ label: 'Continue', onPress: jest.fn(), loading: state === 'loading' }}
      />,
    );
    const button = screen
      .UNSAFE_getAllByType(Button)
      .find((node) => node.props.children === 'Continue');
    expect(button?.props.disabled).toBe(true);
    expect(button?.props.onPress).toBeUndefined();
    if (state === 'missing') {
      expect(screen.getByTestId('fallback')).toBeTruthy();
      expect(screen.queryByText('€4 / month')).toBeNull();
    }
  },
);

it('uses the same standard title typography for product and selected plan', () => {
  const screen = wrap(
    <SubscriptionPlans
      productName="Example"
      plans={plans}
      value="basic"
      onValueChange={jest.fn()}
      selectorLabel="Plan"
    />,
  );
  const heading = screen.getAllByRole('header')[0]!;
  const plan = screen
    .getAllByText('Basic')
    .find((node) => heading.findAll((child) => child === node).length > 0);
  expect(plan).toBeDefined();
  const headingStyle = StyleSheet.flatten(heading.props.style);
  const planStyle = StyleSheet.flatten(plan!.props.style);
  for (const key of ['fontSize', 'fontWeight', 'lineHeight'] as const) {
    expect(headingStyle[key]).toBe(TYPE_SCALE['display-4-semibold'][key]);
    expect(planStyle[key]).toBe(headingStyle[key]);
  }
  expect(planStyle.fontFamily).toBe(headingStyle.fontFamily);
});

it('composes decorative media behind the hero and fades into the actual enclosing surface', () => {
  const screen = wrap(
    <SurfaceLevelProvider level={2} fill="#223344">
      <SubscriptionPlans
        productName="Example"
        plans={plans}
        value="basic"
        onValueChange={jest.fn()}
        selectorLabel="Plan"
        heroBackground={<View testID="video-slot" />}
        heroBackgroundHeight={280}
      />
    </SurfaceLevelProvider>,
  );
  const artwork = screen.getByTestId('subscription-plans-artwork', { includeHiddenElements: true });
  expect(StyleSheet.flatten(artwork.props.style)).toMatchObject({
    position: 'absolute',
    left: 0,
    right: 0,
    height: 280,
    overflow: 'hidden',
    pointerEvents: 'none',
  });
  expect(artwork.props['aria-hidden']).toBe(true);
  expect(screen.getByTestId('video-slot', { includeHiddenElements: true })).toBeTruthy();
  const fade = screen.UNSAFE_getByType(
    (EdgeScrim as unknown as { type: React.ComponentType }).type,
  );
  expect(fade.props.edge).toBe('bottom');
  expect(fade.props.color).toBe('#223344');
});

it('formats structured prices as one accessible amount and updates it with the selected plan', () => {
  const pricedPlans: SubscriptionPlan[] = plans.map((plan, index) => ({
    ...plan,
    price: {
      amount: index ? 29.99 : 9.99,
      currency: 'USD',
      locale: 'en-US',
      suffix: '/ month',
      description: 'Billed monthly',
    },
  }));
  const props = {
    productName: 'Example',
    plans: pricedPlans,
    selectorLabel: 'Plan',
    onValueChange: jest.fn(),
  };
  const screen = wrap(<SubscriptionPlans {...props} value="basic" />);
  expect(screen.getByLabelText('$9.99 / month')).toBeTruthy();
  expect(screen.getByText('Billed monthly')).toBeTruthy();
  expect(screen.queryByText('0')).toBeNull();
  screen.rerender(
    <BloomThemeProvider>
      <SubscriptionPlans {...props} value="plus" />
    </BloomThemeProvider>,
  );
  expect(screen.getByLabelText('$29.99 / month')).toBeTruthy();
  expect(screen.queryByLabelText('$9.99 / month')).toBeNull();
});
