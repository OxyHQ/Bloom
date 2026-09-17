import { ComposerLoader } from '../composer-loader/index.web';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu/index.web';
import { bindAgentChat } from './bindAgentChat';

/**
 * `agent-chat` — WEB binding: the DOM-`<svg>` `ComposerLoader` on CSS keyframes,
 * and `DropdownMenu`'s anchored `FloatingPanel`. Named by `.web` path because a
 * bundler resolving `package.json#exports` applies no platform extensions to
 * relative specifiers.
 */
const parts = bindAgentChat({
  ComposerLoader,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
});

export const AgentChat = parts.AgentChat;
export const AgentChatActions = parts.AgentChatActions;
export const AgentChatHistory = parts.AgentChatHistory;
export const AgentChatComposer = parts.AgentChatComposer;
