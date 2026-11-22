import { MEDIA_CARD_CASES, MEDIA_CARD_MOVING_CASES } from './media-cards.cases';
import { describeWebParity } from './support/web';

describeWebParity('Media cards', [...MEDIA_CARD_CASES, ...MEDIA_CARD_MOVING_CASES]);
