import { Surface } from '../surface/index.web';
import { Button } from '../button/index.web';
import { createReactionPicker } from './create-reaction-picker';

export const ReactionPicker = createReactionPicker({ Surface, Button });
