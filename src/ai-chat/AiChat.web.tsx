import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip/index.web';
import { bindAiChat } from './bindAiChat';

/**
 * `ai-chat` — WEB binding: tooltips are the portaled DOM `Tooltip`. Named by
 * `.web` path because a bundler resolving `package.json#exports` applies no
 * platform extensions to relative specifiers.
 */
const parts = bindAiChat({ Tooltip, TooltipTrigger, TooltipTextBubble });

export const AiChatFeedbackRow = parts.AiChatFeedbackRow;
export const AiChatAssistantMessage = parts.AiChatAssistantMessage;
export const AiChatImageGeneration = parts.AiChatImageGeneration;
export const AiChatGalleryPanel = parts.AiChatGalleryPanel;
