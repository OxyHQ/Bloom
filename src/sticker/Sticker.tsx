import { createSticker } from './create-sticker';
import { loadLottiePlayer, warnLottieUnavailable } from './lottie-module';

/** A sticker, animated with `lottie-react-native` when it is installed. */
export const Sticker = createSticker({ loadLottiePlayer, warnLottieUnavailable });
