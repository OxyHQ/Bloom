import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SubscriptionPlans } from './index';
const meta: Meta<typeof SubscriptionPlans> = {
  title: 'Commerce/Subscription Plans',
  component: SubscriptionPlans,
};
export default meta;
type Story = StoryObj<typeof SubscriptionPlans>;
function Plans() {
  const [value, setValue] = useState('basic');
  return (
    <SubscriptionPlans
      productName="Example"
      value={value}
      onValueChange={setValue}
      selectorLabel="Choose a plan"
      plans={[
        {
          id: 'basic',
          label: 'Basic',
          subtitle: 'Room for everyday life',
          price: { amount: 9.99, currency: 'USD', locale: 'en-US', suffix: '/ month' },
          benefits: [
            { id: 'storage', title: 'More storage', description: 'Keep your files together' },
          ],
        },
        {
          id: 'plus',
          label: 'Plus',
          subtitle: 'More room to create',
          price: { amount: 29.99, currency: 'USD', locale: 'en-US', suffix: '/ month' },
          benefits: [
            { id: 'support', title: 'Priority help', description: 'Help when you need it' },
          ],
        },
      ]}
      primaryAction={{ label: 'Continue', onPress: () => {} }}
    />
  );
}
export const Default: Story = { render: () => <Plans /> };
