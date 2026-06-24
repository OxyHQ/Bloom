import { Dialog } from '../dialog/index.web';
import { createCommand } from './Command';

export const Command = createCommand(Dialog);

export type { CommandProps, CommandItem } from './types';
