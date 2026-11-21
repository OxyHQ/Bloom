import { INPUT_CASES, INPUT_CASES_FOCUSED } from './inputs.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Inputs', [...INPUT_CASES, ...INPUT_CASES_FOCUSED]);
