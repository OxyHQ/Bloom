import { CHECKOUT_DELIVERY_ORDER_CASES } from './checkout-delivery-order.cases';
import { describeWebParity } from './support/web';

describeWebParity(
  'Checkout summary, delivery slots and order confirmation',
  CHECKOUT_DELIVERY_ORDER_CASES,
);
