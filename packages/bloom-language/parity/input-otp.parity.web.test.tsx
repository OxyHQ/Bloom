import { INPUT_OTP_CASES, INPUT_OTP_CASES_FOCUSED } from './input-otp.cases';
import { describeWebParity } from './support/web';

describeWebParity('One-time codes', [...INPUT_OTP_CASES, ...INPUT_OTP_CASES_FOCUSED]);
