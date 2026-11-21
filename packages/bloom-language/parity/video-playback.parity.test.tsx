import { VIDEO_PLAYBACK_CASES } from './video-playback.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Video playback', VIDEO_PLAYBACK_CASES);
