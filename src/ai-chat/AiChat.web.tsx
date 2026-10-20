import { Screen, ScreenScrollView } from '../screen/index.web';
import { ContentPanel } from '../content-panel/index.web';
import { AppShell } from '../app-shell/index.web';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip/index.web';
import { bindAiChat } from './bindAiChat';

/**
 * `ai-chat` — WEB binding: tooltips are the portaled DOM `Tooltip`. Named by
 * `.web` path because a bundler resolving `package.json#exports` applies no
 * platform extensions to relative specifiers.
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
