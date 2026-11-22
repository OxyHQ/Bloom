import { VOICE_CASES } from './voice.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Voice controls', VOICE_CASES);
