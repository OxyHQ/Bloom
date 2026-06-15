import * as Popover from '../popover/index';
import { createCombobox } from './Combobox';

export const Combobox = createCombobox(Popover);

export type { ComboboxProps, ComboboxOption } from './types';
