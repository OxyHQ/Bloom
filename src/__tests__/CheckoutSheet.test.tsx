import type React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { CheckoutSheet, emptyCheckoutDraft, type CheckoutSheetProps } from '../checkout-sheet';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const wrapper = ({ children }: React.PropsWithChildren) => (
  <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>
);
function props(): CheckoutSheetProps {
  return {
    open: true,
    request: {
      merchant: 'Shop',
      currency: 'JPY',
      dueTodayMinorUnits: 599,
      items: [
        { id: 'one', name: 'Item', detail: 'Description', quantity: 2, amountMinorUnits: 599 },
      ],
      requiresShipping: false,
      paymentMethods: ['card'],
    },
    draft: emptyCheckoutDraft(),
    step: 'review',
    direction: 'forward',
    savedCards: [],
    label: (key) => key,
    formatAmount: jest.fn((amount, currency) => `${amount} ${currency}`),
    onClose: jest.fn(),
    onBack: jest.fn(),
    onDraft: jest.fn(),
    onStep: jest.fn(),
    onAuthorize: jest.fn(),
    onCard: jest.fn(),
  };
}
it('navigates incomplete details without authorizing, and formats the unchanged quoted minor units', () => {
  const input = props();
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  fireEvent.press(view.getByText('continue'));
  expect(input.onStep).toHaveBeenCalledWith('contact');
  expect(input.onAuthorize).not.toHaveBeenCalled();
  expect(input.formatAmount).toHaveBeenCalledWith(599, 'JPY');
  expect(view.queryByText('section.shipping')).toBeNull();
  expect(view.queryByText('tax')).toBeNull();
});
it('confirms a zero-due recurring quote only by notifying the host', () => {
  const input = props();
  input.request.dueTodayMinorUnits = 0;
  input.request.recurring = { amountMinorUnits: 599, interval: 'month', startsOn: 'Tomorrow' };
  input.draft.email = 'person@example.test';
  input.draft.card = { id: 'token', brand: 'Card', last4: '1234', saveForLater: false };
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  fireEvent.press(view.getByText('confirmSubscription'));
  expect(input.onAuthorize).toHaveBeenCalledTimes(1);
  expect(view.queryByText('result.success')).toBeNull();
  expect(input.formatAmount).toHaveBeenCalledWith(0, 'JPY');
  expect(input.formatAmount).toHaveBeenCalledWith(599, 'JPY');
});
it('uses host-owned card entry and keeps branding in the fixed footer', () => {
  const input = props();
  input.step = 'card';
  input.cardEntry = <Text>Provider fields</Text>;
  input.footer = <Text>Brand mark</Text>;
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.getByText('Provider fields')).toBeTruthy();
  expect(
    view.getByTestId('bloom-dialog-footer').findByProps({ children: 'Brand mark' }),
  ).toBeTruthy();
  expect(input.onCard).not.toHaveBeenCalled();
});
it('shows physical-order sections and host tax treatment without adding its own charges', () => {
  const input = props();
  input.request.requiresShipping = true;
  input.request.taxDescription = 'Quoted tax treatment';
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.getByText('section.shipping')).toBeTruthy();
  expect(view.getByText('section.delivery')).toBeTruthy();
  expect(view.getByText('Quoted tax treatment')).toBeTruthy();
  expect(input.request.dueTodayMinorUnits).toBe(599);
});

it('shows navigation chrome only for editable or retry steps', () => {
  const input = props();
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.queryByTestId('dialog-nav')).toBeNull();
  view.rerender(<CheckoutSheet {...input} step="contact" />);
  expect(view.getByTestId('dialog-nav')).toBeTruthy();
  view.rerender(<CheckoutSheet {...input} step="processing" />);
  expect(view.queryByTestId('dialog-nav')).toBeNull();
});
