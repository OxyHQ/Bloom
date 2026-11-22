import { MEDIA_PLAYER_CASES } from './media-player.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Media player', MEDIA_PLAYER_CASES);
