import { usePopover } from '../popover/context';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/index.web';
import { createCombobox } from './Combobox';

export const Combobox = createCombobox({ Popover, PopoverTrigger, PopoverContent, usePopover });

export type { ComboboxProps, ComboboxOption } from './types';
