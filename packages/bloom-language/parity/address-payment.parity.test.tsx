import { ADDRESS_PAYMENT_CASES } from './address-payment.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Addresses and payment methods', ADDRESS_PAYMENT_CASES);
