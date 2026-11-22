import { PRICE_PAYMENT_STATUS_CASES } from './price-payment-status.cases';
import { describeWebParity } from './support/web';

describeWebParity('Prices and payment status', PRICE_PAYMENT_STATUS_CASES);
