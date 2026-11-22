import { PRICE_PAYMENT_STATUS_CASES } from './price-payment-status.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Prices and payment status', PRICE_PAYMENT_STATUS_CASES);
