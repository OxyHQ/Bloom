import {
  checkoutSections,
  emptyCheckoutDraft,
  nextCheckoutStep,
  type CheckoutRequest,
} from '../checkout-sheet/model';
const request: CheckoutRequest = {
  merchant: 'Shop',
  currency: 'USD',
  dueTodayMinorUnits: 599,
  items: [],
  requiresShipping: false,
  paymentMethods: ['card', 'account', 'wallet'],
};
it('requires contact only when the host requests guest collection', () => {
  const draft = emptyCheckoutDraft();
  expect(nextCheckoutStep(request, draft)).toBe('contact');
  expect(nextCheckoutStep({ ...request, requiresContact: false }, draft)).toBe('payment');
  expect(checkoutSections({ ...request, requiresContact: false })).toEqual(['payment']);
});
it('accepts only an explicitly available selected method and does not fall back after selection is cleared', () => {
  const draft = {
    ...emptyCheckoutDraft(),
    email: 'guest@example.test',
    card: { id: 'card', brand: 'Card', last4: '1234', saveForLater: false },
    paymentSelection: { id: 'external', method: 'wallet', label: 'External wallet' },
  };
  expect(nextCheckoutStep(request, draft)).toBe('review');
  expect(nextCheckoutStep({ ...request, paymentMethods: ['card'] }, draft)).toBe('payment');
  expect(nextCheckoutStep(request, { ...draft, paymentSelection: null })).toBe('payment');
});
it('keeps physical fulfillment prerequisites when account contact is already known', () => {
  const physical = { ...request, requiresContact: false, requiresShipping: true };
  expect(checkoutSections(physical)).toEqual(['shipping', 'delivery', 'payment']);
  expect(nextCheckoutStep(physical, emptyCheckoutDraft())).toBe('shipping');
});
