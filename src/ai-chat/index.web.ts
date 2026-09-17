// Web variant of the `./ai-chat` barrel: binds the web Tooltip (`AiChat.web`),
// reachable by a bundler resolving `package.json#exports` only through this file.
export {
  AiChatAssistantMessage,
  AiChatFeedbackRow,
  AiChatGalleryPanel,
  AiChatImageGeneration,
} from './AiChat.web';
export { AiChatCodePanel } from './AiChatCodePanel';
export { AiChatContainer, AiChatThread } from './AiChatContainer';
export {
  AiChatBullet,
  AiChatBulletList,
  AiChatLinkChip,
  AiChatMessageLine,
  AiChatStrong,
  AiChatUserMessage,
} from './AiChatMessages';
export { AiChatMobileHeader, AiChatResizeHandle, AiChatShell } from './AiChatShell';
export type {
  AiChatAssistantMessageProps,
  AiChatBulletListProps,
  AiChatBulletProps,
  AiChatChangedFile,
  AiChatCodePanelLabels,
  AiChatCodePanelProps,
  AiChatContainerLabels,
  AiChatContainerProps,
  AiChatFeedbackLabels,
  AiChatFeedbackRowProps,
  AiChatGalleryPanelLabels,
  AiChatGalleryPanelProps,
  AiChatGeneration,
  AiChatIconComponent,
  AiChatImageGenerationLabels,
  AiChatImageGenerationProps,
  AiChatLinkChipProps,
  AiChatMessageLineProps,
  AiChatMobileHeaderProps,
  AiChatPanelAction,
  AiChatPanelTab,
  AiChatResizeHandleProps,
  AiChatShellLabels,
  AiChatShellProps,
  AiChatStrongProps,
  AiChatThreadProps,
  AiChatUserMessageProps,
} from './types';
