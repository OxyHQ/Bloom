import { BOOKING_CASES } from './booking.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Booking', BOOKING_CASES);
