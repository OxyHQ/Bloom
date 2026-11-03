import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Text } from '../typography';
import { CheckoutSheet } from './CheckoutSheet';
import { emptyCheckoutDraft, type CheckoutDraft, type CheckoutStep } from './model';

const meta: Meta = {
  title: 'Patterns/Checkout/Checkout Sheet',
  component: CheckoutSheet,
  parameters: { layout: 'fullscreen' },
};
export default meta;
const words: Record<string, string> = {
  'title.review': 'Review order',
  'title.confirmation': 'Confirm payment',
  'title.contact': 'Contact',
  'title.payment': 'Payment method',
  'title.terms': 'Terms',
  'section.contact': 'Contact',
  'section.payment': 'Payment method',
  'section.order': 'Order',
  'section.total': 'Order total',
  continue: 'Continue',
  pay: 'Pay',
  confirm: 'Confirm',
  dueToday: 'Due today',
  addCard: 'Add a card',
  terms: 'Terms',
  savedCard: 'Saved card',
  paymentHint: 'Choose a payment method',
  'result.success': 'Payment complete',
  'result.processing': 'Processing',
  'result.failure': 'Payment failed',
};
function Example() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('review');
  const [draft, setDraft] = useState<CheckoutDraft>({
    ...emptyCheckoutDraft(),
    email: 'buyer@example.test',
    card: { id: 'story-card', brand: 'Card', last4: '4242', saveForLater: false },
  });
  return (
    <View style={{ padding: 24, gap: 16 }}>
      <Text>Presentation fixture. No payment provider, network or account is connected.</Text>
      <Button
        onPress={() => {
          setStep('review');
          setOpen(true);
        }}
      >
        Open checkout
      </Button>
      <CheckoutSheet
        open={open}
        step={step}
        direction="forward"
        draft={draft}
        onDraft={setDraft}
        request={{
          merchant: 'Example shop',
          currency: 'USD',
          dueTodayMinorUnits: 2800,
          requiresShipping: false,
          paymentMethods: ['card'],
          items: [
            {
              id: 'item',
              name: 'Canvas bag',
              detail: 'Natural · One size',
              quantity: 1,
              amountMinorUnits: 2800,
            },
          ],
        }}
        savedCards={draft.card ? [draft.card] : []}
        paymentMethods={[
          {
            id: 'bank',
            label: 'Bank transfer',
            detail: 'Unavailable for this order',
            disabled: true,
          },
        ]}
        label={(key) => words[key] ?? key}
        formatAmount={(value, currency) =>
          new Intl.NumberFormat('en', { style: 'currency', currency }).format(value / 100)
        }
        onClose={() => setOpen(false)}
        onBack={() => setStep('review')}
        onStep={setStep}
        onAuthorize={() => setStep('success')}
        onCard={(card) => setDraft((value) => ({ ...value, card }))}
        cardEntry={<Text>Supply the external secure card fields here.</Text>}
      />
    </View>
  );
}
export const Controlled: StoryObj = { render: () => <Example /> };
