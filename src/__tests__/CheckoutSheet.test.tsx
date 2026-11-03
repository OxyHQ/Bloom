import type React from 'react';
import { Modal, Text } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { CheckoutSheet, emptyCheckoutDraft, type CheckoutSheetProps } from '../checkout-sheet';
import { Dialog } from '../dialog';
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

it('keeps result status in the footer and allows host-owned illustrations without a duplicate glyph', () => {
  const input = props();
  const view = render(<CheckoutSheet {...input} step="success" />, { wrapper });
  expect(view.queryByTestId('bloom-checkout-result-tile')).toBeNull();
  expect(view.getByText('result.success')).toBeTruthy();
  view.rerender(
    <CheckoutSheet {...input} step="failure" resultIllustration={<Text>Host artwork</Text>} />,
  );
  expect(view.getByText('Host artwork')).toBeTruthy();
  expect(view.queryByTestId('bloom-checkout-result-tile')).toBeNull();
});

it('uses a canonical account row in place of guest contact collection', () => {
  const input = props();
  input.request.requiresContact = false;
  input.accountSummary = { name: 'Account name', detail: 'Known account' };
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.getByText('Account name')).toBeTruthy();
  expect(view.queryByText('section.contact')).toBeNull();
  fireEvent.press(view.getByText('continue'));
  expect(input.onStep).toHaveBeenCalledWith('payment');
});
it('lists allowed methods and keeps the add-card row with or without saved cards', () => {
  const input = props();
  input.step = 'payment';
  input.request.paymentMethods = ['card', 'account'];
  input.paymentMethods = [
    { id: 'account', label: 'Bank option', kind: 'account' },
    { id: 'wallet', label: 'Unavailable option', kind: 'wallet' },
  ];
  input.onMethod = jest.fn();
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.queryByText('Unavailable option')).toBeNull();
  fireEvent.press(view.getByText('Bank option'));
  expect(input.onMethod).toHaveBeenCalledWith('account');
  expect(input.onAuthorize).not.toHaveBeenCalled();
  fireEvent.press(view.getByText('addCard'));
  expect(input.onStep).toHaveBeenCalledWith('card');
  const card = { id: 'known', brand: 'Card', last4: '1234', saveForLater: true };
  view.rerender(<CheckoutSheet {...input} savedCards={[card]} />);
  fireEvent.press(view.getByText('Card ···· 1234'));
  expect(input.onCard).toHaveBeenCalledWith(card);
  expect(input.onStep).toHaveBeenCalledWith('review');
  expect(view.getByText('addCard')).toBeTruthy();
});

it('vetoes backdrop, native Back and stale close callbacks while processing, but allows terminal dismissal', () => {
  const input = props();
  const view = render(<CheckoutSheet {...input} step="review" />, { wrapper });
  const earlierClose = view.UNSAFE_getByType(Dialog).props.onClose;
  view.rerender(<CheckoutSheet {...input} step="processing" />);
  fireEvent.press(view.getByLabelText('Dismiss'));
  act(() => view.UNSAFE_getByType(Modal).props.onRequestClose());
  act(() => earlierClose());
  expect(input.onClose).not.toHaveBeenCalled();
  expect(view.getByText('result.processing')).toBeTruthy();
  view.rerender(<CheckoutSheet {...input} step="failure" />);
  act(() => earlierClose());
  expect(input.onClose).toHaveBeenCalledTimes(1);
});
it('renders an explicitly quoted full order total separately from the installment due today', () => {
  const input = props();
  input.request.totalMinorUnits = 2800;
  input.request.dueTodayMinorUnits = 700;
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.getByText('orderTotal')).toBeTruthy();
  expect(input.formatAmount).toHaveBeenCalledWith(2800, 'JPY');
  expect(input.formatAmount).toHaveBeenCalledWith(700, 'JPY');
});

it('opens supplied terms separately and returns without changing draft or authorizing', () => {
  const input = props();
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.queryByText('terms')).toBeNull();
  input.request.recurring = {
    amountMinorUnits: 599,
    interval: 'month',
    renewalTerms: 'Quoted renewal clause',
    cancellationTerms: 'Quoted cancellation clause',
  };
  view.rerender(<CheckoutSheet {...input} />);
  expect(view.queryByText('Quoted renewal clause')).toBeNull();
  fireEvent.press(view.getByText('terms'));
  expect(input.onStep).toHaveBeenLastCalledWith('terms');
  view.rerender(<CheckoutSheet {...input} step="terms" />);
  expect(view.getByText('Quoted renewal clause')).toBeTruthy();
  expect(view.getByText('Quoted cancellation clause')).toBeTruthy();
  act(() => view.UNSAFE_getByType(Dialog).props.header.onBack());
  expect(input.onBack).toHaveBeenCalledTimes(1);
  fireEvent.press(view.getByText('continue'));
  expect(input.onStep).toHaveBeenLastCalledWith('review');
  expect(input.onDraft).not.toHaveBeenCalled();
  expect(input.onAuthorize).not.toHaveBeenCalled();
});

it('renders host account supporting rows only for account checkout and delegates their action', () => {
  const input = props();
  const onPress = jest.fn();
  input.accountSummary = {
    name: 'Account',
    supportingRows: [{ id: 'balance', title: 'Wallet balance', value: '25 FAIR', onPress }],
  };
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.queryByText('Wallet balance')).toBeNull();
  view.rerender(
    <CheckoutSheet {...input} request={{ ...input.request, requiresContact: false }} />,
  );
  expect(view.getByText('25 FAIR')).toBeTruthy();
  fireEvent.press(view.getByText('Wallet balance'));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(input.onAuthorize).not.toHaveBeenCalled();
});

it('advances a selected card through the host with its updated draft, never authorizes selection', () => {
  const input = props();
  input.step = 'payment';
  input.onContinue = jest.fn();
  input.draft.paymentSelection = null;
  const card = { id: 'card-token', brand: 'Card', last4: '1234', saveForLater: false };
  input.savedCards = [card];
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  fireEvent.press(view.getByText('Card ···· 1234'));
  expect(input.onContinue).toHaveBeenCalledWith(
    expect.objectContaining({
      card,
      paymentSelection: expect.objectContaining({ id: 'card-token', method: 'card' }),
    }),
  );
  expect(input.onStep).not.toHaveBeenCalled();
  expect(input.onAuthorize).not.toHaveBeenCalled();
});
it('requires explicit confirmation and still routes missing prerequisites forward', () => {
  const input = props();
  input.step = 'confirmation';
  input.nextStep = 'confirmation';
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  fireEvent.press(view.getByText('continue'));
  expect(input.onStep).toHaveBeenLastCalledWith('contact');
  expect(input.onAuthorize).not.toHaveBeenCalled();
  input.draft.email = 'payer@example.test';
  input.draft.card = { id: 'card-token', brand: 'Card', last4: '1234', saveForLater: false };
  view.rerender(<CheckoutSheet {...input} />);
  expect(view.queryByText('Item')).toBeNull();
  expect(view.getByText('Card ···· 1234')).toBeTruthy();
  expect(input.onAuthorize).not.toHaveBeenCalled();
  fireEvent.press(view.getByText('payAmount'));
  expect(input.onAuthorize).toHaveBeenCalledTimes(1);
});

it('displays quoted inclusive tax without adding it again to the total due', () => {
  const input = props();
  input.request.tax = {
    subtotalMinorUnits: 557,
    taxMinorUnits: 42,
    totalMinorUnits: 599,
    inclusive: true,
  };
  input.request.taxDescription = 'fallback';
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  const block = within(view.getByTestId('bloom-checkout-order-total'));
  expect(block.getByText('557 JPY')).toBeTruthy();
  expect(block.getByText('42 JPY')).toBeTruthy();
  expect(block.getByText('599 JPY')).toBeTruthy();
  const rendered = JSON.stringify(view.toJSON());
  expect(rendered.indexOf('subtotal')).toBeLessThan(rendered.indexOf('taxIncluded'));
  expect(rendered.indexOf('taxIncluded')).toBeLessThan(rendered.indexOf('orderTotal'));
  expect(view.queryByText('fallback')).toBeNull();
  expect(input.formatAmount).not.toHaveBeenCalledWith(641, 'JPY');
  expect(input.formatAmount).toHaveBeenCalledWith(599, 'JPY');
});

it('distinguishes a quoted zero tax from tax that has not been supplied', () => {
  const input = props();
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.queryByText('taxIncluded')).toBeNull();
  view.rerender(
    <CheckoutSheet
      {...input}
      request={{
        ...input.request,
        tax: { subtotalMinorUnits: 599, taxMinorUnits: 0, totalMinorUnits: 599, inclusive: true },
      }}
    />,
  );
  expect(within(view.getByTestId('bloom-checkout-order-total')).getByText('0 JPY')).toBeTruthy();
});

it('keeps provider fields mounted while blocking dismissal during host confirmation', () => {
  const input = props();
  input.step = 'card';
  input.cardEntry = <Text>Secure provider fields</Text>;
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  const fields = view.getByText('Secure provider fields');
  const close = view.UNSAFE_getByType(Dialog).props.onClose;
  const back = view.UNSAFE_getByType(Dialog).props.header.onBack;
  view.rerender(<CheckoutSheet {...input} interactionBlocked />);
  fireEvent.press(view.getByLabelText('Dismiss'));
  act(() => {
    view.UNSAFE_getByType(Modal).props.onRequestClose();
    close();
    back();
  });
  expect(view.getByText('Secure provider fields')).toBe(fields);
  expect(input.onClose).not.toHaveBeenCalled();
  expect(input.onBack).not.toHaveBeenCalled();
  expect(view.UNSAFE_getByType(Dialog).props.header.showClose).toBe(false);
  view.rerender(<CheckoutSheet {...input} interactionBlocked={false} />);
  act(() => close());
  expect(input.onClose).toHaveBeenCalledTimes(1);
});
it('groups recurring amount and supplied first-payment date after today total just before Continue', () => {
  const input = props();
  input.request.requiresContact = false;
  input.accountSummary = { name: 'Buyer account' };
  input.request.recurring = {
    amountMinorUnits: 599,
    interval: 'month',
    startsOn: 'Quoted first payment date',
  };
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  const rendered = JSON.stringify(view.toJSON());
  expect(rendered.indexOf('Buyer account')).toBeLessThan(rendered.indexOf('recurring'));
  expect(rendered.lastIndexOf('dueToday')).toBeLessThan(rendered.indexOf('recurring'));
  expect(rendered.indexOf('recurring')).toBeLessThan(rendered.indexOf('Quoted first payment date'));
  expect(rendered.indexOf('Quoted first payment date')).toBeLessThan(rendered.indexOf('continue'));
  expect(view.getByText('starts')).toBeTruthy();
});

it('centers confirmation and opted-in method headings without changing form headings', () => {
  const input = props();
  input.step = 'confirmation';
  const view = render(<CheckoutSheet {...input} />, { wrapper });
  expect(view.UNSAFE_getByType(Dialog).props.header.largeTitleAlign).toBe('center');
  view.rerender(<CheckoutSheet {...input} step="method" methodTitleAlign="center" />);
  expect(view.UNSAFE_getByType(Dialog).props.header.largeTitleAlign).toBe('center');
  view.rerender(<CheckoutSheet {...input} step="contact" methodTitleAlign="center" />);
  expect(view.UNSAFE_getByType(Dialog).props.header.largeTitleAlign).toBeUndefined();
});
