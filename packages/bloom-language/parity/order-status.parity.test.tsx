import { ORDER_STATUS_CASES } from './order-status.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Order status', ORDER_STATUS_CASES);
