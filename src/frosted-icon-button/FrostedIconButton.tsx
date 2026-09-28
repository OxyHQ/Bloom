import { Button } from '../button/Button';
import { createFrostedIconButton } from './FrostedIconButtonBase';
export type { FrostedIconButtonProps, FrostedIconButtonSize } from './types';
export const FrostedIconButton = createFrostedIconButton(Button);
