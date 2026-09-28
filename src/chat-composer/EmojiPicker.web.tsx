import { Surface } from '../surface/index.web';
import { Button } from '../button/index.web';
import { createEmojiPicker } from './create-emoji-picker';

export const EmojiPicker = createEmojiPicker({ Surface, Button });
