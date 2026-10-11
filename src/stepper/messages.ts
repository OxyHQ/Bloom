import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The stepper's button names, in each Bloom language. `decrementLabel` and
 * `incrementLabel` still win; the trash button says the common "Remove".
 */
export interface StepperMessages {
  decrease: string;
  increase: string;
}

export const STEPPER_MESSAGES: MessageCatalog<StepperMessages> = defineMessages<StepperMessages>(
  'STEPPER_MESSAGES',
  { decrease: 'Decrease', increase: 'Increase' },
);
