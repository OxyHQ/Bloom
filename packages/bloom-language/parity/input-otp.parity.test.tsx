import { INPUT_OTP_CASES, INPUT_OTP_CASES_FOCUSED } from './input-otp.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('One-time codes', [...INPUT_OTP_CASES, ...INPUT_OTP_CASES_FOCUSED]);
