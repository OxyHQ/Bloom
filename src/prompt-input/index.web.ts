// Web variant of the `./prompt-input` barrel.
//
// `Textarea.web.tsx` attaches a real DOM `paste` listener so `onImagePaste`
// fires and pasted images become attachments; the React Native input has no
// equivalent. Metro-web picked the fork up by platform extension, but every
// OTHER web bundler (Vite, webpack, SSR) resolves the package `import`
// condition, which pointed at the native build — so the feature was silently
// absent there. The `browser` condition in `package.json`'s
// `exports['./prompt-input']` is what closes that.
export { PromptInput } from './PromptInput.web';
export { PromptInputTextarea } from './Textarea.web';
export { PromptInputActions } from './Actions';
export { PromptInputAttachments } from './Attachments';
export { PromptInputSubmitButton } from './SubmitButton';
export {
  usePromptInput,
  type PromptInputAttachment,
  type PromptInputContextType,
} from './context';
export type {
  PromptInputProps,
  PromptInputTextareaProps,
  PromptInputSubmitButtonProps,
  PromptInputActionsProps,
  PromptInputAttachmentsProps,
} from './types';
