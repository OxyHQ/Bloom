import { Screen, ScreenScrollView } from '../screen/index';
import { AppShell } from '../app-shell';
import { ComposerLoader } from '../composer-loader';
import { ComposerPill } from '../composer-panel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { bindAgentChat } from './bindAgentChat';

/**
 * `agent-chat` — NATIVE binding: the composer light band is the react-native-svg
 * `ComposerLoader`, and menus open as `DropdownMenu`'s native sheet. The
 * implementation is the shared `*Base` files; this only names the platform's
 * forked families.
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
