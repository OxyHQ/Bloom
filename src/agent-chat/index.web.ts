// Web variant of the `./agent-chat` barrel: binds the web ComposerLoader and
// DropdownMenu (`AgentChat.web`), reachable by a bundler resolving
// `package.json#exports` only through this file.
export {
  AgentChat,
  AgentChatActions,
  AgentChatComposer,
  AgentChatHistory,
} from './AgentChat.web';
export { AgentChatMessage } from './AgentChatMessage';
export type {
  AgentChatAccount,
  AgentChatAccountMenuItem,
  AgentChatActionsLabels,
  AgentChatActionsProps,
  AgentChatComposerLabels,
  AgentChatComposerProps,
  AgentChatHistoryLabels,
  AgentChatHistoryProps,
  AgentChatLabels,
  AgentChatMessageData,
  AgentChatMessageLabels,
  AgentChatMessageProps,
  AgentChatProps,
  AgentChatStatus,
  AgentChatThread,
  AgentChatUsageRow,
} from './types';
