import { INPUT_CASES, INPUT_CASES_FOCUSED } from './inputs.cases';
import { describeWebParity } from './support/web';

describeWebParity('Inputs', [...INPUT_CASES, ...INPUT_CASES_FOCUSED]);
