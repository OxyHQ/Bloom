import React from 'react';

import { PromptInputBase } from './PromptInputBase';
import { PromptInputTextarea } from './Textarea.web';
import type { PromptInputProps } from './types';

/**
 * Web `PromptInput` — same chrome, bound to the web textarea fork.
 *
 * The fork is not cosmetic: `Textarea.web.tsx` attaches a `paste` listener to
 * the real DOM node so `onImagePaste` fires, which the RN input cannot do.
 * Without this binding a Vite/webpack/SSR consumer resolving the package
 * `import` condition got the native textarea and silently lost the feature.
 */
export function PromptInput(props: PromptInputProps) {
  return <PromptInputBase {...props} Textarea={PromptInputTextarea} />;
}
PromptInput.displayName = 'PromptInput';
