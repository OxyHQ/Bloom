import { EVICTION_CASES } from './eviction.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Evictions and place reviews', EVICTION_CASES);
