import React from 'react';

import { PromptInputBase } from './PromptInputBase';
import { PromptInputTextarea } from './Textarea';
import type { PromptInputProps } from './types';

/** React Native `PromptInput` — binds the base chrome to the RN textarea. */
export function PromptInput(props: PromptInputProps) {
  return <PromptInputBase {...props} Textarea={PromptInputTextarea} />;
}
PromptInput.displayName = 'PromptInput';
