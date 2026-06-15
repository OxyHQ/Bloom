import { CenteredDialog } from '../dialog/index';
import { createCommand } from './Command';

export const Command = createCommand(CenteredDialog);

export type { CommandProps, CommandItem } from './types';
