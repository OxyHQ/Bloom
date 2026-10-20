import { Screen, ScreenScrollView } from '../screen/index.web';
import { AppShell } from '../app-shell/index.web';
import { ComposerLoader } from '../composer-loader/index.web';
import { ComposerPill } from '../composer-panel/index.web';
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
  Screen,
  ScreenScrollView,
  AppShell,
  ComposerLoader,
  ComposerPill,
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
