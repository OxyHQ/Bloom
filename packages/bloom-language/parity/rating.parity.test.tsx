import { RATING_CASES } from './rating.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Ratings', RATING_CASES);
