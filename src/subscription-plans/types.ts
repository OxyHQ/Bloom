import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface SubscriptionBenefit {
  id: string;
  title: string;
  description?: string;
  /** Decorative artwork or a Bloom icon. */
  icon?: ReactNode;
}

export interface SubscriptionPriceValue {
  amount: number;
  currency: string;
  locale?: string;
  suffix?: string;
  description?: string;
}

export interface SubscriptionPlan {
  id: string;
  label: string;
  subtitle?: string;
  /** Already formatted/localized by the consumer; no currency or billing assumptions. */
  price?: ReactNode | SubscriptionPriceValue;
  benefits: ReadonlyArray<SubscriptionBenefit>;
  disabled?: boolean;
}

export interface SubscriptionPlansProps {
  productName: string;
  /** Decorative artwork/video; media loading and playback belong to the host. */
  heroBackground?: ReactNode;
  /** Height of the artwork and its surface fade. Defaults to 260. */
  heroBackgroundHeight?: number;
  plans: ReadonlyArray<SubscriptionPlan>;
  /** Controlled plan identity. An unknown value shows no plan or enabled purchase action. */
  value: string;
  onValueChange: (value: string) => void;
  selectorLabel: string;
  /** Optional audience/billing-period controls, before the plan selector. */
  controls?: ReactNode;
  primaryAction?: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };
  moreBenefits?: { label: string; onPress: () => void };
  terms?: ReactNode;
  footer?: ReactNode;
  /** Empty or unavailable selection content, never a fabricated price/plan. */
  fallback?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
