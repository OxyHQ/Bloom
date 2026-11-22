import { CHECKOUT_DELIVERY_ORDER_CASES } from './checkout-delivery-order.cases';
import { describeNativeParity } from './support/native';

describeNativeParity(
  'Checkout summary, delivery slots and order confirmation',
  CHECKOUT_DELIVERY_ORDER_CASES,
);
