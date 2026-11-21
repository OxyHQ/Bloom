import { BUTTON_CASES } from './button.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Button draws Bloom’s Button in every variant', BUTTON_CASES);
