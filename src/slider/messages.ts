import { defineMessages, type MessageCatalog } from '../locale/messages';

/** A range slider's thumb names, in each Bloom language. `thumbLabels` still wins. */
export interface SliderMessages {
  minimum: string;
  maximum: string;
  /** A thumb beyond the named pair: "Value 3". */
  value: (position: number) => string;
}

export const SLIDER_MESSAGES: MessageCatalog<SliderMessages> = defineMessages<SliderMessages>('SLIDER_MESSAGES', { minimum: 'Minimum', maximum: 'Maximum', value: (n) => `Value ${n}` });
