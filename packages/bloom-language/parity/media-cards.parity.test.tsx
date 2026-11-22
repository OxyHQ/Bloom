import { MEDIA_CARD_CASES, MEDIA_CARD_MOVING_CASES } from './media-cards.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Media cards', [...MEDIA_CARD_CASES, ...MEDIA_CARD_MOVING_CASES]);
