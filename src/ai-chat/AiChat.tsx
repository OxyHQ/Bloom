import { ContentPanel } from '../content-panel';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';
import { bindAiChat } from './bindAiChat';

/**
 * `ai-chat` — NATIVE binding: tooltips are the native `Tooltip`. The
 * implementation is the shared `*Base` files; this only names the platform's
 * forked family.
 */
const parts = bindAiChat({ Tooltip, TooltipTrigger, TooltipTextBubble, ContentPanel });

export const AiChatFeedbackRow = parts.AiChatFeedbackRow;
export const AiChatAssistantMessage = parts.AiChatAssistantMessage;
export const AiChatImageGeneration = parts.AiChatImageGeneration;
export const AiChatGalleryPanel = parts.AiChatGalleryPanel;
export const AiChatContainer = parts.AiChatContainer;
