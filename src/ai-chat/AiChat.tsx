import { Screen, ScreenScrollView } from '../screen/index';
import { ContentPanel } from '../content-panel';
import { AppShell } from '../app-shell';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';
import { bindAiChat } from './bindAiChat';

/**
 * `ai-chat` — NATIVE binding: tooltips are the native `Tooltip`. The
 * implementation is the shared `*Base` files; this only names the platform's
 * forked family.
 */
const parts = bindAiChat({
  Screen,
  ScreenScrollView,
  AppShell,
  Tooltip,
  TooltipTrigger,
  TooltipTextBubble,
  ContentPanel,
});
export const AiChatShell = parts.AiChatShell;

export const AiChatFeedbackRow = parts.AiChatFeedbackRow;
export const AiChatUserMessage = parts.AiChatUserMessage;
export const AiChatAssistantMessage = parts.AiChatAssistantMessage;
export const AiChatImageGeneration = parts.AiChatImageGeneration;
export const AiChatGalleryPanel = parts.AiChatGalleryPanel;
export const AiChatContainer = parts.AiChatContainer;

export const AiChatCodePanel = parts.AiChatCodePanel;
export const AiChatThread = parts.AiChatThread;
