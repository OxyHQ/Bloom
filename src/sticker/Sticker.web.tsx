import { createSticker } from './create-sticker';
import { loadLottiePlayer, warnLottieUnavailable } from './lottie-module.web';

/** A sticker, animated with `@lottiefiles/dotlottie-react` when it is installed. */
export const Sticker = createSticker({ loadLottiePlayer, warnLottieUnavailable });
